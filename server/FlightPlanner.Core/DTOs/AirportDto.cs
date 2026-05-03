using System;
using System.Collections.Generic;
using System.Text;

namespace FlightPlanner.Core.DTOs
{
    public class AirportDto
    {
        public string IataCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }
}
