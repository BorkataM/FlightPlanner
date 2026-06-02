namespace FlightPlanner.Core.DTOs.Social
{
    public class UserStatsDto
    {
        public int    Id                     { get; set; }
        public string FirstName              { get; set; } = string.Empty;
        public string LastName               { get; set; } = string.Empty;
        public string Email                  { get; set; } = string.Empty;
        public int    FlightsCount           { get; set; }
        public int    CountriesVisited       { get; set; }
        public int    FollowersCount         { get; set; }
        public int    FollowingCount         { get; set; }
        public bool   IsFollowedByCurrentUser { get; set; }
    }
}
