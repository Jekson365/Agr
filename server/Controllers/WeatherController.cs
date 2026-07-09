using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.Integrations.WeatherApi;

namespace Server.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class WeatherController(IWeatherClient weatherClient) : ControllerBase
{
    /// <summary>Current weather for <paramref name="location"/> (city name, "lat,lon", postcode, or "auto:ip").</summary>
    [HttpGet]
    public async Task<ActionResult<CurrentWeather>> GetCurrent(
        [FromQuery] string location = "Tbilisi",
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            return BadRequest("A 'location' query parameter is required.");
        }

        try
        {
            return Ok(await weatherClient.GetCurrentAsync(location, cancellationToken));
        }
        catch (WeatherApiException ex)
        {
            // Upstream (WeatherAPI.com) problem — surface as a bad gateway, not a 500.
            return StatusCode(StatusCodes.Status502BadGateway, ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            // Misconfiguration (e.g. missing API key).
            return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
        }
    }
}
