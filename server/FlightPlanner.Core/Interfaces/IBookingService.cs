using FlightPlanner.Core.DTOs.Booking;

namespace FlightPlanner.Core.Interfaces
{
    public interface IBookingService
    {
        Task<BookingDto> CreateBookingAsync(int userId, CreateBookingDto dto);
        Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId);
    }
}
