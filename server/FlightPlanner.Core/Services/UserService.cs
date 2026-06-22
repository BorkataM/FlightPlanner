using FlightPlanner.Core.DTOs.Auth;
using FlightPlanner.Core.DTOs.User;
using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;

namespace FlightPlanner.Core.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IRefreshTokenStore _refreshTokenStore;
        private readonly IPasswordResetTokenStore _passwordResetTokenStore;
        private readonly IEmailSender _emailSender;

        public UserService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IRefreshTokenStore refreshTokenStore,
            IPasswordResetTokenStore passwordResetTokenStore,
            IEmailSender emailSender)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _refreshTokenStore = refreshTokenStore;
            _passwordResetTokenStore = passwordResetTokenStore;
            _emailSender = emailSender;
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await _userRepository.ExistsAsync(dto.Email.ToLowerInvariant()))
                throw new InvalidOperationException("A user with this email already exists.");

            var user = new User
            {
                Email = dto.Email.ToLowerInvariant(),
                PasswordHash = _passwordHasher.Hash(dto.Password),
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Age = dto.Age,
                CreatedAt = DateTime.UtcNow
            };

            var created = await _userRepository.CreateAsync(user);
            return BuildResponse(created);
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _userRepository.GetByEmailAsync(dto.Email.ToLowerInvariant())
                ?? throw new UnauthorizedAccessException("Invalid email or password.");

            if (string.IsNullOrEmpty(user.PasswordHash) || !_passwordHasher.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            return BuildResponse(user);
        }

        public async Task<AuthResponseDto> GoogleLoginAsync(string email, string googleId, string firstName, string lastName)
        {
            var user = await _userRepository.GetByGoogleIdAsync(googleId);

            if (user is null)
            {
                user = await _userRepository.GetByEmailAsync(email.ToLowerInvariant());
                if (user is not null)
                {
                    user.GoogleId = googleId;
                    await _userRepository.UpdateAsync(user);
                }
            }

            if (user is null)
            {
                user = new User
                {
                    Email     = email.ToLowerInvariant(),
                    GoogleId  = googleId,
                    FirstName = firstName,
                    LastName  = string.IsNullOrEmpty(lastName) ? "-" : lastName,
                    CreatedAt = DateTime.UtcNow,
                };
                user = await _userRepository.CreateAsync(user);
            }

            return BuildResponse(user);
        }

        public async Task<AuthResponseDto> RefreshAsync(string refreshToken)
        {
            var result = _refreshTokenStore.ValidateAndRotate(refreshToken)
                ?? throw new UnauthorizedAccessException("Invalid or expired refresh token.");

            var user = await _userRepository.GetByIdAsync(result.UserId)
                ?? throw new UnauthorizedAccessException("User no longer exists.");

            return new AuthResponseDto
            {
                Token = _tokenService.CreateToken(user),
                RefreshToken = result.NewToken,
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            };
        }

        public async Task RequestPasswordResetAsync(string email, string? clientBaseUrl)
        {
            var user = await _userRepository.GetByEmailAsync(email.ToLowerInvariant());

            // Don't reveal whether the email exists. Only send a mail if we actually have a matching local account.
            if (user is null) return;

            var token = _passwordResetTokenStore.Generate(user.Id);

            var baseUrl = string.IsNullOrWhiteSpace(clientBaseUrl)
                ? "https://skywave-web.onrender.com"
                : clientBaseUrl.TrimEnd('/');
            var resetUrl = $"{baseUrl}/reset-password?token={Uri.EscapeDataString(token)}";

            var html = BuildResetEmailHtml(user.FirstName, resetUrl);
            await _emailSender.SendAsync(user.Email, "Reset your SkyWave password", html);
        }

        public async Task ResetPasswordAsync(string token, string newPassword)
        {
            var userId = _passwordResetTokenStore.Validate(token)
                ?? throw new UnauthorizedAccessException("This reset link is invalid or has expired.");

            var user = await _userRepository.GetByIdAsync(userId)
                ?? throw new UnauthorizedAccessException("This reset link is invalid or has expired.");

            user.PasswordHash = _passwordHasher.Hash(newPassword);
            await _userRepository.UpdateAsync(user);

            // One-time use — consume the token so the same link can't be replayed.
            _passwordResetTokenStore.Invalidate(token);
        }

        private static string BuildResetEmailHtml(string firstName, string resetUrl) => $@"
<div style=""font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#0F172A"">
  <h2 style=""margin:0 0 8px;font-size:20px"">Reset your password</h2>
  <p style=""color:#475569;font-size:14px;line-height:1.6"">
    Hi {System.Net.WebUtility.HtmlEncode(firstName)}, we received a request to reset your SkyWave password.
    Click the button below to choose a new one. This link expires in 1 hour.
  </p>
  <a href=""{resetUrl}""
     style=""display:inline-block;margin:20px 0;padding:12px 28px;background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;text-decoration:none;border-radius:9999px;font-weight:600;font-size:14px"">
    Reset password
  </a>
  <p style=""color:#94A3B8;font-size:12px;line-height:1.6"">
    If you didn't request this, you can safely ignore this email — your password won't change.
  </p>
  <p style=""color:#94A3B8;font-size:12px;word-break:break-all"">
    Or paste this link into your browser:<br>{resetUrl}
  </p>
</div>";

        public async Task<UserProfileDto?> GetProfileAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user is null ? null : MapProfile(user);
        }

        public async Task<UserProfileDto?> UpdateProfileAsync(int userId, UpdateProfileDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user is null) return null;

            user.FirstName = dto.FirstName;
            user.LastName = dto.LastName;
            user.Age = dto.Age;

            var updated = await _userRepository.UpdateAsync(user);
            return MapProfile(updated);
        }

        public async Task<UserAppearanceDto?> GetAppearanceAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            return user is null ? null : MapAppearance(user);
        }

        public async Task<UserAppearanceDto?> UpdateAppearanceAsync(int userId, UserAppearanceDto dto)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user is null) return null;

            user.AvatarDataUrl     = dto.AvatarDataUrl;
            user.CoverImageDataUrl = dto.CoverImageDataUrl;
            user.CoverGradient     = dto.CoverGradient;
            user.Bio               = dto.Bio;

            var updated = await _userRepository.UpdateAsync(user);
            return MapAppearance(updated);
        }

        private AuthResponseDto BuildResponse(User user) => new()
        {
            Token = _tokenService.CreateToken(user),
            RefreshToken = _refreshTokenStore.Generate(user.Id),
            UserId = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName
        };

        private static UserProfileDto MapProfile(User user) => new()
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Age = user.Age,
            CreatedAt = user.CreatedAt
        };

        private static UserAppearanceDto MapAppearance(User user) => new()
        {
            AvatarDataUrl     = user.AvatarDataUrl,
            CoverImageDataUrl = user.CoverImageDataUrl,
            CoverGradient     = user.CoverGradient,
            Bio               = user.Bio,
        };
    }
}
