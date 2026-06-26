using FlightPlanner.Core.Configuration;
using FlightPlanner.Core.DTOs.Auth;
using FlightPlanner.Core.Interfaces;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Mvc;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;

        public AuthController(IUserService userService, IConfiguration configuration)
        {
            _userService   = userService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            try
            {
                var result = await _userService.RegisterAsync(dto);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            try
            {
                var result = await _userService.LoginAsync(dto);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("google")]
        public async Task<ActionResult<AuthResponseDto>> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
        {
            try
            {
                var clientId = ConfigResolver.Resolve(_configuration["Google:ClientId"]) ?? "";
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(dto.Credential, settings);

                var nameParts = (payload.Name ?? "").Split(' ', 2);
                var firstName = nameParts[0];
                var lastName  = nameParts.Length > 1 ? nameParts[1] : "";

                var result = await _userService.GoogleLoginAsync(payload.Email, payload.Subject, firstName, lastName);
                return Ok(result);
            }
            catch (InvalidJwtException)
            {
                return Unauthorized(new { message = "Invalid Google credential." });
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshRequestDto dto)
        {
            try
            {
                var result = await _userService.RefreshAsync(dto.RefreshToken);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            // Use the calling site's origin to build the reset link so it works in both local and prod.
            var origin = Request.Headers.Origin.ToString();
            await _userService.RequestPasswordResetAsync(dto.Email, origin);

            // Always 200 — never reveal whether an account exists for this email.
            return Ok(new { message = "If an account exists for that email, a reset link has been sent." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                await _userService.ResetPasswordAsync(dto.Token, dto.NewPassword);
                return Ok(new { message = "Your password has been reset. You can now sign in." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
