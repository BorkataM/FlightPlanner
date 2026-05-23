using FlightPlanner.Core.DTOs;

namespace FlightPlanner.Core.Interfaces
{
    public interface IAirportService
    {
        Task<IEnumerable<AirportDto>> SearchAirportsAsync(string query);
        Task<AirportDto?> GetAirportByIataAsync(string iataCode);
        Task<IEnumerable<AirportDto>> GetAllAirportsAsync();
    }
}
