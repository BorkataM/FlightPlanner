import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, ChevronDown, ChevronUp, MapPin, User, Ticket } from 'lucide-react'
import type { Trip } from './tripUtils'
import type { BookingRecord } from '../../services/api'
import { fmtTime, fmtDate, tripDurationMin, fmtDuration } from './tripUtils'
import WeatherWidget from './WeatherWidget'
import AirportRouteMap from './AirportRouteMap'

interface Props {
  trip:     Trip
  upcoming: boolean
}

function FlightLeg({
  booking, dir, depCode, arrCode,
}: {
  booking:  BookingRecord
  dir:      'OUTBOUND' | 'RETURN'
  depCode?: string
  arrCode?: string
}) {
  const dur    = tripDurationMin(booking)
  const isOut  = dir === 'OUTBOUND'

  return (
    <div className={`rounded-2xl px-5 py-4 ${
      isOut
        ? 'bg-blue-50/50 border border-blue-100/70'
        : 'bg-violet-50/50 border border-violet-100/70'
    }`}>
      {/* Row 1: badge · date · flight number */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border ${
          isOut
            ? 'bg-blue-50 text-blue-500 border-blue-200'
            : 'bg-violet-50 text-violet-500 border-violet-200'
        }`}>{dir}</span>
        <span className="text-xs text-slate-500 font-medium">{fmtDate(booking.departureTime)}</span>
        <span className="ml-auto font-mono text-xs font-bold text-slate-500">{booking.flightNumber}</span>
      </div>

      {/* Row 2: departure — timeline — arrival */}
      <div className="flex items-center gap-4">
        {/* Departure */}
        <div className="shrink-0 min-w-[80px]">
          <div className="text-[32px] font-black text-slate-900 tabular-nums leading-none">
            {fmtTime(booking.departureTime)}
          </div>
          {depCode && (
            <div className="text-sm font-black text-blue-600 tracking-wider mt-1.5">{depCode}</div>
          )}
          <div className="text-[11px] text-slate-400 mt-1 leading-tight">{booking.departureAirport}</div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col items-center gap-2 px-2">
          <span className="text-xs font-semibold text-slate-400">{fmtDuration(dur)}</span>
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-0.5 bg-slate-300/70 rounded-full" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              isOut ? 'bg-blue-100' : 'bg-violet-100'
            }`}>
              <Plane className={`w-4 h-4 ${isOut ? 'text-blue-500 rotate-90' : 'text-violet-500 -rotate-90'}`} />
            </div>
            <div className="flex-1 h-0.5 bg-slate-300/70 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-400">Non-stop</span>
        </div>

        {/* Arrival */}
        <div className="shrink-0 min-w-[80px] text-right">
          <div className="text-[32px] font-black text-slate-900 tabular-nums leading-none">
            {fmtTime(booking.arrivalTime)}
          </div>
          {arrCode && (
            <div className="text-sm font-black text-blue-600 tracking-wider mt-1.5">{arrCode}</div>
          )}
          <div className="text-[11px] text-slate-400 mt-1 leading-tight">{booking.arrivalAirport}</div>
        </div>
      </div>
    </div>
  )
}

export default function TripCard({ trip, upcoming }: Props) {
  const navigate = useNavigate()
  const { outbound, ret, local } = trip
  const [mapOpen, setMapOpen] = useState(false)

  const fromCity   = local?.fromCity ?? outbound.departureAirport
  const toCity     = local?.toCity   ?? outbound.arrivalAirport
  const depCode    = local?.outbound?.departureAirportCode
  const arrCode    = local?.outbound?.arrivalAirportCode
  const retDepCode = local?.ret?.departureAirportCode
  const retArrCode = local?.ret?.arrivalAirportCode
  const airline    = local?.outbound?.airlineName

  const passengerName = local
    ? `${local.passenger.firstName} ${local.passenger.lastName}`
    : null

  const displayPrice = local?.grandTotal ?? (outbound.price + (ret?.price ?? 0))

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

      {/* ── Gradient header ────────────────────────────── */}
      <div className={`px-6 py-5 ${
        upcoming
          ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800'
          : 'bg-gradient-to-br from-slate-600 to-slate-700'
      }`}>
        {/* Top bar: badge + airline · boarding pass button · ref */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/25">
              {ret ? 'Round Trip' : 'One Way'}
            </span>
            {airline && (
              <span className="text-[10px] text-white/60 font-semibold">{airline}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/boarding-pass', {
                state: { bookingRef: outbound.confirmationCode, booking: outbound, local },
              })}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-blue-700 rounded-xl text-xs font-black hover:bg-blue-50 transition-colors shadow-sm"
            >
              <Ticket className="w-3.5 h-3.5" />
              Show boarding pass
            </button>
            <div className="text-right">
              <div className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Ref</div>
              <div className="text-sm font-black text-white tracking-widest font-mono">
                {outbound.confirmationCode}
              </div>
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-3xl font-black text-white leading-none">{fromCity}</div>
            {depCode && <div className="text-sm font-black text-white/60 tracking-widest mt-1.5">{depCode}</div>}
          </div>

          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-px bg-white/20" />
            <Plane className="w-5 h-5 text-white/50 rotate-90 shrink-0" />
            {ret && <div className="flex-1 h-px bg-white/20" />}
            {ret && <Plane className="w-5 h-5 text-white/50 -rotate-90 shrink-0" />}
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <div className="shrink-0 text-right">
            <div className="text-3xl font-black text-white leading-none">{toCity}</div>
            {arrCode && <div className="text-sm font-black text-white/60 tracking-widest mt-1.5">{arrCode}</div>}
          </div>
        </div>
      </div>

      {/* ── Flight legs ────────────────────────────────── */}
      <div className="px-5 py-5 space-y-3">
        <FlightLeg booking={outbound} dir="OUTBOUND" depCode={depCode} arrCode={arrCode} />
        {ret && (
          <FlightLeg booking={ret} dir="RETURN" depCode={retDepCode} arrCode={retArrCode} />
        )}
      </div>

      {/* Passenger */}
      {passengerName && (
        <div className="px-6 pb-4 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-slate-400" />
          </div>
          <span className="font-semibold">{passengerName}</span>
        </div>
      )}

      {/* ── Flight Conditions (upcoming only) ──────────── */}
      {upcoming && (
        <div className="mx-5 mb-5 bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Flight Conditions
          </p>
          <WeatherWidget flightId={outbound.flightId} />
        </div>
      )}

      {/* ── Get to airport ─────────────────────────────── */}
      <div className="border-t border-slate-100">
        <button
          onClick={() => setMapOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50/40 transition-colors group"
        >
          <span className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
              <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </span>
            Get to airport
          </span>
          {mapOpen
            ? <ChevronUp  className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />
          }
        </button>
        {mapOpen && (
          <div className="px-5 pb-5">
            <AirportRouteMap flightId={outbound.flightId} />
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100">
        <span className="text-xs text-slate-400">Price paid </span>
        <span className="text-base font-black text-slate-900">€{Math.round(displayPrice)}</span>
      </div>
    </div>
  )
}
