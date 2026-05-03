using System;
using System.Collections.Generic;
using System.Text;

namespace FlightPlanner.Core.Entities
{
    public class Airline
    {
        public int Id { get; set; }
        public string IcaoCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public decimal BaseFareModifier { get; set; } = 1.0m;
        public double EcoRating { get; set; }

        public ICollection<Flight> Flights { get; set; } = new List<Flight>();
    }
}
