import type { BookingRecord } from '../../services/api'
import type { FlightDto } from '../../features/search/types'

export interface LocalBooking {
  confirmationCode:   string
  outboundBookingId:  number
  returnBookingId:    number | null
  passenger:          { firstName: string; lastName: string; dob: string; gender: string; nationality: string }
  fromCity:           string
  toCity:             string
  isRoundTrip:        boolean
  grandTotal:         number
  createdAt:          string
  outbound?:          FlightDto
  ret?:               FlightDto | null
  baggage?:           string
  checkedBaggage?:    boolean
  insurance?:         string
}

export interface Trip {
  local:    LocalBooking | undefined
  outbound: BookingRecord
  ret:      BookingRecord | null
}

export function getLocalBookings(): LocalBooking[] {
  try {
    return JSON.parse(localStorage.getItem('skywave_local_bookings') ?? '[]')
  } catch {
    return []
  }
}

export function groupIntoTrips(bookings: BookingRecord[], locals: LocalBooking[]): Trip[] {
  const used = new Set<number>()
  const trips: Trip[] = []

  // Pair bookings that belong to the same local booking record
  for (const local of locals) {
    const outbound = bookings.find(b => b.id === local.outboundBookingId)
    if (!outbound) continue

    const ret = local.returnBookingId != null
      ? (bookings.find(b => b.id === local.returnBookingId) ?? null)
      : null

    used.add(outbound.id)
    if (ret) used.add(ret.id)

    trips.push({ local, outbound, ret })
  }

  // Any remaining bookings with no local data become solo trips
  for (const b of bookings) {
    if (!used.has(b.id)) {
      trips.push({ local: undefined, outbound: b, ret: null })
    }
  }

  return trips.sort((a, b) =>
    new Date(a.outbound.departureTime).getTime() -
    new Date(b.outbound.departureTime).getTime()
  )
}

export function isUpcoming(trip: Trip): boolean {
  return new Date(trip.outbound.departureTime) > new Date()
}

export function tripDurationMin(b: BookingRecord): number {
  return (new Date(b.arrivalTime).getTime() - new Date(b.departureTime).getTime()) / 60000
}

export function fmtDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`
}

export function fmtTime(s: string): string {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
