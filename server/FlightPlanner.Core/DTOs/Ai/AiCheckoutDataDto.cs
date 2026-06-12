namespace FlightPlanner.Core.DTOs.Ai
{
    public class AiCheckoutDataDto
    {
        public int FlightId { get; set; }
        public AiPassengerDto Passenger { get; set; } = new();
        public double? PriceUsd { get; set; }
        public string? DepartureCity { get; set; }
        public string? ArrivalCity { get; set; }
    }

    public class AiPassengerDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}
