using System;
using System.Collections.Generic;
using System.Text;

namespace FlightPlanner.Core.Entities
{
    public class Airport
    {
        public int Id { get; set; }
        public string IataCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public ICollection<Flight> DepartingFlights { get; set; } = new List<Flight>();
        public ICollection<Flight> ArrivingFlights { get; set; } = new List<Flight>();
    }
}
