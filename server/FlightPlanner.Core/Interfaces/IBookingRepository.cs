using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public interface IBookingRepository
    {
        Task<Booking> CreateAsync(Booking booking);
        Task<IEnumerable<Booking>> GetByUserIdAsync(int userId);
        Task<Booking?> GetByIdAsync(int id);
    }
}
