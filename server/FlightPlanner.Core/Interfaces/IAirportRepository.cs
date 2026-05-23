using FlightPlanner.Core.DTOs;

namespace FlightPlanner.Core.Interfaces
{
    public interface IAirportRepository
    {
        Task<IEnumerable<AirportDto>> SearchAirportsAsync(string query);
        Task<AirportDto?> GetByIataCodeAsync(string iataCode);
        Task<IEnumerable<AirportDto>> GetAllAirportsAsync();
    }
}
