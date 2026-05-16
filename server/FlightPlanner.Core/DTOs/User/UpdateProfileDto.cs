using System.ComponentModel.DataAnnotations;

namespace FlightPlanner.Core.DTOs.User
{
    public class UpdateProfileDto
    {
        [Required, MinLength(1)]
        public string FirstName { get; set; } = string.Empty;

        [Required, MinLength(1)]
        public string LastName { get; set; } = string.Empty;

        [Range(1, 120)]
        public int Age { get; set; }
    }
}
