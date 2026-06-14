using FlightPlanner.Core.DTOs.Flight;
using FlightPlanner.Core.Entities;
using FlightPlanner.Core.Interfaces;

namespace FlightPlanner.Core.Services
{
    public class FlightService : IFlightService
    {
        private readonly IFlightRepository _flightRepository;

        public FlightService(IFlightRepository flightRepository)
        {
            _flightRepository = flightRepository;
        }

        public async Task<(IEnumerable<FlightDto> Flights, int TotalCount)> GetPagedAsync(int page, int pageSize)
        {
            var (flights, total) = await _flightRepository.GetPagedAsync(page, pageSize);
            return (flights.Select(Map), total);
        }

        public async Task<FlightDto?> GetByIdAsync(int id)
        {
            var flight = await _flightRepository.GetByIdAsync(id);
            return flight is null ? null : Map(flight);
        }

        public async Task<IEnumerable<FlightDto>> GetSmartestAsync(int limit)
        {
            var flights = await _flightRepository.GetSmartestAsync(limit);
            return flights.Select(Map);
        }

        public async Task<IEnumerable<FlightDto>> SearchAsync(
            string? departureCode, string? arrivalCode, DateOnly? date, int limit)
        {
            var flights = await _flightRepository.SearchAsync(departureCode, arrivalCode, date, limit);
            return flights.Select(Map);
        }

        public async Task<IEnumerable<string>> GetDepartureCodesAsync() =>
            await _flightRepository.GetDepartureCodesAsync();

        private static FlightDto Map(Flight f) => new()
        {
            Id = f.Id,
            FlightNumber = f.FlightNumber,
            AirlineName = f.AirlineEntity?.Name ?? f.Airline ?? string.Empty,
            AirlineEcoRating = f.AirlineEntity?.EcoRating,
            DepartureAirportCode = f.DepartureAirport?.IataCode ?? f.DepartureAirport?.IcaoCode ?? string.Empty,
            DepartureAirportName = f.DepartureAirport?.Name ?? string.Empty,
            DepartureCity = f.DepartureAirport?.City ?? string.Empty,
            ArrivalAirportCode = f.ArrivalAirport?.IataCode ?? f.ArrivalAirport?.IcaoCode ?? string.Empty,
            ArrivalAirportName = f.ArrivalAirport?.Name ?? string.Empty,
            ArrivalCity = f.ArrivalAirport?.City ?? string.Empty,
            DepartureTime = f.DepartureTime,
            ArrivalTime = f.ArrivalTime,
            Price = f.Price,
            Stops = f.Stops,
            Analytics = f.Analytics is null ? null : new FlightAnalyticsDto
            {
                SmartScore = f.Analytics.SmartScore,
                Co2Emissions = f.Analytics.Co2Emissions,
                FuelEfficiency = f.Analytics.FuelEfficiency,
                DelayProbability = f.Analytics.DelayProbability,
                PredictedDelayMinutes = f.Analytics.PredictedDelayMinutes,
                IsEcoFriendly = f.Analytics.IsEcoFriendly,
                IsBestValue = f.Analytics.IsBestValue,
            }
        };
    }
}
