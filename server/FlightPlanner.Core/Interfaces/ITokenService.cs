using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
