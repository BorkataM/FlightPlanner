import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateKey, WEEK_DAYS } from './searchUtils'

interface Props {
  flightsByDate: Map<string, number>
  returnFlightsByDate: Map<string, number>
  isRoundTrip: boolean
  departure: Date | null
  returnDate: Date | null
  onSelectDeparture: (d: Date) => void
  onSelectReturn: (d: Date) => void
  onClear: () => void
}

function quartiles(map: Map<string, number>): [number, number] {
  const sorted = Array.from(map.values()).sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length / 3)]     ?? Infinity
  const q2 = sorted[Math.floor(sorted.length * 2 / 3)] ?? Infinity
  return [q1, q2]
}

interface CellFlags {
  isPast:     boolean
  isSelected: boolean
  showRange:  boolean
}

function getCellFlags(
  date:    Date,
  today:   Date,
  key:     string,
  depKey:  string | null,
  retKey:  string | null,
  hovered: string | null,
): CellFlags {
  const isPast       = date < today
  const isSelected   = key === depKey || key === retKey
  const inRange      = !!(depKey && retKey  && key > depKey && key < retKey)
  const isHoverRange = !!(depKey && !retKey && hovered && key > depKey && key <= hovered)
  return { isPast, isSelected, showRange: inRange || isHoverRange }
}

function priceStyle(price: number, q1: number, q2: number): React.CSSProperties {
  if (price <= q1) return { background: 'rgba(16,185,129,0.70)', color: '#fff' }
  if (price <= q2) return { background: 'rgba(217,119,6,0.80)', color: '#fff' }
  return { background: 'rgba(220,38,38,0.72)', color: '#fff' }
}

const SELECTED_STYLE: React.CSSProperties  = { background: 'linear-gradient(135deg,#7C3AED,#5B21B6)', color: '#fff' }
const IN_RANGE_STYLE: React.CSSProperties  = { background: 'rgba(124,58,237,0.55)', color: '#EDE9FE' }
const DISABLED_STYLE: React.CSSProperties  = { background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.12)' }

export default function FlexDatesGrid({ flightsByDate, returnFlightsByDate, isRoundTrip, departure, returnDate, onSelectDeparture, onSelectReturn, onClear }: Props) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [view, setView]     = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }))
  const [hovered, setHovered] = useState<string | null>(null)

  // After a departure is picked on a round trip, dates after it are priced from the return leg (to -> from)
  const returnPhase = isRoundTrip && !!departure
  const [outQ1, outQ2] = useMemo(() => quartiles(flightsByDate),       [flightsByDate])
  const [retQ1, retQ2] = useMemo(() => quartiles(returnFlightsByDate), [returnFlightsByDate])

  const months = [
    view,
    view.month === 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: view.month + 1 },
  ]

  const depKeyGlobal = departure  ? toDateKey(departure)  : null
  const retKeyGlobal = returnDate ? toDateKey(returnDate) : null

  const handleClick = (date: Date, key: string) => {
    if (key === depKeyGlobal) return onClear()                 // click the departure again -> clear everything
    if (!isRoundTrip)         return onSelectDeparture(date)   // one-way: a click only ever sets the departure
    if (key === retKeyGlobal) return onSelectDeparture(date)   // click the return again -> it becomes the new departure
    if (!departure || date <= departure) return onSelectDeparture(date)
    return onSelectReturn(date)
  }

  const renderMonthContent = (year: number, month: number) => {
    const first  = new Date(year, month, 1)
    const last   = new Date(year, month + 1, 0)
    const offset = (first.getDay() + 6) % 7
    const depKey = departure  ? toDateKey(departure)  : null
    const retKey = returnDate ? toDateKey(returnDate) : null

    const cells: React.ReactNode[] = []
    for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`} />)

    for (let d = 1; d <= last.getDate(); d++) {
      const date  = new Date(year, month, d)
      const key   = toDateKey(date)
      // Price dates after the chosen departure from the return leg; everything else from the outbound leg
      const useReturn = returnPhase && !!depKey && key > depKey
      const price     = (useReturn ? returnFlightsByDate : flightsByDate).get(key)
      const [q1, q2]  = useReturn ? [retQ1, retQ2] : [outQ1, outQ2]
      const { isPast, isSelected, showRange } = getCellFlags(date, today, key, depKey, retKey, hovered)
      // Past days are treated exactly like days with no flights: faded and not selectable
      const unavailable = isPast || !price

      const cellStyle = isSelected ? SELECTED_STYLE
        : showRange               ? IN_RANGE_STYLE
        : unavailable             ? DISABLED_STYLE
        :                           priceStyle(price, q1, q2)

      cells.push(
        <button
          key={d}
          disabled={unavailable}
          onClick={() => handleClick(date, key)}
          onMouseEnter={() => setHovered(key)}
          onMouseLeave={() => setHovered(null)}
          className="rounded-lg text-center transition-all disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex flex-col items-center justify-center w-full h-12"
          style={cellStyle}
        >
          <div className={`text-sm font-bold leading-tight ${unavailable && !showRange && !isSelected ? 'line-through' : ''}`}>{d}</div>
          {!unavailable && <div className="text-[10px] font-bold leading-tight mt-0.5">€{Math.round(price!)}</div>}
        </button>
      )
    }

    return (
      <>
        <div className="text-sm font-bold text-white text-center mb-3">
          {new Date(year, month).toLocaleString('en', { month: 'long', year: 'numeric' })}
        </div>
        <div className="grid grid-cols-7 mb-1">
          {WEEK_DAYS.map(d => <div key={d} className="text-center text-[10px] text-blue-300 font-semibold py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">{cells}</div>
      </>
    )
  }

  const prev = () => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })
  const next = () => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })

  return (
    <div className="mt-4 w-full max-w-[900px]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-semibold text-blue-100">Flexible dates</span>
          <span className="ml-3 text-[10px] text-blue-300 gap-3 hidden sm:inline-flex">
            <span className="inline-flex items-center gap-1"><span className="legend-cheap" />Cheap</span>
            <span className="inline-flex items-center gap-1 ml-2"><span className="legend-medium" />Medium</span>
            <span className="inline-flex items-center gap-1 ml-2"><span className="legend-expensive" />Expensive</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="text-blue-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={next} className="text-blue-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {renderMonthContent(months[0].year, months[0].month)}
        </div>
        <div className="hidden lg:block flex-1 min-w-0">
          {renderMonthContent(months[1].year, months[1].month)}
        </div>
      </div>
    </div>
  )
}
