using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FlightPlanner.Infrastructure.Repositories
{
    public class SocialRepository : ISocialRepository
    {
        private readonly FlightPlannerDbContext _context;

        public SocialRepository(FlightPlannerDbContext context)
        {
            _context = context;
        }

        public async Task FollowAsync(int followerId, int followeeId)
        {
            _context.UserFollows.Add(new UserFollow
            {
                FollowerId = followerId,
                FolloweeId = followeeId,
                FollowedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        public async Task UnfollowAsync(int followerId, int followeeId)
        {
            var follow = await _context.UserFollows
                .FirstOrDefaultAsync(f => f.FollowerId == followerId && f.FolloweeId == followeeId);

            if (follow is not null)
            {
                _context.UserFollows.Remove(follow);
                await _context.SaveChangesAsync();
            }
        }

        public Task<bool> IsFollowingAsync(int followerId, int followeeId) =>
            _context.UserFollows
                .AnyAsync(f => f.FollowerId == followerId && f.FolloweeId == followeeId);

        public async Task<IEnumerable<UserFollow>> GetFollowersAsync(int userId) =>
            await _context.UserFollows
                .Include(f => f.Follower)
                .Where(f => f.FolloweeId == userId)
                .OrderByDescending(f => f.FollowedAt)
                .ToListAsync();

        public async Task<IEnumerable<UserFollow>> GetFollowingAsync(int userId) =>
            await _context.UserFollows
                .Include(f => f.Followee)
                .Where(f => f.FollowerId == userId)
                .OrderByDescending(f => f.FollowedAt)
                .ToListAsync();

        public Task<bool> UserExistsAsync(int userId) =>
            _context.Users.AnyAsync(u => u.Id == userId);
    }
}
