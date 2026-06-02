import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Ticket, Loader2 } from 'lucide-react'
import { bookingsApi } from '../services/api'
import type { BookingRecord } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  groupIntoTrips, isUpcoming, getLocalBookings, type Trip,
} from '../components/bookings/tripUtils'
import TripCard from '../components/bookings/TripCard'
import TripSidebar from '../components/bookings/TripSidebar'

export default function MyBookingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    bookingsApi.getMyBookings(user.token)
      .then(setBookings)
      .catch(e => setError(e.message ?? 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [user])

  const locals   = getLocalBookings()
  const trips    = groupIntoTrips(bookings, locals)
  const upcoming: Trip[] = trips.filter(isUpcoming)
  const past:     Trip[] = trips.filter(t => !isUpcoming(t)).reverse()

  const hasTrips = trips.length > 0

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navbar */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>
          <span className="font-black text-slate-900 tracking-tight">SkyWave</span>
          <h1 className="text-sm font-black text-slate-900 tracking-tight">My Bookings</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pt-6 pb-16 flex-1 flex flex-col">

        {!user ? (
          <EmptyState
            title="Sign in to see your bookings"
            sub="Your trip history is linked to your account."
            action="Go to homepage"
            onAction={() => navigate('/')}
          />
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-32 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading your bookings…</span>
          </div>
        ) : error ? (
          <div className="text-center py-32 text-red-500 text-sm">{error}</div>
        ) : !hasTrips ? (
          <EmptyState
            title="No bookings yet"
            sub="Once you book a flight it will appear here."
            action="Search flights"
            onAction={() => navigate('/')}
          />
        ) : (
          <div className="grid grid-cols-[300px_1fr] gap-8 items-start">
            {/* Left sidebar */}
            <TripSidebar upcoming={upcoming} past={past} />

            {/* Right: trip cards */}
            <div>
              {upcoming.length > 0 && (
                <Section title="Upcoming trips">
                  {upcoming.map((t, i) => (
                    <TripCard key={i} trip={t} upcoming={true} />
                  ))}
                </Section>
              )}
              {past.length > 0 && (
                <Section title="Past trips" dimmed>
                  {past.map((t, i) => (
                    <TripCard key={i} trip={t} upcoming={false} />
                  ))}
                </Section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({
  title, children, dimmed,
}: {
  title: string; children: React.ReactNode; dimmed?: boolean
}) {
  return (
    <div className={`mb-8 ${dimmed ? 'opacity-70' : ''}`}>
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  )
}

function EmptyState({
  title, sub, action, onAction,
}: {
  title: string; sub: string; action: string; onAction: () => void
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
        <Ticket className="w-7 h-7 text-blue-400" />
      </div>
      <p className="text-slate-700 font-bold text-lg">{title}</p>
      <p className="text-slate-400 text-sm max-w-xs">{sub}</p>
      <button
        onClick={onAction}
        className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
      >
        {action}
      </button>
    </div>
  )
}
