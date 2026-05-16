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
from decimal import Decimal

from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

import services
from database import settings
from schemas import ChatRequest, ChatResponse

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
                "Search available flights. Optionally filter by departure or arrival "
                "airport using an IATA or ICAO code."
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
                        "description": "Maximum number of results to return (default 10).",
                        "default": 10,
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
]

SYSTEM_PROMPT = """You are FlightAI, an intelligent flight assistant for the FlightPlanner platform.

Your job is to help users find the smartest flights — balancing price, environmental impact,
and punctuality. You have access to live flight data through the tools provided.

Guidelines:
- Always use a tool to fetch real data before making recommendations.
- When recommending flights, highlight the SmartScore, CO₂ emissions, and price.
- Explain trade-offs clearly (e.g. cheaper but higher emissions).
- Be concise and friendly.
- If the user mentions a city name but not a code, do your best to infer the IATA code.
"""

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


async def _execute_tool(name: str, args: dict, db: AsyncSession) -> str:
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

    return json.dumps({"error": f"Unknown tool: {name}"})


# ---------------------------------------------------------------------------
# Main chat function
# ---------------------------------------------------------------------------

async def chat(request: ChatRequest, db: AsyncSession) -> ChatResponse:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]

    for msg in request.conversation_history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": request.message})

    tools_used: list[str] = []
    flight_ids: list[int] = []

    # Agentic loop — keep going while the model wants to call tools
    while True:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            max_completion_tokens=1024,
        )

        choice = response.choices[0]
        messages.append(choice.message)

        if choice.finish_reason != "tool_calls":
            break

        for tool_call in choice.message.tool_calls:
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)

            tools_used.append(tool_name)
            if "flight_id" in tool_args:
                flight_ids.append(tool_args["flight_id"])

            tool_result = await _execute_tool(tool_name, tool_args, db)

            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": tool_result,
                }
            )

    final_message = choice.message.content or ""
    return ChatResponse(
        message=final_message,
        flight_ids_mentioned=list(set(flight_ids)),
        tool_calls_made=tools_used,
    )
