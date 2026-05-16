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

        public UserService(
            IUserRepository userRepository,
            ITokenService tokenService,
            IPasswordHasher passwordHasher,
            IRefreshTokenStore refreshTokenStore)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
            _refreshTokenStore = refreshTokenStore;
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

            if (!_passwordHasher.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

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
    }
}
