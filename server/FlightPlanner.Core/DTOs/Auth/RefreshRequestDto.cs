using System.ComponentModel.DataAnnotations;

namespace FlightPlanner.Core.DTOs.Auth
{
    public class RefreshRequestDto
    {
        [Required]
        public string RefreshToken { get; set; } = string.Empty;
    }
}
