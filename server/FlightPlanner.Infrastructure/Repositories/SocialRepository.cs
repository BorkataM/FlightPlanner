using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

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

        public async Task<UserStatsRaw?> GetUserStatsAsync(int userId)
        {
            var user = await _context.Users
                .Where(u => u.Id == userId)
                .Select(u => new { u.Id, u.FirstName, u.LastName, u.Email })
                .FirstOrDefaultAsync();

            if (user is null) return null;

            var flightsCount   = await _context.Bookings.CountAsync(b => b.UserId == userId);
            var followersCount = await _context.UserFollows.CountAsync(f => f.FolloweeId == userId);
            var followingCount = await _context.UserFollows.CountAsync(f => f.FollowerId == userId);

            // Count distinct countries from both departure and arrival airports
            var depCountries = _context.Bookings
                .Where(b => b.UserId == userId)
                .Select(b => b.Flight.DepartureAirport.Country);

            var arrCountries = _context.Bookings
                .Where(b => b.UserId == userId)
                .Select(b => b.Flight.ArrivalAirport.Country);

            var countriesVisited = await depCountries
                .Union(arrCountries)
                .Where(c => c != null && c != "")
                .CountAsync();

            return new UserStatsRaw(user.Id, user.FirstName, user.LastName, user.Email,
                                    flightsCount, countriesVisited, followersCount, followingCount);
        }

        public async Task<IEnumerable<UserSearchRaw>> SearchUsersAsync(string query, int excludeUserId, int limit)
        {
            var lower = query.ToLower();

            return await _context.Users
                .Where(u => u.Id != excludeUserId &&
                    (query == "" ||
                     u.FirstName.ToLower().Contains(lower) ||
                     u.LastName.ToLower().Contains(lower)  ||
                     u.Email.ToLower().Contains(lower)))
                .OrderBy(u => u.FirstName).ThenBy(u => u.LastName)
                .Take(limit)
                .Select(u => new UserSearchRaw(
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Bookings.Count(),
                    u.Followers.Count()))
                .ToListAsync();
        }

        public async Task<HashSet<int>> GetFollowedIdsAsync(int currentUserId, IEnumerable<int> candidateIds)
        {
            var ids = candidateIds.ToList();
            var followed = await _context.UserFollows
                .Where(f => f.FollowerId == currentUserId && ids.Contains(f.FolloweeId))
                .Select(f => f.FolloweeId)
                .ToListAsync();
            return followed.ToHashSet();
        }

        public async Task<IEnumerable<string>> GetVisitedCountriesAsync(int userId)
        {
            var dep = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Select(b => b.Flight.DepartureAirport.Country)
                .ToListAsync();

            var arr = await _context.Bookings
                .Where(b => b.UserId == userId)
                .Select(b => b.Flight.ArrivalAirport.Country)
                .ToListAsync();

            return dep.Concat(arr)
                .Where(c => !string.IsNullOrEmpty(c))
                .Distinct()
                .OrderBy(c => c)
                .ToList();
        }
    }
}
