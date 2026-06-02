using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public record UserStatsRaw(
        int    Id,
        string FirstName,
        string LastName,
        string Email,
        int    FlightsCount,
        int    CountriesVisited,
        int    FollowersCount,
        int    FollowingCount);

    public record UserSearchRaw(
        int    Id,
        string FirstName,
        string LastName,
        string Email,
        int    FlightsCount,
        int    FollowersCount);

    public interface ISocialRepository
    {
        Task FollowAsync(int followerId, int followeeId);
        Task UnfollowAsync(int followerId, int followeeId);
        Task<bool> IsFollowingAsync(int followerId, int followeeId);
        Task<IEnumerable<UserFollow>> GetFollowersAsync(int userId);
        Task<IEnumerable<UserFollow>> GetFollowingAsync(int userId);
        Task<bool> UserExistsAsync(int userId);

        Task<UserStatsRaw?> GetUserStatsAsync(int userId);
        Task<IEnumerable<UserSearchRaw>> SearchUsersAsync(string query, int excludeUserId, int limit);
        Task<HashSet<int>> GetFollowedIdsAsync(int currentUserId, IEnumerable<int> candidateIds);
        Task<IEnumerable<string>> GetVisitedCountriesAsync(int userId);
    }
}
