"""OpenWeather 5-day forecast helper.

Mirrors the .NET OpenWeatherClient: same free `/data/2.5/forecast` endpoint,
same "nearest noon on the requested date" point selection. The free tier only
forecasts ~5 days ahead, so requests outside that window return
{"available": False, ...} instead of a misleading value.
"""
import logging
from datetime import datetime, timezone

import httpx

from database import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast"
_FORECAST_HORIZON_DAYS = 5


async def get_forecast(latitude: float, longitude: float, date: str) -> dict:
    """Weather near noon (UTC) on `date` (yyyy-mm-dd) for the given coordinates."""
    if not settings.OPENWEATHER_API_KEY:
        return {"available": False, "reason": "Weather lookups are not configured."}

    try:
        target = datetime.strptime(date, "%Y-%m-%d").replace(hour=12, tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return {"available": False, "reason": f"Invalid date {date!r}; use yyyy-mm-dd."}

    days_ahead = (target.date() - datetime.now(timezone.utc).date()).days
    if days_ahead < 0:
        return {"available": False, "reason": "That date is in the past."}
    if days_ahead > _FORECAST_HORIZON_DAYS:
        return {
            "available": False,
            "reason": (
                f"Forecast only available up to {_FORECAST_HORIZON_DAYS} days ahead; "
                f"the date is {days_ahead} days away."
            ),
        }

    params = {
        "lat": latitude,
        "lon": longitude,
        "units": "metric",
        "appid": settings.OPENWEATHER_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=15) as http:
            res = await http.get(_BASE_URL, params=params)
            res.raise_for_status()
            root = res.json()
    except httpx.HTTPError as exc:
        logger.warning("Weather lookup failed: %s", exc)
        return {"available": False, "reason": "Weather service unavailable."}

    points = root.get("list") or []
    if not points:
        return {"available": False, "reason": "No forecast points returned."}

    def _dt(point: dict) -> datetime:
        return datetime.strptime(point["dt_txt"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)

    point = min(points, key=lambda p: abs((_dt(p) - target).total_seconds()))
    main = point.get("main") or {}
    weather = (point.get("weather") or [{}])[0]
    wind = point.get("wind") or {}

    return {
        "available": True,
        "city": (root.get("city") or {}).get("name", ""),
        "forecast_time_utc": point.get("dt_txt"),
        "temperature_c": round(main.get("temp", 0), 1),
        "condition": weather.get("main", "Clear"),
        "description": weather.get("description", ""),
        "wind_speed_kmh": round(wind.get("speed", 0) * 3.6, 1),
        "humidity": main.get("humidity", 0),
    }
