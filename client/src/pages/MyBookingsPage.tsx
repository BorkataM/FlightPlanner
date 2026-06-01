import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Plane, Ticket, Loader2, Calendar, ArrowRight } from 'lucide-react'
import { bookingsApi } from '../services/api'
import type { BookingRecord } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface LocalBooking {
  confirmationCode:  string
  outboundBookingId: number
  returnBookingId:   number | null
  passenger:         { firstName: string; lastName: string; dob: string }
  fromCity:          string
  toCity:            string
  isRoundTrip:       boolean
  grandTotal:        number
  createdAt:         string
}

const fmtTime = (s: string) => {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function BookingCard({ booking, local }: { booking: BookingRecord; local?: LocalBooking }) {
  const navigate = useNavigate()
  const isReturn = local ? booking.id === local.returnBookingId : false

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${
            isReturn
              ? 'bg-violet-50 text-violet-500 border-violet-100'
              : 'bg-blue-50 text-blue-500 border-blue-100'
          }`}>
            {isReturn ? 'Return' : 'Outbound'}
          </div>
          <span className="text-sm font-semibold text-slate-700">{booking.flightNumber}</span>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ref</div>
          <div className="text-sm font-black text-blue-600 tracking-widest font-mono">
            {booking.confirmationCode}
          </div>
        </div>
      </div>

      {/* flight info */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-[22px] font-black text-slate-900 tabular-nums leading-none">
              {fmtTime(booking.departureTime)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1 tracking-wide">
              {booking.departureAirport}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex items-center gap-1.5">
              <div className="flex-1 h-px bg-slate-200" />
              <Plane className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0" />
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <span className="text-[10px] text-slate-400">Direct</span>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[22px] font-black text-slate-900 tabular-nums leading-none">
              {fmtTime(booking.arrivalTime)}
            </div>
            <div className="text-[11px] font-bold text-slate-400 mt-1 tracking-wide">
              {booking.arrivalAirport}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          {fmtDate(booking.departureTime)}
          {local && (
            <span className="ml-auto font-semibold text-slate-600">
              Passenger: {local.passenger.firstName} {local.passenger.lastName}
            </span>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-50/60 border-t border-slate-100">
        <div>
          <span className="text-xs text-slate-400">Price paid · </span>
          <span className="text-sm font-bold text-slate-800">€{Math.round(booking.price)}</span>
        </div>
        <button
          onClick={() => navigate('/boarding-pass', {
            state: { bookingRef: booking.confirmationCode, booking, local },
          })}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Boarding pass <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const navigate  = useNavigate()
  const { user }  = useAuth()

  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  /* local enrichment data */
  const localBookings: LocalBooking[] = JSON.parse(
    localStorage.getItem('skywave_local_bookings') ?? '[]'
  )

  const getLocal = (b: BookingRecord): LocalBooking | undefined =>
    localBookings.find(l =>
      l.outboundBookingId === b.id || l.returnBookingId === b.id
    )

  useEffect(() => {
    if (!user) { setLoading(false); return }
    bookingsApi.getMyBookings(user.token)
      .then(setBookings)
      .catch(e => setError(e.message ?? 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          <span className="font-black text-slate-900 tracking-tight">SkyWave</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-16">
        <h1 className="text-2xl font-black text-slate-900 mb-1">My Bookings</h1>
        <p className="text-slate-400 text-sm mb-8">All your upcoming and past trips.</p>

        {!user ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <Ticket className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-slate-700 font-bold text-lg">Sign in to see your bookings</p>
            <p className="text-slate-400 text-sm">Your trip history is linked to your account.</p>
            <button onClick={() => navigate('/')}
              className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Go to homepage
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-32 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading your bookings…</span>
          </div>
        ) : error ? (
          <div className="text-center py-32 text-red-500 text-sm">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
              <Ticket className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-slate-700 font-bold text-lg">No bookings yet</p>
            <p className="text-slate-400 text-sm max-w-xs">
              Once you book a flight it will appear here.
            </p>
            <button onClick={() => navigate('/')}
              className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Search flights
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map(b => (
              <BookingCard key={b.id} booking={b} local={getLocal(b)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
