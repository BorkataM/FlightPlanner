namespace FlightPlanner.Core.DTOs.Weather
{
    public class DelayRiskDto
    {
        public string Risk { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public WeatherForecastDto DepartureWeather { get; set; } = new();
    }
}
