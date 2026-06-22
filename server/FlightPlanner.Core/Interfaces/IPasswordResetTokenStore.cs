namespace FlightPlanner.Core.Interfaces
{
    public interface IPasswordResetTokenStore
    {
        // Creates a one-time, short-lived token tied to a user id.
        string Generate(int userId);

        // Returns the user id if the token is valid and unexpired, otherwise null.
        int? Validate(string token);

        // Consumes a token so it can no longer be reused.
        void Invalidate(string token);
    }
}
