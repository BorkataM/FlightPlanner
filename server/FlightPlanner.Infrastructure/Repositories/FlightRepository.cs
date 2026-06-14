using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightPlanner.Infrastructure.Repositories
{
    public class FlightRepository : IFlightRepository
    {
        private readonly FlightPlannerDbContext _context;

        public FlightRepository(FlightPlannerDbContext context)
        {
            _context = context;
        }

        private IQueryable<Flight> WithIncludes() =>
            _context.Flights
                .Include(f => f.DepartureAirport)
                .Include(f => f.ArrivalAirport)
                .Include(f => f.AirlineEntity)
                .Include(f => f.Analytics);

        public async Task<(IEnumerable<Flight> Flights, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var total = await _context.Flights.CountAsync();
            var flights = await WithIncludes()
                .OrderByDescending(f => f.LastUpdated)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (flights, total);
        }

        public async Task<Flight?> GetByIdAsync(int id) =>
            await WithIncludes().FirstOrDefaultAsync(f => f.Id == id);

        public async Task<IEnumerable<Flight>> GetSmartestAsync(int limit) =>
            await WithIncludes()
                .Where(f => f.Analytics != null)
                .OrderByDescending(f => f.Analytics!.SmartScore)
                .Take(limit)
                .ToListAsync();

        public async Task<IEnumerable<Flight>> SearchAsync(
            string? departureCode, string? arrivalCode, DateOnly? date, int limit)
        {
            var query = WithIncludes().AsQueryable();

            if (!string.IsNullOrWhiteSpace(departureCode))
            {
                var code = departureCode.ToUpperInvariant();
                query = query.Where(f =>
                    f.DepartureAirport.IcaoCode == code ||
                    f.DepartureAirport.IataCode == code);
            }

            if (!string.IsNullOrWhiteSpace(arrivalCode))
            {
                var code = arrivalCode.ToUpperInvariant();
                query = query.Where(f =>
                    f.ArrivalAirport.IcaoCode == code ||
                    f.ArrivalAirport.IataCode == code);
            }

            if (date.HasValue)
            {
                var start = date.Value.ToDateTime(TimeOnly.MinValue);
                var end   = date.Value.ToDateTime(TimeOnly.MaxValue);
                query = query.Where(f => f.DepartureTime >= start && f.DepartureTime <= end);
            }

            return await query
                .OrderBy(f => f.DepartureTime)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<IEnumerable<string>> GetDepartureCodesAsync() =>
            await _context.Flights
                .Include(f => f.DepartureAirport)
                .Where(f => f.DepartureAirport.IataCode != null)
                .Select(f => f.DepartureAirport.IataCode!)
                .Distinct()
                .ToListAsync();
    }
}
