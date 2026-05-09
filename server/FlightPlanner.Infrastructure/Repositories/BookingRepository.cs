using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightPlanner.Infrastructure.Repositories
{
    public class BookingRepository : IBookingRepository
    {
        private readonly FlightPlannerDbContext _context;

        public BookingRepository(FlightPlannerDbContext context)
        {
            _context = context;
        }

        public async Task<Booking> CreateAsync(Booking booking)
        {
            if (!await _context.Flights.AnyAsync(f => f.Id == booking.FlightId))
                throw new KeyNotFoundException($"Flight with ID {booking.FlightId} not found.");

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            return await _context.Bookings
                .Include(b => b.Flight)
                    .ThenInclude(f => f.DepartureAirport)
                .Include(b => b.Flight)
                    .ThenInclude(f => f.ArrivalAirport)
                .FirstAsync(b => b.Id == booking.Id);
        }

        public async Task<IEnumerable<Booking>> GetByUserIdAsync(int userId) =>
            await _context.Bookings
                .Include(b => b.Flight)
                    .ThenInclude(f => f.DepartureAirport)
                .Include(b => b.Flight)
                    .ThenInclude(f => f.ArrivalAirport)
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

        public async Task<Booking?> GetByIdAsync(int id) =>
            await _context.Bookings
                .Include(b => b.Flight)
                    .ThenInclude(f => f.DepartureAirport)
                .Include(b => b.Flight)
                    .ThenInclude(f => f.ArrivalAirport)
                .FirstOrDefaultAsync(b => b.Id == id);
    }
}
