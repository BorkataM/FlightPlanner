import { useNavigate } from 'react-router-dom'
import { Plane } from 'lucide-react'
import type { FlightDto } from '../search/types'
import AirlineLogo from '../search/AirlineLogo'
import { getStoredToken } from '../../services/api'

const fmt = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function ChatFlightCard({ flight }: { flight: FlightDto }) {
  const navigate = useNavigate()

  const handleBook = () => {
    const tok = getStoredToken()
    navigate('/booking', {
      state: {
        outbound:    flight,
        ret:         null,
        totalPrice:  flight.price,
        isRoundTrip: false,
        fromCity:    flight.departureCity ?? '',
        toCity:      flight.arrivalCity   ?? '',
        token:       tok,
      },
    })
  }

  const score = flight.analytics?.smartScore
  const scoreColor =
    score == null ? 'text-slate-400'
    : score >= 8  ? 'text-emerald-600'
    : score >= 6  ? 'text-amber-600'
    :               'text-rose-600'

  return (
    <div className="mt-2 bg-white border border-slate-100 rounded-xl p-3 shadow-sm text-[13px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <AirlineLogo flightNumber={flight.flightNumber} airlineName={flight.airlineName} size={22} />
          <span className="font-semibold text-slate-700">{flight.airlineName}</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">{flight.flightNumber}</span>
      </div>

      <div className="flex items-center gap-2 text-slate-800">
        <div className="text-center shrink-0">
          <div className="text-base font-black tabular-nums">{fmt(flight.departureTime)}</div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider">
            {flight.departureAirportCode}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5">
          <Plane className="w-3.5 h-3.5 text-blue-500 rotate-90" />
          <div className="w-full h-px bg-slate-200" />
          {flight.stops === 0 && (
            <span className="text-[10px] text-slate-400">Direct</span>
          )}
        </div>
        <div className="text-center shrink-0">
          <div className="text-base font-black tabular-nums">{fmt(flight.arrivalTime)}</div>
          <div className="text-[10px] font-bold text-slate-400 tracking-wider">
            {flight.arrivalAirportCode}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-slate-900">€{flight.price}</span>
          {score != null && (
            <span className={`text-[11px] font-bold ${scoreColor}`}>
              ★ {score.toFixed(1)}
            </span>
          )}
          {flight.analytics?.isEcoFriendly && (
            <span className="text-[10px] bg-teal-50 text-teal-600 border border-teal-200 px-1.5 py-0.5 rounded-full font-semibold">
              Eco
            </span>
          )}
        </div>
        <button
          onClick={handleBook}
          className="text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Book
        </button>
      </div>
    </div>
  )
}
