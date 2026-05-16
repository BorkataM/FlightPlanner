namespace FlightPlanner.Core.Interfaces
{
    public interface IRefreshTokenStore
    {
        string Generate(int userId);
        (int UserId, string NewToken)? ValidateAndRotate(string token);
        void Revoke(string token);
    }
}
