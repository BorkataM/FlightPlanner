namespace FlightPlanner.Core.Entities
{
    public class Booking
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public int FlightId { get; set; }
        public Flight Flight { get; set; } = null!;

        public DateTime BookingDate { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string ConfirmationCode { get; set; } = string.Empty;
    }
}
