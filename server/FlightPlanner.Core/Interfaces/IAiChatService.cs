using FlightPlanner.Core.DTOs.Ai;

namespace FlightPlanner.Core.Interfaces
{
    public interface IAiChatService
    {
        Task<AiChatResponseDto> ChatAsync(
            int userId,
            string email,
            string firstName,
            string lastName,
            AiChatRequestDto request,
            CancellationToken ct = default);
    }
}
