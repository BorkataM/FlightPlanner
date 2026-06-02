import { Plane, CalendarDays, Ticket } from 'lucide-react'
import type { Trip } from './tripUtils'
import { fmtDate, fmtTime } from './tripUtils'

interface Props {
  upcoming: Trip[]
  past:     Trip[]
}

// ── Countdown helpers ────────────────────────────────────────────
function useDiff(iso: string) {
  const diff = Math.max(0, new Date(iso).getTime() - Date.now())
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    gone: diff === 0,
  }
}

function CountdownUnit({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-[58px] h-[58px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200/60">
        <span className="text-2xl font-black text-white tabular-nums leading-none">
          {String(n).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ── Main sidebar ─────────────────────────────────────────────────
export default function TripSidebar({ upcoming, past }: Props) {
  const next = upcoming[0]

  return (
    <aside className="space-y-4 sticky top-24">

      {next ? (
        <NextFlightCard trip={next} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <Plane className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-700">No upcoming trips</p>
          <p className="text-xs text-slate-400 mt-1">Book a flight to get started</p>
        </div>
      )}

      {/* Upcoming trip list (only when > 1) */}
      {upcoming.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">All upcoming</p>
          <ol className="space-y-3">
            {upcoming.map((t, i) => {
              const from = t.local?.fromCity ?? t.outbound.departureAirport
              const to   = t.local?.toCity   ?? t.outbound.arrivalAirport
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-blue-500' : 'bg-slate-200'}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${i === 0 ? 'text-slate-800' : 'text-slate-500'}`}>
                      {from} → {to}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {fmtDate(t.outbound.departureTime)}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {/* Summary strip */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Summary</p>
        <div className="space-y-2.5">
          <Row icon={Plane}        label="Upcoming" value={String(upcoming.length)} color="text-blue-500"   />
          <Row icon={CalendarDays} label="Past trips" value={String(past.length)}   color="text-slate-400"  />
          <Row icon={Ticket}       label="Total"    value={String(upcoming.length + past.length)} color="text-violet-500" />
        </div>
      </div>
    </aside>
  )
}

function Row({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
      <span className="text-xs text-slate-500 flex-1">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  )
}

// ── Next flight card ─────────────────────────────────────────────
function NextFlightCard({ trip }: { trip: Trip }) {
  const { outbound, ret, local } = trip
  const fromCity = local?.fromCity ?? outbound.departureAirport
  const toCity   = local?.toCity   ?? outbound.arrivalAirport
  const depCode  = local?.outbound?.departureAirportCode
  const arrCode  = local?.outbound?.arrivalAirportCode
  const { d, h, m, gone } = useDiff(outbound.departureTime)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-5 pt-5 pb-6">
        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4">Next flight</p>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-2xl font-black text-white leading-none">{fromCity}</p>
            {depCode && <p className="text-sm font-black text-white/60 tracking-widest mt-1">{depCode}</p>}
          </div>
          <div className="flex-1 flex flex-col items-center gap-0.5">
            <div className="flex items-center w-full gap-1.5">
              <div className="flex-1 h-px bg-white/25" />
              <Plane className="w-4 h-4 text-white/50 rotate-90 shrink-0" />
              {ret && <div className="flex-1 h-px bg-white/25" />}
              {ret && <Plane className="w-4 h-4 text-white/50 -rotate-90 shrink-0" />}
              <div className="flex-1 h-px bg-white/25" />
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white leading-none">{toCity}</p>
            {arrCode && <p className="text-sm font-black text-white/60 tracking-widest mt-1">{arrCode}</p>}
          </div>
        </div>
      </div>

      {/* Countdown */}
      <div className="px-5 py-5 border-b border-slate-50">
        {gone ? (
          <p className="text-center text-base font-black text-blue-600 py-2">Departing now!</p>
        ) : (
          <div className="flex items-end justify-center gap-3">
            <CountdownUnit n={d} label="Days" />
            <span className="text-2xl font-black text-slate-200 pb-5">:</span>
            <CountdownUnit n={h} label="Hrs"  />
            <span className="text-2xl font-black text-slate-200 pb-5">:</span>
            <CountdownUnit n={m} label="Min"  />
          </div>
        )}
        <p className="text-center text-[10px] text-slate-400 mt-3 font-medium">until departure</p>
      </div>

      {/* Details */}
      <div className="px-5 py-4 space-y-2">
        <Detail label="Departure" value={`${fmtTime(outbound.departureTime)} · ${fmtDate(outbound.departureTime)}`} />
        <Detail label="Flight"    value={outbound.flightNumber}        mono   />
        <Detail label="Ref"       value={outbound.confirmationCode}    mono accent />
        {local?.passenger && (
          <Detail
            label="Passenger"
            value={`${local.passenger.firstName} ${local.passenger.lastName}`}
          />
        )}
      </div>
    </div>
  )
}

function Detail({ label, value, mono, accent }: {
  label: string; value: string; mono?: boolean; accent?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className={`font-bold truncate ${mono ? 'font-mono' : ''} ${accent ? 'text-blue-600' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  )
}
