using System.ComponentModel.DataAnnotations;

namespace FlightPlanner.Core.DTOs.Booking
{
    public class CreateBookingDto
    {
        [Required]
        public int FlightId { get; set; }
    }
}
