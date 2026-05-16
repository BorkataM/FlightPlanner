namespace FlightPlanner.Core.DTOs.Ai
{
    public class AiChatRequestDto
    {
        public string Message { get; set; } = string.Empty;
        public List<AiChatMessageDto> ConversationHistory { get; set; } = [];
    }
}
