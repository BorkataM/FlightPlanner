using System.Text.Json;

namespace FlightPlanner.Infrastructure.ExternalClients
{
    public class OpenSkyClient
    {
        private readonly HttpClient _httpClient;

        public OpenSkyClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.DefaultRequestHeaders.Add("User-Agent", "FlightPlanner-App");
        }

        public async Task<List<RawOpenSkyFlight>> GetFlightsOverEuropeAsync()
        {
            var url = "https://opensky-network.org/api/states/all?lamin=34.0&lomin=-10.0&lamax=71.0&lomax=40.0";

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode) return new List<RawOpenSkyFlight>();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var states = doc.RootElement.GetProperty("states");

            var flights = new List<RawOpenSkyFlight>();

            foreach (var state in states.EnumerateArray())
            {
                var callsign = state[1].GetString()?.Trim();
                if (string.IsNullOrEmpty(callsign)) continue;

                flights.Add(new RawOpenSkyFlight
                {
                    Icao24 = state[0].GetString() ?? "",
                    FlightNumber = callsign,
                    Longitude = state[5].GetDouble(),
                    Latitude = state[6].GetDouble()
                });
            }

            return flights;
        }
    }

    public class RawOpenSkyFlight
    {
        public string Icao24 { get; set; } = string.Empty;
        public string FlightNumber { get; set; } = string.Empty;
        public double Longitude { get; set; }
        public double Latitude { get; set; }
    }
}
