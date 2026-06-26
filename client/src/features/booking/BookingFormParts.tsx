import { Plane, Check } from 'lucide-react'
import type { FlightDto } from '../search/types'
import { useLocale } from '../../context/LocaleContext'
import { durMin, fmtTime, fmtShortDate, fmtDur } from './bookingForm'

export function ProgressDot({ n, label, state }: { n: number; label: string; state: 'done' | 'active' | 'upcoming' }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        state === 'done'   ? 'bg-emerald-500 text-white' :
        state === 'active' ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900' :
                             'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
      }`}>
        {state === 'done' ? <Check className="w-4 h-4" /> : n}
      </div>
      <span className={`text-[11px] font-semibold whitespace-nowrap ${
        state === 'active' ? 'text-blue-600' : state === 'done' ? 'text-emerald-600' : 'text-slate-400'
      }`}>{label}</span>
    </div>
  )
}

export function FlightRow({ flight, dir }: { flight: FlightDto; dir: 'Outbound' | 'Return' }) {
  const { t } = useLocale()
  const bk = t.booking
  const dur = durMin(flight)
  const dirLabel = dir === 'Outbound' ? bk.outbound : bk.return
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
          dir === 'Outbound' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-violet-50 text-violet-500 border-violet-100'
        }`}>{dirLabel}</span>
        <span className="text-[12px] text-slate-400 font-medium">{fmtShortDate(flight.departureTime)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <div className="text-[20px] font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">
            {fmtTime(flight.departureTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">{flight.departureAirportCode}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <span className="text-[10px] text-slate-400">{fmtDur(dur)}</span>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            <Plane className="w-3 h-3 text-slate-400 rotate-90 shrink-0" />
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
          </div>
          <span className="text-[10px] text-slate-400">
            {flight.airlineName} · {flight.stops === 0 ? bk.direct : `${flight.stops} ${bk.stop}`}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[20px] font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">
            {fmtTime(flight.arrivalTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">{flight.arrivalAirportCode}</div>
        </div>
      </div>
    </div>
  )
}

export function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  )
}

export function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500'
      }`}
    >
      {children}
    </button>
  )
}

export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
      checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
    }`}>
      {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  )
}

export function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`font-semibold text-slate-800 dark:text-slate-200 mt-0.5 capitalize ${mono ? 'font-mono text-blue-600 text-base' : 'text-sm'}`}>
        {value}
      </div>
    </div>
  )
}
