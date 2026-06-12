using FlightPlanner.Core.DTOs.User;
using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("me")]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var userId = GetCurrentUserId();
            var profile = await _userService.GetProfileAsync(userId);
            if (profile is null)
                return NotFound(new { message = "User not found." });

            return Ok(profile);
        }

        [HttpPut("me")]
        public async Task<ActionResult<UserProfileDto>> UpdateProfile([FromBody] UpdateProfileDto dto)
        {
            var userId = GetCurrentUserId();
            var profile = await _userService.UpdateProfileAsync(userId, dto);
            if (profile is null)
                return NotFound(new { message = "User not found." });

            return Ok(profile);
        }

        [HttpGet("me/appearance")]
        public async Task<ActionResult<UserAppearanceDto>> GetMyAppearance()
        {
            var appearance = await _userService.GetAppearanceAsync(GetCurrentUserId());
            return appearance is null ? NotFound() : Ok(appearance);
        }

        [HttpPut("me/appearance")]
        public async Task<ActionResult<UserAppearanceDto>> UpdateMyAppearance([FromBody] UserAppearanceDto dto)
        {
            var appearance = await _userService.UpdateAppearanceAsync(GetCurrentUserId(), dto);
            return appearance is null ? NotFound() : Ok(appearance);
        }

        [HttpGet("{userId:int}/appearance")]
        public async Task<ActionResult<UserAppearanceDto>> GetUserAppearance(int userId)
        {
            var appearance = await _userService.GetAppearanceAsync(userId);
            return appearance is null ? NotFound() : Ok(appearance);
        }

        private int GetCurrentUserId()
        {
            var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("User ID claim not found.");

            return int.Parse(sub);
        }
    }
}
