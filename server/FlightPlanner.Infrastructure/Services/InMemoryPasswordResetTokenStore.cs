using FlightPlanner.Core.Interfaces;
using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace FlightPlanner.Infrastructure.Services
{
    // Singleton - survives the lifetime of the process.
    // Reset tokens are intentionally short-lived; for production-grade durability
    // (surviving restarts / multiple instances) replace the backing store with Redis or a DB table.
    public class InMemoryPasswordResetTokenStore : IPasswordResetTokenStore
    {
        private record Entry(int UserId, DateTime Expiry);

        private readonly ConcurrentDictionary<string, Entry> _store = new();
        private static readonly TimeSpan Lifetime = TimeSpan.FromHours(1);

        public string Generate(int userId)
        {
            // URL-safe, high-entropy token
            var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
            _store[token] = new Entry(userId, DateTime.UtcNow.Add(Lifetime));
            return token;
        }

        public int? Validate(string token)
        {
            if (string.IsNullOrEmpty(token) || !_store.TryGetValue(token, out var entry))
                return null;

            if (entry.Expiry < DateTime.UtcNow)
            {
                _store.TryRemove(token, out _);
                return null;
            }

            return entry.UserId;
        }

        public void Invalidate(string token) => _store.TryRemove(token, out _);
    }
}
