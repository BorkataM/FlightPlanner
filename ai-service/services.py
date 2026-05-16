import math
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import Airline, Airport, Flight, FlightAnalytics


# ---------------------------------------------------------------------------
# Geo helpers
# ---------------------------------------------------------------------------

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance between two coordinates in kilometres."""
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Environmental impact
# ---------------------------------------------------------------------------

def calculate_co2_emissions(distance_km: float, eco_rating: float) -> float:
    """
    Estimate CO₂ in kg per passenger.
    Base factor: ~0.255 kg / passenger·km (ICAO average economy class).
    EcoRating (0–10) reduces emissions up to 30 %.
    """
    base_factor = 0.255
    eco_reduction = (eco_rating / 10.0) * 0.30
    return round(distance_km * base_factor * (1.0 - eco_reduction), 2)


def calculate_fuel_efficiency(distance_km: float, eco_rating: float) -> float:
    """
    Litres of fuel per 100 passenger·km.
    Base value: 4.5 L/100 pax·km.  EcoRating reduces it up to 25 %.
    Lower is better (like city-car fuel economy).
    """
    base_factor = 4.5
    eco_reduction = (eco_rating / 10.0) * 0.25
    return round(base_factor * (1.0 - eco_reduction), 4)


def calculate_delay_probability(departure_time: datetime, distance_km: float) -> float:
    """
    Heuristic delay probability (0–1).
    Evening departures (after 17:00) and long-haul routes carry higher risk.
    """
    hour = departure_time.hour
    # Time-of-day component: peaks at 22:00 (~0.45), lowest at 06:00 (~0.05)
    time_component = 0.05 + 0.40 * max(0, hour - 6) / 18
    # Distance component: adds up to 0.20 for ultra-long-haul (>15 000 km)
    distance_component = min(0.20, distance_km / 75_000)
    return round(min(0.95, time_component + distance_component), 4)


def calculate_predicted_delay_minutes(delay_probability: float) -> int:
    """Convert probability to an estimated delay in minutes (rough linear scale)."""
    return int(delay_probability * 120)


# ---------------------------------------------------------------------------
# SmartScore
# ---------------------------------------------------------------------------

def calculate_smart_score(
    price: Decimal | float,
    co2_emissions: float,
    fuel_efficiency: float,
    delay_probability: float,
    eco_rating: float,
) -> float:
    """
    Composite 0–100 score.  Higher = smarter choice.

    Weights:
      30 % price        (cheaper → higher score)
      25 % CO₂          (lower emissions → higher score)
      25 % reliability  (lower delay prob → higher score)
      10 % fuel         (lower L/100km → higher score)
      10 % eco rating   (higher airline rating → higher score)
    """
    price_f = float(price)

    # Normalise each dimension to [0, 100]
    price_score = max(0.0, 100.0 - (price_f / 2_000.0) * 100.0)
    co2_score = max(0.0, 100.0 - (co2_emissions / 5_000.0) * 100.0)
    delay_score = (1.0 - delay_probability) * 100.0
    fuel_score = max(0.0, 100.0 - (fuel_efficiency / 10.0) * 100.0)
    eco_score = (eco_rating / 10.0) * 100.0

    smart_score = (
        price_score * 0.30
        + co2_score * 0.25
        + delay_score * 0.25
        + fuel_score * 0.10
        + eco_score * 0.10
    )
    return round(smart_score, 2)


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------

async def _load_flight(db: AsyncSession, flight_id: int) -> Flight | None:
    result = await db.execute(
        select(Flight)
        .where(Flight.Id == flight_id)
        .options(
            selectinload(Flight.DepartureAirport),
            selectinload(Flight.ArrivalAirport),
            selectinload(Flight.AirlineEntity),
            selectinload(Flight.Analytics),
        )
    )
    return result.scalar_one_or_none()


async def process_flight_analytics(db: AsyncSession, flight_id: int) -> FlightAnalytics | None:
    """
    Calculate and persist analytics for a single flight.
    Returns None if the flight cannot be found or lacks required data.
    """
    flight = await _load_flight(db, flight_id)
    if flight is None:
        return None

    dep = flight.DepartureAirport
    arr = flight.ArrivalAirport
    if dep is None or arr is None:
        return None

    distance_km = haversine_distance(dep.Latitude, dep.Longitude, arr.Latitude, arr.Longitude)
    eco_rating = flight.AirlineEntity.EcoRating if flight.AirlineEntity else 5.0

    price = flight.Price or Decimal("500")
    co2 = calculate_co2_emissions(distance_km, eco_rating)
    fuel = calculate_fuel_efficiency(distance_km, eco_rating)
    dep_time = flight.DepartureTime or datetime.utcnow()
    delay_prob = calculate_delay_probability(dep_time, distance_km)
    delay_mins = calculate_predicted_delay_minutes(delay_prob)
    smart = calculate_smart_score(price, co2, fuel, delay_prob, eco_rating)

    analytics = flight.Analytics
    if analytics is None:
        analytics = FlightAnalytics(FlightId=flight_id)
        db.add(analytics)

    analytics.BasePrice = price
    analytics.Co2Emissions = co2
    analytics.FuelEfficiency = fuel
    analytics.DelayProbability = delay_prob
    analytics.PredictedDelayMinutes = delay_mins
    analytics.SmartScore = smart
    analytics.IsEcoFriendly = co2 < 500.0
    analytics.IsBestValue = smart >= 70.0

    await db.commit()
    await db.refresh(analytics)
    return analytics


async def process_all_unprocessed(db: AsyncSession) -> dict:
    """Process every flight whose SmartScore is NULL or 0."""
    result = await db.execute(
        select(Flight.Id)
        .join(FlightAnalytics, Flight.Id == FlightAnalytics.FlightId, isouter=True)
        .where(
            (FlightAnalytics.SmartScore == None) | (FlightAnalytics.SmartScore == 0)
        )
    )
    ids = [row[0] for row in result.all()]

    processed = skipped = errors = 0
    for fid in ids:
        try:
            result = await process_flight_analytics(db, fid)
            if result:
                processed += 1
            else:
                skipped += 1
        except Exception:
            errors += 1

    return {"processed": processed, "skipped": skipped, "errors": errors}


async def get_flights_paginated(
    db: AsyncSession, page: int = 1, page_size: int = 20
) -> list[Flight]:
    offset = (page - 1) * page_size
    result = await db.execute(
        select(Flight)
        .options(
            selectinload(Flight.DepartureAirport),
            selectinload(Flight.ArrivalAirport),
            selectinload(Flight.AirlineEntity),
            selectinload(Flight.Analytics),
        )
        .offset(offset)
        .limit(page_size)
    )
    return list(result.scalars().all())


async def get_flight_by_id(db: AsyncSession, flight_id: int) -> Flight | None:
    return await _load_flight(db, flight_id)


async def get_smartest_flights(db: AsyncSession, limit: int = 10) -> list[Flight]:
    result = await db.execute(
        select(Flight)
        .join(FlightAnalytics, Flight.Id == FlightAnalytics.FlightId)
        .where(FlightAnalytics.SmartScore != None)
        .order_by(FlightAnalytics.SmartScore.desc())
        .options(
            selectinload(Flight.DepartureAirport),
            selectinload(Flight.ArrivalAirport),
            selectinload(Flight.AirlineEntity),
            selectinload(Flight.Analytics),
        )
        .limit(limit)
    )
    return list(result.scalars().all())


async def search_flights(
    db: AsyncSession,
    departure_code: str | None = None,
    arrival_code: str | None = None,
    limit: int = 10,
) -> list[Flight]:
    query = (
        select(Flight)
        .join(Flight.DepartureAirport)
        .join(Flight.ArrivalAirport)
        .options(
            selectinload(Flight.DepartureAirport),
            selectinload(Flight.ArrivalAirport),
            selectinload(Flight.AirlineEntity),
            selectinload(Flight.Analytics),
        )
        .limit(limit)
    )
    if departure_code:
        code = departure_code.upper()
        query = query.where(
            (Airport.IcaoCode == code) | (Airport.IataCode == code)
        )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_bookings(db: AsyncSession, user_id: int) -> list:
    from models import Booking
    result = await db.execute(
        select(Booking)
        .where(Booking.UserId == user_id)
        .options(
            selectinload(Booking.Flight).selectinload(Flight.DepartureAirport),
            selectinload(Booking.Flight).selectinload(Flight.ArrivalAirport),
            selectinload(Booking.Flight).selectinload(Flight.Analytics),
        )
    )
    return list(result.scalars().all())
