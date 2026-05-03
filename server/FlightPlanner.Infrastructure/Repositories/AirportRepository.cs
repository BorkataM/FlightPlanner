using FlightPlanner.Core.DTOs;
using FlightPlanner.Core.Interfaces;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightPlanner.Infrastructure.Repositories
{
    public class AirportRepository : IAirportRepository
    {
        private readonly FlightPlannerDbContext _context;

        public AirportRepository(FlightPlannerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AirportDto>> SearchAirportsAsync(string query)
        {
            var normalizedQuery = query.ToLower();

            return await _context.Airports
                .Where(a => a.IataCode.ToLower().Contains(normalizedQuery) ||
                            a.City.ToLower().Contains(normalizedQuery) ||
                            a.Name.ToLower().Contains(normalizedQuery))
                .Take(10)
                .Select(a => new AirportDto
                {
                    IataCode = a.IataCode,
                    Name = a.Name,
                    City = a.City,
                    Country = a.Country
                })
                .ToListAsync();
        }

        public async Task<AirportDto?> GetByIataCodeAsync(string iataCode)
        {
            return await _context.Airports
                .Where(a => a.IataCode == iataCode.ToUpper())
                .Select(a => new AirportDto
                {
                    IataCode = a.IataCode,
                    Name = a.Name,
                    City = a.City,
                    Country = a.Country
                })
                .FirstOrDefaultAsync();
        }
    }
}