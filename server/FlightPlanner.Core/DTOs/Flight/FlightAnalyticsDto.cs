namespace FlightPlanner.Core.DTOs.Flight
{
    public class FlightAnalyticsDto
    {
        public double? SmartScore { get; set; }
        public double? Co2Emissions { get; set; }
        public double? FuelEfficiency { get; set; }
        public double? DelayProbability { get; set; }
        public int? PredictedDelayMinutes { get; set; }
        public bool? IsEcoFriendly { get; set; }
        public bool? IsBestValue { get; set; }
    }
}
