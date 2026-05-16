using FlightPlanner.Core.DTOs.Ai;
using FlightPlanner.Core.Interfaces;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace FlightPlanner.Infrastructure.ExternalClients
{
    public class AiChatClient : IAiChatService
    {
        private readonly HttpClient _httpClient;

        private static readonly JsonSerializerOptions _snakeCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            PropertyNameCaseInsensitive = true,
        };

        public AiChatClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<AiChatResponseDto> ChatAsync(
            int userId,
            string email,
            string firstName,
            string lastName,
            AiChatRequestDto request,
            CancellationToken ct = default)
        {
            var payload = new
            {
                message = request.Message,
                conversation_history = request.ConversationHistory
                    .Select(m => new { role = m.Role, content = m.Content }),
                user_context = new
                {
                    user_id = userId,
                    email,
                    first_name = firstName,
                    last_name = lastName,
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/ai/chat", content, ct);
            response.EnsureSuccessStatusCode();

            var stream = await response.Content.ReadAsStreamAsync(ct);
            return await JsonSerializer.DeserializeAsync<AiChatResponseDto>(stream, _snakeCase, ct)
                ?? throw new InvalidOperationException("Empty response from AI service.");
        }
    }
}
