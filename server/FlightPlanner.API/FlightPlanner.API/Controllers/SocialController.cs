using FlightPlanner.Core.DTOs.Social;
using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/social")]
    [Authorize]
    public class SocialController : ControllerBase
    {
        private readonly ISocialService _socialService;

        public SocialController(ISocialService socialService)
        {
            _socialService = socialService;
        }

        [HttpPost("follow/{userId:int}")]
        public async Task<IActionResult> Follow(int userId)
        {
            try
            {
                await _socialService.FollowAsync(GetCurrentUserId(), userId);
                return Ok(new { message = $"Successfully followed user {userId}." });
            }
            catch (KeyNotFoundException ex) { return NotFound(new { message = ex.Message }); }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpDelete("follow/{userId:int}")]
        public async Task<IActionResult> Unfollow(int userId)
        {
            try
            {
                await _socialService.UnfollowAsync(GetCurrentUserId(), userId);
                return Ok(new { message = $"Successfully unfollowed user {userId}." });
            }
            catch (InvalidOperationException ex) { return Conflict(new { message = ex.Message }); }
        }

        [HttpGet("is-following/{userId:int}")]
        public async Task<ActionResult<bool>> IsFollowing(int userId)
        {
            var result = await _socialService.IsFollowingAsync(GetCurrentUserId(), userId);
            return Ok(result);
        }

        [HttpGet("followers")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetMyFollowers()
        {
            var followers = await _socialService.GetFollowersAsync(GetCurrentUserId());
            return Ok(followers);
        }

        [HttpGet("following")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetMyFollowing()
        {
            var following = await _socialService.GetFollowingAsync(GetCurrentUserId());
            return Ok(following);
        }

        [HttpGet("{userId:int}/followers")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetUserFollowers(int userId)
        {
            var followers = await _socialService.GetFollowersAsync(userId);
            return Ok(followers);
        }

        [HttpGet("{userId:int}/following")]
        public async Task<ActionResult<IEnumerable<UserSummaryDto>>> GetUserFollowing(int userId)
        {
            var following = await _socialService.GetFollowingAsync(userId);
            return Ok(following);
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
