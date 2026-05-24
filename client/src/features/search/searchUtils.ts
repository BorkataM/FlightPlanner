import type { Airport, FlightDto } from './types'

export const POPULAR_COUNTRIES = [
  'GR', 'ES', 'IT', 'TR', 'FR', 'GB',
  'DE', 'PT', 'NL', 'HR', 'AT', 'CZ',
  'AE', 'US', 'TH',
]

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function toCountryName(code: string): string {
  if (!code || code.length !== 2) return code
  try { return regionNames.of(code.toUpperCase()) ?? code }
  catch { return code }
}

export function toDateKey(d: Date): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function flightsToAirports(flights: FlightDto[]): Airport[] {
  const seen = new Set<string>()
  return flights.reduce<Airport[]>((acc, f) => {
    if (!seen.has(f.arrivalAirportCode)) {
      seen.add(f.arrivalAirportCode)
      acc.push({
        icaoCode: f.arrivalAirportCode,
        iataCode: f.arrivalAirportCode,
        name:     f.arrivalAirportName,
        city:     f.arrivalCity,
        country:  '',
      })
    }
    return acc
  }, [])
}
