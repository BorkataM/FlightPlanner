using FlightPlanner.Core.DTOs.Social;

namespace FlightPlanner.Core.Interfaces
{
    public interface ISocialService
    {
        Task FollowAsync(int currentUserId, int targetUserId);
        Task UnfollowAsync(int currentUserId, int targetUserId);
        Task<bool> IsFollowingAsync(int currentUserId, int targetUserId);
        Task<IEnumerable<UserSummaryDto>> GetFollowersAsync(int userId);
        Task<IEnumerable<UserSummaryDto>> GetFollowingAsync(int userId);
    }
}
