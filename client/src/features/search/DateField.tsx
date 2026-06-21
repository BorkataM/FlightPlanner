import { useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toDateKey } from './searchUtils'

interface Props {
  icon:            React.ReactNode
  label:           string
  selected:        Date | null
  onChange:        (d: Date | null) => void
  placeholderText: string
  minDate?:        Date
  flightsByDate?:  Map<string, number>
  rangeStart?:     Date | null
}

function getRangeDayClass(date: Date, rangeStart: Date | null, hoverDate: Date | null): string {
  if (!rangeStart || !hoverDate) return ''
  const dk = toDateKey(date)
  const sk = toDateKey(rangeStart)
  const hk = toDateKey(hoverDate)
  if (dk === sk)            return 'dp-range-start'
  if (dk > sk && dk <= hk) return 'dp-in-range'
  return ''
}

export default function DateField({ icon, label, selected, onChange, placeholderText, minDate, flightsByDate, rangeStart }: Props) {
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const hasData = !!flightsByDate && flightsByDate.size > 0
  const today = new Date(); today.setHours(0, 0, 0, 0)

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="text-gray-500 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{label}</div>
        <DatePicker
          selected={selected}
          onChange={onChange}
          dateFormat="d MMM, EEE"
          placeholderText={placeholderText}
          minDate={minDate ?? today}
          popperPlacement="bottom-start"
          className="bg-transparent text-slate-900 dark:text-slate-100 text-base font-semibold outline-none w-full cursor-pointer placeholder-gray-400 dark:placeholder-slate-500 mt-0.5"
          filterDate={hasData ? (d) => flightsByDate!.has(toDateKey(d)) : undefined}
          dayClassName={(date) => getRangeDayClass(date, rangeStart ?? null, hoverDate)}
          renderDayContents={(dayNum, date) => {
            const price = hasData && date ? flightsByDate!.get(toDateKey(date)) : undefined
            return (
              <div className="dp-day-cell" onMouseEnter={() => date && setHoverDate(date)}>
                <span>{dayNum}</span>
                {price !== undefined && <span className="dp-day-price">€{Math.round(price)}</span>}
              </div>
            )
          }}
          onCalendarClose={() => setHoverDate(null)}
        />
      </div>
    </div>
  )
}
