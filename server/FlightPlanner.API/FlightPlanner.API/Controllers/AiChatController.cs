using FlightPlanner.Core.DTOs.Ai;
using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AiChatController : ControllerBase
    {
        private readonly IAiChatService _aiChatService;

        public AiChatController(IAiChatService aiChatService)
        {
            _aiChatService = aiChatService;
        }

        [HttpPost("chat")]
        public async Task<ActionResult<AiChatResponseDto>> Chat(
            [FromBody] AiChatRequestDto request,
            CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var email = User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
            var firstName = User.FindFirstValue("firstName") ?? string.Empty;
            var lastName = User.FindFirstValue("lastName") ?? string.Empty;

            try
            {
                var result = await _aiChatService.ChatAsync(userId, email, firstName, lastName, request, ct);
                return Ok(result);
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new
                {
                    message = "The AI assistant is temporarily unavailable. Please try again in a moment."
                });
            }
            catch (TaskCanceledException)
            {
                return StatusCode(504, new { message = "The AI assistant took too long to respond. Please try again." });
            }
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
