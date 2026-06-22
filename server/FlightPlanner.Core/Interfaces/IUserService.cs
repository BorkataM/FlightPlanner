using FlightPlanner.Core.DTOs.Auth;
using FlightPlanner.Core.DTOs.User;

namespace FlightPlanner.Core.Interfaces
{
    public interface IUserService
    {
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> GoogleLoginAsync(string email, string googleId, string firstName, string lastName);
        Task<AuthResponseDto> RefreshAsync(string refreshToken);
        Task RequestPasswordResetAsync(string email, string? clientBaseUrl);
        Task ResetPasswordAsync(string token, string newPassword);
        Task<UserProfileDto?> GetProfileAsync(int userId);
        Task<UserProfileDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto);
        Task<UserAppearanceDto?> GetAppearanceAsync(int userId);
        Task<UserAppearanceDto?> UpdateAppearanceAsync(int userId, UserAppearanceDto dto);
    }
}
