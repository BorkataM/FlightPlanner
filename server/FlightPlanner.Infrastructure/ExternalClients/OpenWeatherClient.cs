using FlightPlanner.Core.DTOs.Weather;
using FlightPlanner.Core.Interfaces;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FlightPlanner.Infrastructure.ExternalClients
{
    public class OpenWeatherClient : IWeatherService
    {
        private readonly HttpClient _http;
        private readonly IFlightRepository _flights;
        private readonly string _apiKey;

        private static readonly JsonSerializerOptions _camel = new()
        {
            PropertyNameCaseInsensitive = true,
            Converters = { new OWMDateTimeConverter() },
        };

        private class OWMDateTimeConverter : JsonConverter<DateTime>
        {
            private const string Fmt = "yyyy-MM-dd HH:mm:ss";
            public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
                => DateTime.ParseExact(
                    reader.GetString() ?? string.Empty, Fmt, null,
                    System.Globalization.DateTimeStyles.AssumeUniversal |
                    System.Globalization.DateTimeStyles.AdjustToUniversal);
            public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
                => writer.WriteStringValue(value.ToString(Fmt));
        }

        public OpenWeatherClient(HttpClient http, IFlightRepository flights, string apiKey)
        {
            _http    = http;
            _flights = flights;
            _apiKey  = apiKey;
        }

        public async Task<WeatherForecastDto> GetForecastAsync(
            double lat, double lon, DateOnly date, CancellationToken ct = default)
        {
            var url = $"/data/2.5/forecast?lat={lat}&lon={lon}&units=metric&appid={_apiKey}";
            var res = await _http.GetAsync(url, ct);
            res.EnsureSuccessStatusCode();

            var stream = await res.Content.ReadAsStreamAsync(ct);
            var root   = await JsonSerializer.DeserializeAsync<OWMForecastRoot>(stream, _camel, ct)
                         ?? throw new InvalidOperationException("Empty response from OpenWeatherMap.");

            // Pick the forecast point nearest noon on the requested date
            var target = date.ToDateTime(new TimeOnly(12, 0), DateTimeKind.Utc);
            var point  = root.List
                .OrderBy(p => Math.Abs((p.DtTxt - target).TotalSeconds))
                .FirstOrDefault()
                ?? throw new InvalidOperationException("No forecast points returned.");

            return Map(point, root.City?.Name ?? string.Empty);
        }

        public async Task<DelayRiskDto> GetDelayRiskAsync(int flightId, CancellationToken ct = default)
        {
            var flight = await _flights.GetByIdAsync(flightId)
                         ?? throw new KeyNotFoundException($"Flight {flightId} not found.");

            var dep     = flight.DepartureAirport;
            var depDate = DateOnly.FromDateTime(flight.DepartureTime);
            var weather = await GetForecastAsync(dep.Latitude, dep.Longitude, depDate, ct);

            var (risk, reason) = ClassifyRisk(weather);
            return new DelayRiskDto { Risk = risk, Reason = reason, DepartureWeather = weather };
        }

        public async Task<WeatherForecastDto> GetDestinationForecastAsync(int flightId, CancellationToken ct = default)
        {
            var flight = await _flights.GetByIdAsync(flightId)
                         ?? throw new KeyNotFoundException($"Flight {flightId} not found.");

            var arr     = flight.ArrivalAirport;
            var arrDate = DateOnly.FromDateTime(flight.ArrivalTime);
            return await GetForecastAsync(arr.Latitude, arr.Longitude, arrDate, ct);
        }

        public async Task<FlightGeoDto> GetFlightGeoAsync(int flightId, CancellationToken ct = default)
        {
            var flight = await _flights.GetByIdAsync(flightId)
                         ?? throw new KeyNotFoundException($"Flight {flightId} not found.");

            return new FlightGeoDto
            {
                Departure = new AirportGeoDto
                {
                    Lat      = flight.DepartureAirport.Latitude,
                    Lon      = flight.DepartureAirport.Longitude,
                    Name     = flight.DepartureAirport.Name,
                    City     = flight.DepartureAirport.City,
                    IataCode = flight.DepartureAirport.IataCode ?? string.Empty,
                },
                Arrival = new AirportGeoDto
                {
                    Lat      = flight.ArrivalAirport.Latitude,
                    Lon      = flight.ArrivalAirport.Longitude,
                    Name     = flight.ArrivalAirport.Name,
                    City     = flight.ArrivalAirport.City,
                    IataCode = flight.ArrivalAirport.IataCode ?? string.Empty,
                },
            };
        }

        // Delay risk rules
        private static (string Risk, string Reason) ClassifyRisk(WeatherForecastDto w) =>
            w.Condition switch
            {
                "Thunderstorm" => ("High",   "Thunderstorms expected at departure airport"),
                "Snow"         => ("High",   "Snow conditions at departure airport"),
                "Fog"          => ("High",   "Low visibility due to fog"),
                _ when w.WindSpeedKmh > 50 => ("High", $"Strong winds ({w.WindSpeedKmh:F0} km/h)"),
                "Rain"         => ("Medium", "Rain at departure airport"),
                "Drizzle"      => ("Medium", "Drizzle at departure airport"),
                _ when w.WindSpeedKmh > 30 => ("Medium", $"Moderate winds ({w.WindSpeedKmh:F0} km/h)"),
                _              => ("Low",    "Conditions look good for departure"),
            };

        // OWM response models
        private static WeatherForecastDto Map(OWMPoint p, string city) => new()
        {
            TemperatureC    = p.Main?.Temp ?? 0,
            Condition       = p.Weather?.FirstOrDefault()?.Main ?? "Clear",
            Description     = p.Weather?.FirstOrDefault()?.Description ?? string.Empty,
            WindSpeedKmh    = Math.Round((p.Wind?.Speed ?? 0) * 3.6, 1),
            Humidity        = p.Main?.Humidity ?? 0,
            IconCode        = p.Weather?.FirstOrDefault()?.Icon ?? string.Empty,
            ForecastTimeUtc = p.DtTxt,
            City            = city,
        };

        private class OWMForecastRoot
        {
            [JsonPropertyName("list")]
            public List<OWMPoint> List { get; set; } = [];
            [JsonPropertyName("city")]
            public OWMCity? City { get; set; }
        }

        private class OWMCity
        {
            [JsonPropertyName("name")]
            public string? Name { get; set; }
        }

        private class OWMPoint
        {
            [JsonPropertyName("dt_txt")]
            public DateTime DtTxt { get; set; }
            [JsonPropertyName("main")]
            public OWMMain? Main { get; set; }
            [JsonPropertyName("weather")]
            public List<OWMWeather>? Weather { get; set; }
            [JsonPropertyName("wind")]
            public OWMWind? Wind { get; set; }
        }

        private class OWMMain
        {
            [JsonPropertyName("temp")]
            public double Temp { get; set; }
            [JsonPropertyName("humidity")]
            public int Humidity { get; set; }
        }

        private class OWMWeather
        {
            [JsonPropertyName("main")]
            public string? Main { get; set; }
            [JsonPropertyName("description")]
            public string? Description { get; set; }
            [JsonPropertyName("icon")]
            public string? Icon { get; set; }
        }

        private class OWMWind
        {
            [JsonPropertyName("speed")]
            public double Speed { get; set; }
        }
    }
}
