using FlightPlanner.Core.DTOs.Weather;

namespace FlightPlanner.Core.Interfaces
{
    public interface IWeatherService
    {
        Task<WeatherForecastDto> GetForecastAsync(double lat, double lon, DateOnly date, CancellationToken ct = default);
        Task<DelayRiskDto> GetDelayRiskAsync(int flightId, CancellationToken ct = default);
        Task<WeatherForecastDto> GetDestinationForecastAsync(int flightId, CancellationToken ct = default);
        Task<FlightGeoDto> GetFlightGeoAsync(int flightId, CancellationToken ct = default);
    }
}
