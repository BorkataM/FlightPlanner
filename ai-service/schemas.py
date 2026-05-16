from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class AirportOut(BaseModel):
    Id: int
    IcaoCode: str
    IataCode: str | None
    Name: str
    City: str
    Country: str
    Latitude: float
    Longitude: float

    model_config = {"from_attributes": True}


class AirlineOut(BaseModel):
    Id: int
    IcaoCode: str
    Name: str
    BaseFareModifier: Decimal
    EcoRating: float

    model_config = {"from_attributes": True}


class FlightAnalyticsOut(BaseModel):
    FlightId: int
    BasePrice: Decimal | None
    DelayProbability: float | None
    PredictedDelayMinutes: int | None
    Co2Emissions: float | None
    FuelEfficiency: float | None
    SmartScore: float | None
    IsEcoFriendly: bool | None
    IsBestValue: bool | None

    model_config = {"from_attributes": True}


class FlightOut(BaseModel):
    Id: int
    FlightNumber: str
    AirlineName: str | None
    AirlineId: int | None
    DepartureAirportId: int
    ArrivalAirportId: int
    DepartureTime: datetime | None
    ArrivalTime: datetime | None
    Price: Decimal | None
    LastUpdated: datetime | None
    DepartureAirport: AirportOut | None = None
    ArrivalAirport: AirportOut | None = None
    AirlineEntity: AirlineOut | None = None
    Analytics: FlightAnalyticsOut | None = None

    model_config = {"from_attributes": True}


class FlightSummaryOut(BaseModel):
    Id: int
    FlightNumber: str
    DepartureAirport: str
    ArrivalAirport: str
    DepartureTime: datetime | None
    Price: Decimal | None
    SmartScore: float | None
    Co2Emissions: float | None
    IsEcoFriendly: bool | None

    model_config = {"from_attributes": True}


class AnalyticsProcessResult(BaseModel):
    processed: int
    skipped: int
    errors: int


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    user_id: int | None = None


class ChatResponse(BaseModel):
    message: str
    flight_ids_mentioned: list[int] = []
    tool_calls_made: list[str] = []
