namespace FlightPlanner.Core.DTOs.Weather
{
    public class AirportGeoDto
    {
        public double Lat { get; set; }
        public double Lon { get; set; }
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string IataCode { get; set; } = string.Empty;
    }

    public class FlightGeoDto
    {
        public AirportGeoDto Departure { get; set; } = new();
        public AirportGeoDto Arrival { get; set; } = new();
    }
}
