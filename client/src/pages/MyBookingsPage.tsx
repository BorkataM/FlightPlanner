import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, CalendarDays, Ticket, ArrowLeft } from 'lucide-react'
import FlightLoader from '../components/common/FlightLoader'
import { bookingsApi } from '../services/api'
import type { BookingRecord } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  groupIntoTrips, isUpcoming, getLocalBookings,
  fmtTime, fmtDate, tripDurationMin, fmtDuration,
  type Trip,
} from '../components/bookings/tripUtils'
import WeatherWidget from '../components/bookings/WeatherWidget'
import AirportRouteMap from '../components/bookings/AirportRouteMap'

// ── Countdown ─────────────────────────────────────────────────────
function useDiff(iso: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, new Date(iso).getTime() - now)
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    gone: diff === 0,
  }
}

function CountdownBox({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[30px] font-black text-white tabular-nums leading-none">
        {String(n).padStart(2, '0')}
      </span>
      <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider mt-1">{label}</span>
    </div>
  )
}

// ── Left panel atoms ─────────────────────────────────────────────
function LDetail({ icon: Icon, label, value, accent, mono }: {
  icon: React.ElementType; label: string; value: string; accent?: boolean; mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-3.5 h-3.5 text-white/30 shrink-0" />
      <span className="text-[11px] text-white/40 flex-1">{label}</span>
      <span className={`text-[11px] font-bold truncate max-w-[130px] ${mono ? 'font-mono' : ''} ${accent ? 'text-blue-400' : 'text-white/70'}`}>
        {value}
      </span>
    </div>
  )
}

function LSummaryRow({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
      <span className="text-[11px] text-white/40 flex-1">{label}</span>
      <span className="text-sm font-black text-white/70">{value}</span>
    </div>
  )
}

// ── Next flight section ───────────────────────────────────────────
function NextFlightSection({ trip }: { trip: Trip }) {
  const { outbound, local } = trip
  const depCode = local?.outbound?.departureAirportCode ?? outbound.departureAirport.slice(0, 3).toUpperCase()
  const arrCode = local?.outbound?.arrivalAirportCode   ?? outbound.arrivalAirport.slice(0, 3).toUpperCase()
  const { d, h, m, gone } = useDiff(outbound.departureTime)

  return (
    <div className="px-4 mb-4">
      {/* Label */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <Plane className="w-3 h-3 text-white/30 rotate-90" />
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.18em]">Next Flight</span>
      </div>

      {/* Route card */}
      <div
        className="rounded-2xl overflow-hidden mb-5 relative"
        style={{ background: 'linear-gradient(155deg, #1a4a8a 0%, #0d2c5c 45%, #060f1e 100%)' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 40%, rgba(59,130,246,0.35) 0%, transparent 60%),' +
              'radial-gradient(ellipse at 80% 70%, rgba(99,102,241,0.15) 0%, transparent 50%)',
          }}
        />
        <div className="relative px-5 py-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[34px] font-black text-white leading-none tracking-tight">{depCode}</div>
              <div className="text-[10px] text-white/40 mt-2 leading-snug" style={{ maxWidth: 100 }}>
                {outbound.departureAirport}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-1 px-2">
              <div className="flex-1 h-px bg-white/15" />
              <Plane className="w-4 h-4 text-white/25 rotate-90 shrink-0" />
              <div className="flex-1 h-px bg-white/15" />
            </div>
            <div className="text-right">
              <div className="text-[34px] font-black text-white leading-none tracking-tight">{arrCode}</div>
              <div className="text-[10px] text-white/40 mt-2 leading-snug text-right" style={{ maxWidth: 100 }}>
                {outbound.arrivalAirport}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown */}
      {gone ? (
        <p className="text-center font-black text-blue-400 text-sm mb-4">Departing now!</p>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3 mb-1.5">
            <CountdownBox n={d} label="Days" />
            <span className="text-xl font-black text-white/15 pb-4">:</span>
            <CountdownBox n={h} label="Hrs" />
            <span className="text-xl font-black text-white/15 pb-4">:</span>
            <CountdownBox n={m} label="Min" />
          </div>
          <p className="text-center text-[9px] text-white/25 font-medium mb-4">until departure</p>
        </>
      )}

      {/* Details */}
      <div className="space-y-2.5">
        <LDetail
          icon={CalendarDays}
          label="Departure"
          value={`${fmtTime(outbound.departureTime)} · ${fmtDate(outbound.departureTime)}`}
        />
        <LDetail icon={Plane}  label="Flight"      value={outbound.flightNumber}      mono />
        <LDetail icon={Ticket} label="Booking ref"  value={outbound.confirmationCode}  mono accent />
      </div>
    </div>
  )
}

// ── Left panel ────────────────────────────────────────────────────
function LeftPanel({ nextTrip, upcoming, past, selected, onSelect }: {
  nextTrip:  Trip | undefined
  upcoming:  Trip[]
  past:      Trip[]
  selected:  Trip | undefined
  onSelect:  (t: Trip) => void
}) {
  const navigate = useNavigate()
  const allTrips = [...upcoming, ...past]

  return (
    <div
      className="w-[300px] flex-shrink-0 flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(180deg, #09131f 0%, #101e31 100%)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </button>
        <span className="text-white/15 text-[9px] font-black tracking-[0.25em]">SKYWAVE</span>
      </div>

      {nextTrip ? (
        <NextFlightSection trip={nextTrip} />
      ) : (
        <div className="mx-4 mb-4 rounded-2xl border border-white/8 px-5 py-8 text-center">
          <Plane className="w-8 h-8 text-white/15 mx-auto mb-3 rotate-90" />
          <p className="text-sm font-bold text-white/35">No upcoming trips</p>
        </div>
      )}

      {/* Divider */}
      <div className="mx-5 h-px bg-white/8 mb-4" />

      {/* Summary */}
      <div className="px-5 pb-4">
        <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.18em] mb-3">Summary</p>
        <div className="space-y-3">
          <LSummaryRow icon={Plane}        label="Upcoming"   value={String(upcoming.length)}                color="text-blue-400"   />
          <LSummaryRow icon={CalendarDays} label="Past trips" value={String(past.length)}                   color="text-white/25"   />
          <LSummaryRow icon={Ticket}       label="Total"      value={String(upcoming.length + past.length)} color="text-violet-400" />
        </div>
      </div>

      {/* Trip list when multiple */}
      {allTrips.length > 1 && (
        <>
          <div className="mx-5 h-px bg-white/8 mb-4" />
          <div className="px-5 pb-6">
            <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.18em] mb-3">All Trips</p>
            <div className="space-y-1.5">
              {allTrips.map((t, i) => {
                const dep  = t.local?.outbound?.departureAirportCode ?? t.outbound.departureAirport.slice(0, 3).toUpperCase()
                const arr  = t.local?.outbound?.arrivalAirportCode   ?? t.outbound.arrivalAirport.slice(0, 3).toUpperCase()
                const isUp = isUpcoming(t)
                const isSel = t === selected
                return (
                  <button
                    key={i}
                    onClick={() => onSelect(t)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSel
                        ? 'bg-white/10 border border-white/15'
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Plane className={`w-3.5 h-3.5 shrink-0 rotate-90 ${isUp ? 'text-blue-400' : 'text-white/20'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold ${isUp ? 'text-white/70' : 'text-white/30'}`}>{dep} → {arr}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">{fmtDate(t.outbound.departureTime)}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Right panel ───────────────────────────────────────────────────
function RightPanel({ trip }: { trip: Trip }) {
  const navigate = useNavigate()
  const { outbound, ret, local } = trip
  const depName = outbound.departureAirport
  const arrName = outbound.arrivalAirport
  const dur     = fmtDuration(tripDurationMin(outbound))

  return (
    <div className="flex-1 overflow-y-auto bg-white min-w-0">

      {/* Top bar */}
      <div className="flex items-center gap-4 px-8 py-4 border-b border-slate-100">
        <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
          {ret ? 'Round Trip' : 'One Way'}
        </span>
        <button
          onClick={() => navigate('/boarding-pass', {
            state: { bookingRef: outbound.confirmationCode, booking: outbound, local },
          })}
          className="flex items-center gap-2 ml-auto px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
        >
          <Ticket className="w-3.5 h-3.5" /> Show boarding pass
        </button>
        <div className="text-right shrink-0">
          <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Ref</div>
          <div className="text-sm font-black text-slate-900 font-mono tracking-wider">{outbound.confirmationCode}</div>
        </div>
      </div>

      {/* Route header */}
      <div
        className="px-8 py-7"
        style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%)' }}
      >
        <div className="flex items-center gap-4">
          <span className="text-[22px] font-black text-white leading-tight flex-shrink">{depName}</span>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Plane className="w-5 h-5 text-white/50 rotate-90 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-white/25" />
          </div>
          <span className="text-[22px] font-black text-white leading-tight text-right flex-shrink">{arrName}</span>
        </div>
      </div>

      <div className="px-8 pt-6 pb-10 space-y-6">

        {/* Outbound flight card */}
        <FlightCard booking={outbound} dir="Outbound" depName={depName} arrName={arrName} dur={dur} />

        {/* Return flight card */}
        {ret && (
          <FlightCard
            booking={ret}
            dir="Return"
            depName={arrName}
            arrName={depName}
            dur={fmtDuration(tripDurationMin(ret))}
          />
        )}

        {/* Flight Conditions */}
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Flight Conditions
          </h2>
          <WeatherWidget flightId={outbound.flightId} />
        </section>

        {/* Get to Airport */}
        <section>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Get to Airport
          </h2>
          <AirportRouteMap flightId={outbound.flightId} />
        </section>
      </div>
    </div>
  )
}

function FlightCard({ booking, dir, depName, arrName, dur }: {
  booking: BookingRecord
  dir:     'Outbound' | 'Return'
  depName: string
  arrName: string
  dur:     string
}) {
  const isOut = dir === 'Outbound'
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-center gap-3 mb-5">
          <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${
            isOut
              ? 'bg-blue-50 text-blue-500 border-blue-100'
              : 'bg-violet-50 text-violet-500 border-violet-100'
          }`}>
            {dir}
          </span>
          <span className="text-xs text-slate-400 font-medium">{fmtDate(booking.departureTime)}</span>
          <span className="ml-auto font-mono text-xs font-bold text-slate-500">{booking.flightNumber}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-[42px] font-black text-slate-900 tabular-nums leading-none">
              {fmtTime(booking.departureTime)}
            </div>
            <div className="text-xs text-slate-400 mt-2 leading-tight">{depName}</div>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 px-2">
            <span className="text-xs font-semibold text-slate-400">{dur}</span>
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-200" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isOut ? 'bg-blue-50' : 'bg-violet-50'}`}>
                <Plane className={`w-4 h-4 ${isOut ? 'text-blue-500 rotate-90' : 'text-violet-500 -rotate-90'}`} />
              </div>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <span className="text-[10px] text-slate-400">Non-stop</span>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[42px] font-black text-slate-900 tabular-nums leading-none">
              {fmtTime(booking.arrivalTime)}
            </div>
            <div className="text-xs text-slate-400 mt-2 leading-tight">{arrName}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Empty right panel ─────────────────────────────────────────────
function EmptyRight() {
  const navigate = useNavigate()
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50/50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-7 h-7 text-blue-400" />
        </div>
        <p className="text-slate-700 font-bold text-lg mb-1">No bookings yet</p>
        <p className="text-slate-400 text-sm max-w-xs mb-6">Once you book a flight it will appear here.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          Search flights
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function MyBookingsPage() {
  const navigate = useNavigate()
  const { user }  = useAuth()

  const [bookings, setBookings] = useState<BookingRecord[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [selected, setSelected] = useState<Trip | undefined>(undefined)

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-slate-700 font-bold text-lg mb-1">Sign in to see your bookings</p>
          <p className="text-slate-400 text-sm mb-6">Your trip history is linked to your account.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-sm transition-colors">
            Go to homepage
          </button>
        </div>
      </div>
    )
  }

  if (loading) return <FlightLoader text="Loading your bookings…" />

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-red-500 text-sm">{error}</div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <LeftPanel
        nextTrip={upcoming[0]}
        upcoming={upcoming}
        past={past}
        selected={activeTrip}
        onSelect={setSelected}
      />
      {activeTrip ? <RightPanel trip={activeTrip} /> : <EmptyRight />}
    </div>
  )
}
