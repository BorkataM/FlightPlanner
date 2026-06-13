using System.ComponentModel.DataAnnotations;

namespace FlightPlanner.Core.Entities
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        public string Email { get; set; } = string.Empty;

        public string? PasswordHash { get; set; }

        public string? GoogleId { get; set; }

        [Required]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        public string LastName { get; set; } = string.Empty;

        public int Age { get; set; }
        public DateTime CreatedAt { get; set; }

        public string? AvatarDataUrl { get; set; }
        public string? CoverImageDataUrl { get; set; }
        public string? CoverGradient { get; set; }
        public string? Bio { get; set; }

        public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

        public ICollection<UserFollow> Following { get; set; } = new List<UserFollow>();
        public ICollection<UserFollow> Followers { get; set; } = new List<UserFollow>();
    }
}
