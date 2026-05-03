using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AirportsController : ControllerBase
    {
        private readonly IAirportRepository _airportRepository;

        public AirportsController(IAirportRepository airportRepository)
        {
            _airportRepository = airportRepository;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return BadRequest("Query cannot be empty");

            var results = await _airportRepository.SearchAirportsAsync(query);

            return Ok(results);
        }
    }
}
