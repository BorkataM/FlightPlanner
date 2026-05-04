using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace FlightPlanner.Core.Entities
{
    [Index(nameof(IcaoCode), IsUnique = true)]
    public class Airport
    {
        public int Id { get; set; }

        [Required, StringLength(10)]
        public string IcaoCode { get; set; } = string.Empty;

        [StringLength(3)]
        public string? IataCode { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string Country { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public ICollection<Flight> DepartingFlights { get; set; } = new List<Flight>();
        public ICollection<Flight> ArrivingFlights { get; set; } = new List<Flight>();
    }
}