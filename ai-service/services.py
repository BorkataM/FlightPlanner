import math
from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased, selectinload

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
# Component scores  (all on a 1–10 scale, clamped)
# ---------------------------------------------------------------------------

def _clamp(value: float) -> float:
    return round(max(1.0, min(10.0, value)), 4)


def calculate_price_score(price: Decimal | float) -> float:
    """$50 → 10, $2 000+ → 1.  Linear, clamped."""
    score = 10.0 - ((float(price) - 50.0) / (2_000.0 - 50.0)) * 9.0
    return _clamp(score)


def calculate_eco_score(co2_emissions: float, eco_rating: float) -> float:
    """
    Blends CO₂ (70 %) and airline EcoRating (30 %).
    CO₂ 0 kg → 10, 5 000 kg+ → 1.  EcoRating already 0–10.
    """
    co2_component = 10.0 - (co2_emissions / 5_000.0) * 9.0
    blended = co2_component * 0.70 + eco_rating * 0.30
    return _clamp(blended)


def calculate_delay_score(delay_probability: float) -> float:
    """0 % delay → 10, 100 % delay → 1.  Linear, clamped."""
    return _clamp(10.0 - delay_probability * 9.0)


# ---------------------------------------------------------------------------
# SmartScore
# ---------------------------------------------------------------------------

def calculate_smart_score(
    price_score: float,
    eco_score: float,
    delay_score: float,
) -> float:
    """
    SmartScore = (PriceScore × 0.4) + (EcoScore × 0.4) + (DelayScore × 0.2)
    Result clamped to [1.0, 10.0].
    """
    raw = price_score * 0.4 + eco_score * 0.4 + delay_score * 0.2
    return round(max(1.0, min(10.0, raw)), 2)


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


def _compute_analytics(flight: Flight) -> FlightAnalytics | None:
    """Pure calculation — no DB I/O.  Returns a populated (unsaved) FlightAnalytics."""
    dep = flight.DepartureAirport
    arr = flight.ArrivalAirport
    if dep is None or arr is None:
        return None

    distance_km = haversine_distance(dep.Latitude, dep.Longitude, arr.Latitude, arr.Longitude)
    eco_rating = flight.AirlineEntity.EcoRating if flight.AirlineEntity else 5.0
    price = flight.Price or Decimal("500")
    dep_time = flight.DepartureTime or datetime.utcnow()

    co2 = calculate_co2_emissions(distance_km, eco_rating)
    fuel = calculate_fuel_efficiency(distance_km, eco_rating)
    delay_prob = calculate_delay_probability(dep_time, distance_km)
    delay_mins = calculate_predicted_delay_minutes(delay_prob)

    price_score = calculate_price_score(price)
    eco_score = calculate_eco_score(co2, eco_rating)
    delay_score = calculate_delay_score(delay_prob)
    smart = calculate_smart_score(price_score, eco_score, delay_score)

    row = flight.Analytics or FlightAnalytics(FlightId=flight.Id)
    row.BasePrice = price
    row.Co2Emissions = co2
    row.FuelEfficiency = fuel
    row.DelayProbability = delay_prob
    row.PredictedDelayMinutes = delay_mins
    row.SmartScore = smart
    row.IsEcoFriendly = eco_score > 8.0
    row.IsBestValue = smart > 8.5
    return row


async def process_flight_analytics(db: AsyncSession, flight_id: int) -> FlightAnalytics | None:
    """Calculate and persist analytics for a single flight."""
    flight = await _load_flight(db, flight_id)
    if flight is None:
        return None

    row = _compute_analytics(flight)
    if row is None:
        return None

    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


async def process_all_unprocessed(db: AsyncSession) -> dict:
    """
    Load every flight with SmartScore == 0 or NULL, compute analytics for all,
    then commit in a single bulk operation.
    """
    result = await db.execute(
        select(Flight)
        .join(FlightAnalytics, Flight.Id == FlightAnalytics.FlightId, isouter=True)
        .where(
            (FlightAnalytics.SmartScore == None) | (FlightAnalytics.SmartScore == 0)
        )
        .options(
            selectinload(Flight.DepartureAirport),
            selectinload(Flight.ArrivalAirport),
            selectinload(Flight.AirlineEntity),
            selectinload(Flight.Analytics),
        )
    )
    flights = list(result.scalars().all())

    processed = skipped = errors = 0
    for flight in flights:
        try:
            row = _compute_analytics(flight)
            if row is None:
                skipped += 1
                continue
            db.add(row)
            processed += 1
        except Exception:
            errors += 1

    if processed:
        await db.commit()

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
    dep = aliased(Airport)
    arr = aliased(Airport)

    query = (
        select(Flight)
        .join(dep, Flight.DepartureAirportId == dep.Id)
        .join(arr, Flight.ArrivalAirportId == arr.Id)
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
        query = query.where((dep.IcaoCode == code) | (dep.IataCode == code))
    if arrival_code:
        code = arrival_code.upper()
        query = query.where((arr.IcaoCode == code) | (arr.IataCode == code))
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
