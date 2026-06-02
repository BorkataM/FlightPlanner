namespace FlightPlanner.Core.DTOs.Weather
{
    public class WeatherForecastDto
    {
        public double TemperatureC { get; set; }
        public string Condition { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public double WindSpeedKmh { get; set; }
        public int Humidity { get; set; }
        public string IconCode { get; set; } = string.Empty;
        public DateTime ForecastTimeUtc { get; set; }
        public string City { get; set; } = string.Empty;
    }
}
