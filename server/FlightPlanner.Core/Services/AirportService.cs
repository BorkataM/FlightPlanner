using FlightPlanner.Core.DTOs;
using FlightPlanner.Core.Interfaces;

namespace FlightPlanner.Core.Services
{
    public class AirportService : IAirportService
    {
        private readonly IAirportRepository _airportRepository;

        public AirportService(IAirportRepository airportRepository)
        {
            _airportRepository = airportRepository;
        }

        public async Task<IEnumerable<AirportDto>> SearchAirportsAsync(string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Enumerable.Empty<AirportDto>();
            }

            return await _airportRepository.SearchAirportsAsync(query);
        }

        public async Task<AirportDto?> GetAirportByIataAsync(string iataCode)
        {
            return await _airportRepository.GetByIataCodeAsync(iataCode);
        }
    }
}
