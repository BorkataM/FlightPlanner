using FlightPlanner.Core.DTOs.Flight;
using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/flights")]
    public class FlightsController : ControllerBase
    {
        private readonly IFlightService _flightService;

        public FlightsController(IFlightService flightService)
        {
            _flightService = flightService;
        }

        [HttpGet]
        public async Task<ActionResult> GetFlights(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var (flights, total) = await _flightService.GetPagedAsync(page, pageSize);
            return Ok(new
            {
                data = flights,
                page,
                pageSize,
                totalCount = total,
                totalPages = (int)Math.Ceiling(total / (double)pageSize)
            });
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<FlightDto>> GetFlight(int id)
        {
            var flight = await _flightService.GetByIdAsync(id);
            if (flight is null)
                return NotFound(new { message = $"Flight {id} not found." });

            return Ok(flight);
        }

        [HttpGet("smartest")]
        public async Task<ActionResult<IEnumerable<FlightDto>>> GetSmartest(
            [FromQuery] int limit = 10)
        {
            if (limit < 1 || limit > 50) limit = 10;
            var flights = await _flightService.GetSmartestAsync(limit);
            return Ok(flights);
        }

        [HttpGet("departure-codes")]
        public async Task<ActionResult<IEnumerable<string>>> GetDepartureCodes()
        {
            var codes = await _flightService.GetDepartureCodesAsync();
            return Ok(codes);
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<FlightDto>>> Search(
            [FromQuery] string? from,
            [FromQuery] string? to,
            [FromQuery] DateOnly? date,
            [FromQuery] int limit = 20)
        {
            if (limit < 1 || limit > 10000) limit = 100;
            var flights = await _flightService.SearchAsync(from, to, date, limit);
            return Ok(flights);
        }
    }
}
