using System;
using System.Collections.Generic;
using System.Text;

namespace FlightPlanner.Core.Entities
{
    public class Flight
    {
        public int Id { get; set; }
        public string FlightNumber { get; set; } = string.Empty;
        public int AirlineId { get; set; }
        public Airline Airline { get; set; } = null!;

        public int OriginAirportId { get; set; }
        public Airport Origin { get; set; } = null!;

        public int DestinationAirportId { get; set; }
        public Airport Destination { get; set; } = null!;

        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string AircraftType { get; set; } = string.Empty;
        public string TravelClass { get; set; } = "Economy";

        public FlightAnalytics Analytics { get; set; } = null!;
    }
}
