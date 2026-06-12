namespace FlightPlanner.Core.DTOs.Booking
{
    public class BookingDto
    {
        public int Id { get; set; }
        public int FlightId { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public string DepartureAirport { get; set; } = string.Empty;
        public string ArrivalAirport { get; set; } = string.Empty;
        public string DepartureAirportCode { get; set; } = string.Empty;
        public string ArrivalAirportCode { get; set; } = string.Empty;
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public decimal Price { get; set; }
        public DateTime BookingDate { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string ConfirmationCode { get; set; } = string.Empty;
    }
}
