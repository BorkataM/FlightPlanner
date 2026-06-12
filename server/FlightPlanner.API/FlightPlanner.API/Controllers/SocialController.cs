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

        [HttpGet("stats/me")]
        public async Task<ActionResult<UserStatsDto>> GetMyStats()
        {
            var id    = GetCurrentUserId();
            var stats = await _socialService.GetUserStatsAsync(id, id);
            return stats is null ? NotFound() : Ok(stats);
        }

        [HttpGet("stats/{userId:int}")]
        public async Task<ActionResult<UserStatsDto>> GetUserStats(int userId)
        {
            var stats = await _socialService.GetUserStatsAsync(userId, GetCurrentUserId());
            return stats is null ? NotFound() : Ok(stats);
        }

        [HttpGet("visited-countries")]
        public async Task<ActionResult<IEnumerable<string>>> GetVisitedCountries()
        {
            var countries = await _socialService.GetVisitedCountriesAsync(GetCurrentUserId());
            return Ok(countries);
        }

        [HttpGet("{userId:int}/visited-countries")]
        public async Task<ActionResult<IEnumerable<string>>> GetUserVisitedCountries(int userId)
        {
            var countries = await _socialService.GetVisitedCountriesAsync(userId);
            return Ok(countries);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<UserSearchResultDto>>> Search(
            [FromQuery] string? q, [FromQuery] int limit = 20)
        {
            var results = await _socialService.SearchUsersAsync(q ?? "", GetCurrentUserId(), Math.Clamp(limit, 1, 50));
            return Ok(results);
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
