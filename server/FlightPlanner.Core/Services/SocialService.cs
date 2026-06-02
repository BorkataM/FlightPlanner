using FlightPlanner.Core.DTOs.Social;
using FlightPlanner.Core.Interfaces;

namespace FlightPlanner.Core.Services
{
    public class SocialService : ISocialService
    {
        private readonly ISocialRepository _socialRepository;

        public SocialService(ISocialRepository socialRepository)
        {
            _socialRepository = socialRepository;
        }

        public async Task FollowAsync(int currentUserId, int targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new InvalidOperationException("You cannot follow yourself.");

            if (!await _socialRepository.UserExistsAsync(targetUserId))
                throw new KeyNotFoundException($"User {targetUserId} not found.");

            if (await _socialRepository.IsFollowingAsync(currentUserId, targetUserId))
                throw new InvalidOperationException("You are already following this user.");

            await _socialRepository.FollowAsync(currentUserId, targetUserId);
        }

        public async Task UnfollowAsync(int currentUserId, int targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new InvalidOperationException("You cannot unfollow yourself.");

            if (!await _socialRepository.IsFollowingAsync(currentUserId, targetUserId))
                throw new InvalidOperationException("You are not following this user.");

            await _socialRepository.UnfollowAsync(currentUserId, targetUserId);
        }

        public Task<bool> IsFollowingAsync(int currentUserId, int targetUserId) =>
            _socialRepository.IsFollowingAsync(currentUserId, targetUserId);

        public async Task<IEnumerable<UserSummaryDto>> GetFollowersAsync(int userId)
        {
            var follows = await _socialRepository.GetFollowersAsync(userId);
            return follows.Select(f => new UserSummaryDto
            {
                Id = f.Follower.Id,
                FirstName = f.Follower.FirstName,
                LastName = f.Follower.LastName,
                Email = f.Follower.Email,
                FollowedAt = f.FollowedAt
            });
        }

        public async Task<IEnumerable<UserSummaryDto>> GetFollowingAsync(int userId)
        {
            var follows = await _socialRepository.GetFollowingAsync(userId);
            return follows.Select(f => new UserSummaryDto
            {
                Id = f.Followee.Id,
                FirstName = f.Followee.FirstName,
                LastName = f.Followee.LastName,
                Email = f.Followee.Email,
                FollowedAt = f.FollowedAt
            });
        }

        public async Task<UserStatsDto?> GetUserStatsAsync(int targetUserId, int currentUserId)
        {
            var raw = await _socialRepository.GetUserStatsAsync(targetUserId);
            if (raw is null) return null;

            var isFollowed = currentUserId != targetUserId
                && await _socialRepository.IsFollowingAsync(currentUserId, targetUserId);

            return new UserStatsDto
            {
                Id                      = raw.Id,
                FirstName               = raw.FirstName,
                LastName                = raw.LastName,
                Email                   = raw.Email,
                FlightsCount            = raw.FlightsCount,
                CountriesVisited        = raw.CountriesVisited,
                FollowersCount          = raw.FollowersCount,
                FollowingCount          = raw.FollowingCount,
                IsFollowedByCurrentUser = isFollowed,
            };
        }

        public Task<IEnumerable<string>> GetVisitedCountriesAsync(int userId) =>
            _socialRepository.GetVisitedCountriesAsync(userId);

        public async Task<IEnumerable<UserSearchResultDto>> SearchUsersAsync(string query, int currentUserId, int limit)
        {
            var raws = (await _socialRepository.SearchUsersAsync(query, currentUserId, limit)).ToList();
            var followedIds = await _socialRepository.GetFollowedIdsAsync(currentUserId, raws.Select(r => r.Id));

            return raws.Select(r => new UserSearchResultDto
            {
                Id                      = r.Id,
                FirstName               = r.FirstName,
                LastName                = r.LastName,
                Email                   = r.Email,
                FlightsCount            = r.FlightsCount,
                FollowersCount          = r.FollowersCount,
                IsFollowedByCurrentUser = followedIds.Contains(r.Id),
            });
        }
    }
}
