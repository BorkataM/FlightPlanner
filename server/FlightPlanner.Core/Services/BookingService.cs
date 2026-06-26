using FlightPlanner.Core.DTOs.Booking;
using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;

namespace FlightPlanner.Core.Services
{
    public class BookingService : IBookingService
    {
        private readonly IBookingRepository _bookingRepository;

        public BookingService(IBookingRepository bookingRepository)
        {
            _bookingRepository = bookingRepository;
        }

        public async Task<BookingDto> CreateBookingAsync(int userId, CreateBookingDto dto)
        {
            var booking = new Booking
            {
                UserId = userId,
                FlightId = dto.FlightId,
                BookingDate = DateTime.UtcNow,
                SeatNumber = GenerateSeatNumber(),
                ConfirmationCode = GenerateConfirmationCode()
            };

            var created = await _bookingRepository.CreateAsync(booking);
            return MapToDto(created);
        }

        public async Task<IEnumerable<BookingDto>> GetUserBookingsAsync(int userId)
        {
            var bookings = await _bookingRepository.GetByUserIdAsync(userId);
            return bookings.Select(MapToDto);
        }

        private static string GenerateSeatNumber()
        {
            var row = Random.Shared.Next(1, 41);
            var col = (char)('A' + Random.Shared.Next(0, 6));
            return $"{row}{col}";
        }

        private static string GenerateConfirmationCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return new string(Enumerable.Range(0, 8)
                .Select(_ => chars[Random.Shared.Next(chars.Length)])
                .ToArray());
        }

        private static BookingDto MapToDto(Booking b) => new()
        {
            Id = b.Id,
            FlightId = b.FlightId,
            FlightNumber = b.Flight?.FlightNumber ?? string.Empty,
            DepartureAirport = b.Flight?.DepartureAirport?.Name ?? string.Empty,
            ArrivalAirport = b.Flight?.ArrivalAirport?.Name ?? string.Empty,
            DepartureAirportCode = b.Flight?.DepartureAirport?.IataCode ?? b.Flight?.DepartureAirport?.IcaoCode ?? string.Empty,
            ArrivalAirportCode = b.Flight?.ArrivalAirport?.IataCode ?? b.Flight?.ArrivalAirport?.IcaoCode ?? string.Empty,
            DepartureTime = b.Flight?.DepartureTime ?? default,
            ArrivalTime = b.Flight?.ArrivalTime ?? default,
            Price = b.Flight?.Price ?? 0,
            BookingDate = b.BookingDate,
            SeatNumber = b.SeatNumber,
            ConfirmationCode = b.ConfirmationCode
        };
    }
}
