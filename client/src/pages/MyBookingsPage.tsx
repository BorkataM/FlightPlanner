import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, ArrowLeft } from 'lucide-react'
import FlightLoader from '../components/common/FlightLoader'
import { bookingsApi } from '../services/api'
import type { BookingRecord } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { groupIntoTrips, isUpcoming, getLocalBookings, type Trip } from '../components/bookings/tripUtils'
import { LeftPanel, RightPanel, EmptyRight } from '../components/bookings/MyBookingsPanels'

// Main page
export default function MyBookingsPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { t } = useLocale()
  const mb = t.myBookings

  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState<Trip | undefined>(undefined)
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    bookingsApi.getMyBookings(user.token)
      .then(setBookings)
      .catch(e => setError((e as Error).message ?? 'Failed to load bookings'))
      .finally(() => setLoading(false))
  }, [user])

  const locals   = getLocalBookings()
  const trips    = groupIntoTrips(bookings, locals)
  const upcoming: Trip[] = trips.filter(isUpcoming)
  const past:     Trip[] = trips.filter(t => !isUpcoming(t)).reverse()

  const activeTrip = selected ?? upcoming[0] ?? past[0]

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-slate-700 dark:text-slate-200 font-bold text-lg mb-1">{mb.signIn}</p>
          <p className="text-slate-400 text-sm mb-6">{mb.signInSub}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm transition-colors">
            {mb.goToHomepage}
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <FlightLoader text={mb.loading} />

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-red-500 text-sm">{error}</div>
    )
  }

  const handleSelectTrip = (trip: Trip) => {
    setSelected(trip)
    setMobileView('detail')
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left panel: full-width on mobile (list view), fixed width on lg+ */}
      <div className={`${mobileView === 'detail' ? 'hidden lg:flex' : 'flex'} w-full lg:w-[270px] xl:w-[300px] flex-shrink-0 flex-col overflow-y-auto`}
        style={{ background: 'linear-gradient(180deg, #09131f 0%, #101e31 100%)' }}>
        <LeftPanel
          nextTrip={upcoming[0]}
          upcoming={upcoming}
          past={past}
          selected={activeTrip}
          onSelect={handleSelectTrip}
        />
      </div>

      {/* Right panel: hidden on mobile (list view), full-width on mobile (detail view) */}
      <div className={`${mobileView === 'list' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col overflow-y-auto`}>
        {mobileView === 'detail' && (
          <button
            onClick={() => setMobileView('list')}
            className="lg:hidden flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All Bookings
          </button>
        )}
        {activeTrip ? <RightPanel trip={activeTrip} /> : <EmptyRight />}
      </div>
    </div>
  )
}
