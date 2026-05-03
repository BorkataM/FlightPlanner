using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FlightPlanner.Core.Entities
{
    public class FlightAnalytics
    {
        [Key, ForeignKey("Flight")]
        public int FlightId { get; set; }
        public Flight Flight { get; set; } = null!;

        public decimal BasePrice { get; set; }
        public double DelayProbability { get; set; }
        public int PredictedDelayMinutes { get; set; }
        public double Co2Emissions { get; set; }
        public double FuelEfficiency { get; set; }
        public double SmartScore { get; set; }

        public bool IsEcoFriendly { get; set; }
        public bool IsBestValue { get; set; }
    }
}
