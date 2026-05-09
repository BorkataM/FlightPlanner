using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int id);
        Task<User> CreateAsync(User user);
        Task<bool> ExistsAsync(string email);
    }
}
