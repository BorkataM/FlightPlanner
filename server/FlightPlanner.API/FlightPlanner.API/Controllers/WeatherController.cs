using FlightPlanner.Core.DTOs.Weather;
using FlightPlanner.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FlightPlanner.API.Controllers
{
    [ApiController]
    [Route("api/weather")]
    [Authorize]
    public class WeatherController : ControllerBase
    {
        private readonly IWeatherService _weather;

        public WeatherController(IWeatherService weather)
        {
            _weather = weather;
        }

        [HttpGet]
        public async Task<ActionResult<WeatherForecastDto>> GetForecast(
            [FromQuery] double lat,
            [FromQuery] double lon,
            [FromQuery] string date,
            CancellationToken ct)
        {
            if (!DateOnly.TryParse(date, out var dateOnly))
                return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });

            return await Execute(() => _weather.GetForecastAsync(lat, lon, dateOnly, ct), ct);
        }

        [HttpGet("delay-risk")]
        public async Task<ActionResult<DelayRiskDto>> GetDelayRisk(
            [FromQuery] int flightId,
            CancellationToken ct)
        {
            return await Execute(() => _weather.GetDelayRiskAsync(flightId, ct), ct);
        }

        [HttpGet("destination")]
        public async Task<ActionResult<WeatherForecastDto>> GetDestinationForecast(
            [FromQuery] int flightId,
            CancellationToken ct)
        {
            return await Execute(() => _weather.GetDestinationForecastAsync(flightId, ct), ct);
        }

        [HttpGet("geo")]
        public async Task<ActionResult<FlightGeoDto>> GetFlightGeo(
            [FromQuery] int flightId,
            CancellationToken ct)
        {
            return await Execute(() => _weather.GetFlightGeoAsync(flightId, ct), ct);
        }

        private async Task<ActionResult<T>> Execute<T>(Func<Task<T>> action, CancellationToken ct)
        {
            try
            {
                return Ok(await action());
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new { message = "Weather service temporarily unavailable." });
            }
            catch (TaskCanceledException)
            {
                return StatusCode(504, new { message = "Weather service timed out." });
            }
        }
    }
}
