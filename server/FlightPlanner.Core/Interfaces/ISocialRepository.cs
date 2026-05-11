using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public interface ISocialRepository
    {
        Task FollowAsync(int followerId, int followeeId);
        Task UnfollowAsync(int followerId, int followeeId);
        Task<bool> IsFollowingAsync(int followerId, int followeeId);
        Task<IEnumerable<UserFollow>> GetFollowersAsync(int userId);
        Task<IEnumerable<UserFollow>> GetFollowingAsync(int userId);
        Task<bool> UserExistsAsync(int userId);
    }
}
