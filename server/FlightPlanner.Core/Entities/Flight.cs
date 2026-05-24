using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace FlightPlanner.Core.Entities
{
    public class Flight
    {
        public int Id { get; set; }

        [Required]
        public string FlightNumber { get; set; } = string.Empty;

        public string? Airline { get; set; }
        public int? AirlineId { get; set; }
        public Airline? AirlineEntity { get; set; }

        public int DepartureAirportId { get; set; }
        public Airport DepartureAirport { get; set; } = null!;
        public int ArrivalAirportId { get; set; }
        public Airport ArrivalAirport { get; set; } = null!;
        public DateTime DepartureTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public decimal Price { get; set; }
        public int Stops { get; set; } = 0;
        public DateTime LastUpdated { get; set; }
        public FlightAnalytics? Analytics { get; set; }
        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    }
}
