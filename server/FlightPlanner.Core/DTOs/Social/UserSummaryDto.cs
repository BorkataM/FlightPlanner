namespace FlightPlanner.Core.DTOs.Social
{
    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime FollowedAt { get; set; }
    }
}
