namespace FlightPlanner.Core.DTOs.Ai
{
    public class AiChatResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public List<int> FlightIdsMentioned { get; set; } = [];
        public List<string> ToolCallsMade { get; set; } = [];
        public AiCheckoutDataDto? CheckoutData { get; set; }
    }
}
