import { Plane } from 'lucide-react'
import type { FlightDto } from './types'
import { useLocale } from '../../context/LocaleContext'
import AirlineLogo from './AirlineLogo'
import { type Combo, durationMin, fmtTime, fmtDur, fmtLegDate, BADGE_CLASS } from './resultsUtils'

function FlightLeg({ flight, direction }: { flight: FlightDto; direction?: 'Outbound' | 'Return' }) {
  const { t } = useLocale()
  const sr = t.searchResults
  const dur = durationMin(flight)
  const dirLabel = direction === 'Outbound' ? sr.outbound : sr.return
  return (
    <div className="py-4 px-6">
      {/* date + label row */}
      <div className="flex items-center gap-2.5 mb-3">
        <span className="text-[12px] font-semibold text-slate-400 tracking-wide">
          {fmtLegDate(flight.departureTime)}
        </span>
        {direction && (
          <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
            direction === 'Outbound'
              ? 'bg-blue-50 dark:bg-blue-950 text-blue-500 border-blue-100 dark:border-blue-900'
              : 'bg-violet-50 dark:bg-violet-950 text-violet-500 border-violet-100 dark:border-violet-900'
          }`}>
            {dirLabel}
          </span>
        )}
      </div>

      {/* timeline */}
      <div className="flex items-center gap-4">
        {/* departure */}
        <div className="shrink-0 w-16">
          <div className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">
            {fmtTime(flight.departureTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mt-1">
            {flight.departureAirportCode}
          </div>
        </div>

        {/* duration bar */}
        <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[11px] text-slate-400 font-medium">{fmtDur(dur)}</span>
          <div className="w-full flex items-center gap-1.5">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 shadow-sm">
              <Plane className="w-3 h-3 text-slate-400 rotate-90" />
            </div>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
          </div>
          <span className="text-[11px] text-slate-400">
            {flight.stops === 0 ? sr.direct : `${flight.stops} ${flight.stops > 1 ? sr.stops : sr.stop}`}
          </span>
        </div>

        {/* arrival */}
        <div className="shrink-0 w-16 text-right">
          <div className="text-[22px] font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">
            {fmtTime(flight.arrivalTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-400 tracking-wider mt-1">
            {flight.arrivalAirportCode}
          </div>
        </div>

        {/* airline */}
        <div className="shrink-0 ml-3 hidden sm:flex items-center gap-2 w-36 justify-end">
          <AirlineLogo flightNumber={flight.flightNumber} airlineName={flight.airlineName} size={30} />
          <div className="text-right min-w-0">
            <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">{flight.airlineName}</div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">{flight.flightNumber}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FlightCard({ combo, isRoundTrip, onSelect }: { combo: Combo; isRoundTrip: boolean; onSelect: () => void }) {
  const { t } = useLocale()
  const sr = t.searchResults
  const priceLabel = isRoundTrip && combo.ret ? sr.totalBothLegs
                   : isRoundTrip             ? sr.outboundOnly
                   :                           sr.perPerson

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 overflow-hidden flex">
      {/* left: flight details */}
      <div className="flex-1 min-w-0">
        {combo.badges.length > 0 && (
          <div className="flex gap-1.5 px-6 pt-4">
            {combo.badges.map(b => (
              <span key={b} className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${BADGE_CLASS[b]}`}>
                {b}
              </span>
            ))}
          </div>
        )}

        <FlightLeg flight={combo.outbound} direction={isRoundTrip ? 'Outbound' : undefined} />

        {isRoundTrip && combo.ret && (
          <>
            <div className="mx-6 border-t border-dashed border-slate-100 dark:border-slate-700" />
            <FlightLeg flight={combo.ret} direction="Return" />
          </>
        )}
      </div>

      {/* right: price panel */}
      <div className="w-28 sm:w-36 lg:w-44 shrink-0 flex flex-col items-center justify-center gap-3 lg:gap-4 py-5 lg:py-6 px-2 sm:px-3 lg:px-5 border-l border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50/80 to-white dark:from-slate-700/50 dark:to-slate-800">
        <div className="text-center">
          <div className="text-[20px] sm:text-[24px] lg:text-[32px] font-black text-slate-900 dark:text-slate-100 leading-none tabular-nums">
            €{Math.round(combo.totalPrice)}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-400 mt-1.5 font-medium">{priceLabel}</div>
        </div>
        <button onClick={onSelect} className="w-full py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
          {sr.select}
        </button>
      </div>
    </div>
  )
}
