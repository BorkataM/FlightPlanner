using FlightPlanner.Core.DTOs.Flight;

namespace FlightPlanner.Core.Interfaces
{
    public interface IFlightService
    {
        Task<(IEnumerable<FlightDto> Flights, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<FlightDto?> GetByIdAsync(int id);
        Task<IEnumerable<FlightDto>> GetSmartestAsync(int limit);
        Task<IEnumerable<FlightDto>> SearchAsync(string? departureCode, string? arrivalCode, int limit);
    }
}
