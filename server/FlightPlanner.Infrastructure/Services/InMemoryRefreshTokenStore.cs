using FlightPlanner.Core.Interfaces;
using System.Collections.Concurrent;

namespace FlightPlanner.Infrastructure.Services
{
    // Singleton - survives the lifetime of the process.
    // For production, replace backing store with Redis or a DB table.
    public class InMemoryRefreshTokenStore : IRefreshTokenStore
    {
        private record Entry(int UserId, DateTime Expiry);

        private readonly ConcurrentDictionary<string, Entry> _store = new();
        private static readonly TimeSpan Lifetime = TimeSpan.FromDays(30);

        public string Generate(int userId)
        {
            var token = Guid.NewGuid().ToString("N");
            _store[token] = new Entry(userId, DateTime.UtcNow.Add(Lifetime));
            return token;
        }

        public (int UserId, string NewToken)? ValidateAndRotate(string token)
        {
            if (!_store.TryRemove(token, out var entry))
                return null;

            if (entry.Expiry < DateTime.UtcNow)
                return null;

            // Issue a fresh token (rotation - old token already removed above)
            var newToken = Generate(entry.UserId);
            return (entry.UserId, newToken);
        }

        public void Revoke(string token) => _store.TryRemove(token, out _);
    }
}
