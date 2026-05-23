export interface Airport {
  icaoCode: string
  iataCode: string | null
  name: string
  city: string
  country: string
}

export interface FlightAnalytics {
  smartScore: number | null
  co2Emissions: number | null
  isEcoFriendly: boolean | null
  isBestValue: boolean | null
}

export interface FlightDto {
  id: number
  flightNumber: string
  airlineName: string
  airlineEcoRating: number | null
  departureAirportCode: string
  departureAirportName: string
  departureCity: string
  arrivalAirportCode: string
  arrivalAirportName: string
  arrivalCity: string
  departureTime: string | null
  arrivalTime: string | null
  price: number
  analytics: FlightAnalytics | null
}
