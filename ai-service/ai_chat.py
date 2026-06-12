"""
ChatGPT integration layer.

The assistant can call three tools to query live flight data:
  • search_flights      — find flights by route
  • get_smartest_flights — rank by SmartScore
  • get_flight_analytics — full analytics for one flight

An agentic loop runs until the model produces a plain-text response
(no pending tool calls).
"""
import json
import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

import services
from database import settings
from schemas import ChatRequest, ChatResponse, UserContext

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

# ---------------------------------------------------------------------------
# Tool definitions (OpenAI function-calling schema)
# ---------------------------------------------------------------------------

TOOLS: list[dict] = [
    {
        "type": "function",
        "function": {
            "name": "search_flights",
            "description": (
                "Search available flights in the database. All parameters are optional — "
                "call with no filters to browse all available flights, or filter by "
                "departure and/or arrival airport using an IATA or ICAO code. "
                "Use this to discover what destinations are actually available before making a recommendation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "departure_code": {
                        "type": "string",
                        "description": "IATA (e.g. JFK) or ICAO code of the departure airport.",
                    },
                    "arrival_code": {
                        "type": "string",
                        "description": "IATA or ICAO code of the arrival airport.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default 20). Use a higher value for open-ended browsing.",
                        "default": 20,
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_smartest_flights",
            "description": (
                "Return the top flights ranked by SmartScore — a composite metric that "
                "rewards low price, low CO₂, low delay probability, and a high airline "
                "eco rating.  Use this when the user asks for the 'best', 'smartest', "
                "or most eco-friendly option."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "How many top flights to return (default 5).",
                        "default": 5,
                    }
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_my_bookings",
            "description": "Get the current user's flight booking history for personalised recommendations.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_flight_analytics",
            "description": "Get detailed analytics (CO₂, delay probability, SmartScore …) for a specific flight.",
            "parameters": {
                "type": "object",
                "properties": {
                    "flight_id": {
                        "type": "integer",
                        "description": "The numeric ID of the flight.",
                    }
                },
                "required": ["flight_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "initiate_booking",
            "description": (
                "Start the checkout process for a specific flight. "
                "Call this ONLY after the user confirmed they want to book. "
                "Use the passenger name from the system context. "
                "This sends the user to the payment page — do NOT ask for card details."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "flight_id": {
                        "type": "integer",
                        "description": "The numeric ID of the flight to book.",
                    },
                    "passenger_first_name": {
                        "type": "string",
                        "description": "Passenger's first name (use from system context).",
                    },
                    "passenger_last_name": {
                        "type": "string",
                        "description": "Passenger's last name (use from system context).",
                    },
                },
                "required": ["flight_id", "passenger_first_name", "passenger_last_name"],
            },
        },
    },
]

_SYSTEM_PROMPT_BASE = """You are FlightAI, a smart flight assistant for the FlightPlanner platform.

Your job is to help users find the best flights — balancing price, environmental impact, and punctuality.

## HARD RULE — read this before anything else

BEFORE you write a single word of response, you MUST call a tool to fetch real data.
- Do NOT name any destination, city, or airport until AFTER you have called a tool and seen the actual results.
- Do NOT say "there are no flights to X" unless you called search_flights and the result was empty.
- Destinations like Miami, Honolulu, Cancun, Bali — these come from your training data. They may not exist in this database. NEVER assume they do.

For open-ended requests ("sunny destination", "beach", "somewhere warm", "I'm flexible"):
1. Call search_flights with NO arrival_code — just departure_code if the user mentioned one, or no parameters at all to browse everything available.
2. Look at the arrival cities returned by the tool.
3. Match them to the user's stated mood or preferences (warm climate, beach, etc.).
4. Propose the best matching flight YOU found. Do NOT ask the user to pick a destination — that is YOUR job.

## Guidelines
- Keep responses short and direct — 2-4 sentences max, no bullet lists unless showing multiple flights.
- Lead with the answer, not the reasoning. Skip intros like "Great question!" or "Let me check...".
- Never ask more than one follow-up question.
- If the user mentions a city name but not a code, infer the IATA code yourself.
- If the user says they are flexible with dates, do not ask for dates — just propose the best option you found.

How to present flights to the user:
- NEVER lead with the flight number — users don't care about it. Lead with the airline, date, time, and price.
- ALWAYS mention the airline name.
- For a one-way flight: "Wizz Air: Sofia → Milan, July 21 at 14:35, $57. CO₂ 45 kg, SmartScore 8.2."
- For round-trip, ALWAYS present BOTH legs together:
  • Outbound: airline, route, date, departure time, price
  • Return: airline, route, date, departure time, price
  • Total combined price
  • Destination weather tip if relevant (e.g. "Warsaw in late July averages 24 °C, mostly sunny.")
- Mention CO₂ and SmartScore only if they are notably good or the user asked about eco/quality.
- If you found a good outbound flight but no return yet, say so and ask which dates work for the return — do NOT present an incomplete round-trip as a recommendation.

Booking flow (follow exactly):
1. Every time you propose a specific flight to a user, you MUST embed its numeric id using EXACTLY this format anywhere in your message: `[flight_id: 123]` (replace 123 with the real integer `id` field from the tool result — NOT the flight number string). This applies whether you are recommending proactively or the user asked to book.
2. You already know the passenger name from this system prompt — use it. Do NOT ask for it.
3. End every flight proposal with: "Shall I book this for [FirstName]?" — one question, nothing else.
4. When the user says YES (or "book it", "go ahead", "sure", any affirmation) to a flight proposal:
   a. Scan the conversation history for the most recent assistant message that contains `[flight_id: NNN]`.
   b. Extract that integer. Call initiate_booking immediately with that id and the passenger name. Do NOT re-search. Do NOT ask again.
   c. If you cannot find a `[flight_id: NNN]` tag anywhere in history, say "I lost track of the flight — let me find it again" and call search_flights to recover it.
5. ONLY after initiate_booking succeeds (returns ready_for_checkout), tell the user they are being sent to the payment page.
6. If initiate_booking returns an error, tell the user what went wrong. Do NOT offer an alternative flight silently.
7. Do NOT ask for payment details, nationality, DOB, baggage, or insurance — those are collected on the checkout page.
8. NEVER offer a different flight when the user said yes to a specific one. "Yes" means proceed with THAT flight.
"""


def _build_system_prompt(user_context: UserContext | None) -> str:
    if user_context is None:
        return _SYSTEM_PROMPT_BASE
    return (
        _SYSTEM_PROMPT_BASE
        + f"\nYou are talking to {user_context.first_name} {user_context.last_name} "
        f"({user_context.email}). You can use get_my_bookings to see their booking history "
        f"and provide personalised recommendations."
    )

# ---------------------------------------------------------------------------
# Tool executor
# ---------------------------------------------------------------------------

def _flight_to_dict(flight) -> dict:
    return {
        "id": flight.Id,
        "flight_number": flight.FlightNumber,
        "departure": getattr(flight.DepartureAirport, "IataCode", None)
        or getattr(flight.DepartureAirport, "IcaoCode", None),
        "arrival": getattr(flight.ArrivalAirport, "IataCode", None)
        or getattr(flight.ArrivalAirport, "IcaoCode", None),
        "departure_city": getattr(flight.DepartureAirport, "City", None),
        "arrival_city": getattr(flight.ArrivalAirport, "City", None),
        "airline": getattr(flight.AirlineEntity, "Name", flight.AirlineName),
        "departure_time": str(flight.DepartureTime) if flight.DepartureTime else None,
        "price_usd": float(flight.Price) if flight.Price else None,
        "smart_score": getattr(flight.Analytics, "SmartScore", None),
        "co2_kg": getattr(flight.Analytics, "Co2Emissions", None),
        "delay_probability": getattr(flight.Analytics, "DelayProbability", None),
        "is_eco_friendly": getattr(flight.Analytics, "IsEcoFriendly", None),
        "is_best_value": getattr(flight.Analytics, "IsBestValue", None),
    }


def _assistant_message_to_dict(msg) -> dict:
    """Convert a ChatCompletionMessage response object to a plain dict safe for re-use in messages."""
    d: dict = {"role": "assistant", "content": msg.content}
    if msg.tool_calls:
        d["tool_calls"] = [
            {
                "id": tc.id,
                "type": "function",
                "function": {"name": tc.function.name, "arguments": tc.function.arguments},
            }
            for tc in msg.tool_calls
        ]
    return d


def _booking_to_dict(booking) -> dict:
    flight = booking.Flight
    return {
        "booking_id": booking.Id,
        "confirmation_code": booking.ConfirmationCode,
        "seat_number": booking.SeatNumber,
        "booking_date": str(booking.BookingDate) if booking.BookingDate else None,
        "flight_number": getattr(flight, "FlightNumber", None),
        "departure": getattr(getattr(flight, "DepartureAirport", None), "IataCode", None)
            or getattr(getattr(flight, "DepartureAirport", None), "IcaoCode", None),
        "arrival": getattr(getattr(flight, "ArrivalAirport", None), "IataCode", None)
            or getattr(getattr(flight, "ArrivalAirport", None), "IcaoCode", None),
        "departure_time": str(flight.DepartureTime) if flight and flight.DepartureTime else None,
        "price_usd": float(flight.Price) if flight and flight.Price else None,
        "smart_score": getattr(getattr(flight, "Analytics", None), "SmartScore", None),
    }


async def _execute_tool(name: str, args: dict, db: AsyncSession, user_context: UserContext | None = None) -> str:
    if name == "get_my_bookings":
        if user_context is None:
            return json.dumps({"error": "No authenticated user context available."})
        bookings = await services.get_user_bookings(db, user_context.user_id)
        return json.dumps([_booking_to_dict(b) for b in bookings])

    if name == "search_flights":
        flights = await services.search_flights(
            db,
            departure_code=args.get("departure_code"),
            arrival_code=args.get("arrival_code"),
            limit=args.get("limit", 10),
        )
        return json.dumps([_flight_to_dict(f) for f in flights])

    if name == "get_smartest_flights":
        flights = await services.get_smartest_flights(db, limit=args.get("limit", 5))
        return json.dumps([_flight_to_dict(f) for f in flights])

    if name == "get_flight_analytics":
        flight = await services.get_flight_by_id(db, args["flight_id"])
        if flight is None:
            return json.dumps({"error": "Flight not found"})
        return json.dumps(_flight_to_dict(flight))

    if name == "initiate_booking":
        if user_context is None:
            return json.dumps({"error": "No authenticated user context available."})
        first = args.get("passenger_first_name") or user_context.first_name
        last  = args.get("passenger_last_name")  or user_context.last_name
        result = await services.initiate_booking(db, args["flight_id"], first, last)
        return json.dumps(result)

    return json.dumps({"error": f"Unknown tool: {name}"})


# ---------------------------------------------------------------------------
# Main chat function
# ---------------------------------------------------------------------------

async def chat(request: ChatRequest, db: AsyncSession) -> ChatResponse:
    user_context = request.user_context
    messages: list[dict] = [{"role": "system", "content": _build_system_prompt(user_context)}]

    for msg in request.conversation_history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    tools_used: list[str] = []
    flight_ids: list[int] = []
    checkout_data: dict | None = None

    # Agentic loop — keep going while the model wants to call tools.
    # We only append the assistant message to history when it has tool_calls
    # (i.e. the loop continues). The final text response is never appended so
    # the messages list never ends with a null-content assistant entry.
    MAX_ITERATIONS = 3
    choice = None
    for _ in range(MAX_ITERATIONS):
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_completion_tokens=512,  # tool call JSON is ~100 tokens; save 2048 for final text
        )

        choice = response.choices[0]
        logger.info(
            "model=%s finish=%s content=%r tool_calls=%s",
            settings.OPENAI_MODEL,
            choice.finish_reason,
            choice.message.content,
            [tc.function.name for tc in (choice.message.tool_calls or [])],
        )

        if choice.finish_reason != "tool_calls":
            break

        # Has tool calls — add the assistant turn and execute each tool
        messages.append(_assistant_message_to_dict(choice.message))

        for tool_call in choice.message.tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)

            tools_used.append(tool_name)
            if "flight_id" in tool_args:
                flight_ids.append(tool_args["flight_id"])

            tool_result = await _execute_tool(tool_name, tool_args, db, user_context)

            if tool_name == "initiate_booking":
                try:
                    parsed = json.loads(tool_result)
                    if parsed.get("ready_for_checkout"):
                        checkout_data = parsed
                except (json.JSONDecodeError, TypeError):
                    pass

            if tool_name in ("search_flights", "get_smartest_flights"):
                try:
                    results = json.loads(tool_result)
                    if isinstance(results, list):
                        flight_ids.extend(r["id"] for r in results if "id" in r)
                except (json.JSONDecodeError, TypeError):
                    pass

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                }
            )

    final_message = (choice.message.content or "") if choice else ""

    # Model ran tool calls but returned no text — ask for a plain summary.
    # At this point messages ends cleanly with the last tool_result entry,
    # so no null-content assistant entry is present to confuse the model.
    if not final_message.strip() and tools_used:
        messages.append({"role": "user", "content": "Based on the flight data above, give me a short recommendation in 2-3 sentences."})
        for attempt in range(3):
            summary = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_completion_tokens=1024,
            )
            summary_content = summary.choices[0].message.content
            logger.info("summary attempt=%d finish=%s content=%r", attempt, summary.choices[0].finish_reason, summary_content)
            if summary_content and summary_content.strip():
                final_message = summary_content
                break
        else:
            final_message = "I searched the available flights but couldn't generate a response. Please try again."

    return ChatResponse(
        message=final_message,
        flight_ids_mentioned=list(set(flight_ids)),
        tool_calls_made=tools_used,
        checkout_data=checkout_data,
    )
