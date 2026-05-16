from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

import ai_chat
import services
from database import engine, get_db
from models import Base
from schemas import (
    AnalyticsProcessResult,
    ChatRequest,
    ChatResponse,
    FlightAnalyticsOut,
    FlightOut,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Verify DB connectivity on startup (no table creation — tables are managed by .NET)
    async with engine.connect() as conn:
        await conn.run_sync(lambda _: None)
    yield


app = FastAPI(
    title="FlightPlanner AI Service",
    description="AI brain for flight analytics and smart recommendations.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": "FlightPlanner AI Service"}


# ---------------------------------------------------------------------------
# Flights
# ---------------------------------------------------------------------------

@app.get("/flights", response_model=list[FlightOut], tags=["Flights"])
async def list_flights(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List flights with pagination."""
    return await services.get_flights_paginated(db, page=page, page_size=page_size)


@app.get("/flights/{flight_id}", response_model=FlightOut, tags=["Flights"])
async def get_flight(flight_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single flight with full analytics."""
    flight = await services.get_flight_by_id(db, flight_id)
    if flight is None:
        raise HTTPException(status_code=404, detail="Flight not found")
    return flight


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@app.get("/analytics/smartest", response_model=list[FlightOut], tags=["Analytics"])
async def smartest_flights(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Return flights ranked by SmartScore (highest first)."""
    return await services.get_smartest_flights(db, limit=limit)


@app.post(
    "/analytics/process",
    response_model=AnalyticsProcessResult,
    tags=["Analytics"],
)
async def process_all(db: AsyncSession = Depends(get_db)):
    """
    Calculate and persist analytics for every flight that has a NULL or zero SmartScore.
    Safe to call repeatedly — already-processed flights are skipped.
    """
    result = await services.process_all_unprocessed(db)
    return result


@app.post(
    "/analytics/process/{flight_id}",
    response_model=FlightAnalyticsOut,
    tags=["Analytics"],
)
async def process_one(flight_id: int, db: AsyncSession = Depends(get_db)):
    """Calculate and persist analytics for a single flight."""
    analytics = await services.process_flight_analytics(db, flight_id)
    if analytics is None:
        raise HTTPException(
            status_code=404,
            detail="Flight not found or missing airport coordinates.",
        )
    return analytics


# ---------------------------------------------------------------------------
# AI Chat
# ---------------------------------------------------------------------------

@app.post("/ai/chat", response_model=ChatResponse, tags=["AI"])
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Chat with the FlightAI assistant.

    The assistant has access to live flight data and will use it to answer questions
    and recommend the smartest flights.

    Send conversation_history to maintain multi-turn context.
    """
    try:
        return await ai_chat.chat(request, db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
