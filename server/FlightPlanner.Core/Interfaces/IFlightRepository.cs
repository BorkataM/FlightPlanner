using FlightPlanner.Core.Entities;

namespace FlightPlanner.Core.Interfaces
{
    public interface IFlightRepository
    {
        Task<(IEnumerable<Flight> Flights, int TotalCount)> GetPagedAsync(int page, int pageSize);
        Task<Flight?> GetByIdAsync(int id);
        Task<IEnumerable<Flight>> GetSmartestAsync(int limit);
        Task<IEnumerable<Flight>> SearchAsync(string? departureCode, string? arrivalCode, DateOnly? date, int limit);
    }
}
