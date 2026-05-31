import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plane, ChevronLeft, Loader2 } from 'lucide-react'
import { flightsApi } from '../services/api'
import type { FlightDto } from '../features/search/types'

type Sort  = 'cheapest' | 'fastest' | 'best'
type Badge = 'CHEAPEST' | 'FASTEST' | 'BEST' | 'ECO'

interface Combo {
  outbound:      FlightDto
  ret:           FlightDto | null
  totalPrice:    number
  totalDuration: number
  smartScore:    number | null
  badges:        Badge[]
}

function toDateKey(s: string) { return s.slice(0, 10) }

function durationMin(f: FlightDto) {
  if (!f.departureTime || !f.arrivalTime) return Infinity
  return (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000
}

function fmtTime(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function fmtDur(min: number) {
  if (!isFinite(min)) return '—'
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`
}

function fmtTab(s: string) {
  const d = new Date(s + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

const BADGE_STYLE: Record<Badge, string> = {
  CHEAPEST: 'bg-green-100  text-green-700',
  FASTEST:  'bg-blue-100   text-blue-700',
  BEST:     'bg-purple-100 text-purple-700',
  ECO:      'bg-emerald-100 text-emerald-700',
}

function FlightLeg({ flight, label }: { flight: FlightDto; label?: string }) {
  const dur = durationMin(flight)
  return (
    <div className="flex items-center gap-4">
      {label && <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest w-16 shrink-0">{label}</span>}
      <div className="text-center w-14 shrink-0">
        <div className="text-lg font-bold text-slate-900 leading-none">{fmtTime(flight.departureTime)}</div>
        <div className="text-xs text-slate-400 mt-0.5">{flight.departureAirportCode}</div>
      </div>
      <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
        <div className="text-xs text-slate-400">{fmtDur(dur)}</div>
        <div className="w-full flex items-center gap-1">
          <div className="flex-1 h-px bg-slate-200" />
          <Plane className="w-3 h-3 text-slate-400 rotate-90 shrink-0" />
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <div className="text-xs text-slate-400">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}</div>
      </div>
      <div className="text-center w-14 shrink-0">
        <div className="text-lg font-bold text-slate-900 leading-none">{fmtTime(flight.arrivalTime)}</div>
        <div className="text-xs text-slate-400 mt-0.5">{flight.arrivalAirportCode}</div>
      </div>
      <div className="text-right shrink-0 min-w-0 hidden sm:block">
        <div className="text-sm text-slate-500 truncate">{flight.airlineName}</div>
        <div className="text-xs text-slate-400">{flight.flightNumber}</div>
      </div>
    </div>
  )
}

function FlightCard({ combo, isRoundTrip }: { combo: Combo; isRoundTrip: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
      {combo.badges.length > 0 && (
        <div className="flex gap-2 mb-3">
          {combo.badges.map(b => (
            <span key={b} className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${BADGE_STYLE[b]}`}>{b}</span>
          ))}
        </div>
      )}

      <FlightLeg flight={combo.outbound} label={isRoundTrip ? 'Outbound' : undefined} />

      {isRoundTrip && combo.ret && (
        <>
          <div className="border-t border-dashed border-slate-100 my-4" />
          <FlightLeg flight={combo.ret} label="Return" />
        </>
      )}

      <div className="flex items-end justify-between mt-4 pt-3 border-t border-slate-100">
        <div>
          <div className="text-2xl font-extrabold text-slate-900">€{Math.round(combo.totalPrice)}</div>
          <div className="text-xs text-slate-400">{isRoundTrip ? 'total · both legs' : 'per person'}</div>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors active:scale-95">
          Select
        </button>
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const from      = searchParams.get('from')      ?? ''
  const to        = searchParams.get('to')        ?? ''
  const trip      = searchParams.get('trip')      ?? 'roundTrip'
  const fromCity  = searchParams.get('fromCity')  ?? from
  const toCity    = searchParams.get('toCity')    ?? to
  const depParam  = searchParams.get('departure')
  const retParam  = searchParams.get('returnDate')
  const isRoundTrip = trip === 'roundTrip'

  const [outbound, setOutbound] = useState<FlightDto[]>([])
  const [returns,  setReturns]  = useState<FlightDto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selDep,   setSelDep]   = useState<string | null>(depParam ?? null)
  const [selRet,   setSelRet]   = useState<string | null>(retParam ?? null)
  const [sort,     setSort]     = useState<Sort>('cheapest')

  useEffect(() => {
    if (!from || !to) return
    setLoading(true)
    const retFetch = isRoundTrip
      ? flightsApi.search({ from: to, to: from, limit: 1000 })
      : Promise.resolve([] as FlightDto[])
    Promise.all([flightsApi.search({ from, to, limit: 1000 }), retFetch])
      .then(([out, ret]) => { setOutbound(out); setReturns(ret) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [from, to, isRoundTrip])

  const priceByDate = useMemo(() => {
    const map = new Map<string, number>()
    outbound.forEach(f => {
      if (!f.departureTime) return
      const k = toDateKey(f.departureTime)
      const c = map.get(k)
      if (c === undefined || f.price < c) map.set(k, f.price)
    })
    return map
  }, [outbound])

  const availDates = useMemo(() => Array.from(priceByDate.keys()).sort(), [priceByDate])

  useEffect(() => {
    if (availDates.length === 0) return
    if (selDep && priceByDate.has(selDep)) return
    if (!selDep) { setSelDep(availDates[0]); return }
    const selTime = new Date(selDep).getTime()
    const nearest = availDates.reduce((best, cur) =>
      Math.abs(new Date(cur).getTime() - selTime) < Math.abs(new Date(best).getTime() - selTime) ? cur : best
    )
    setSelDep(nearest)
  }, [availDates, selDep, priceByDate])

  const dateTabs = useMemo(() => {
    if (availDates.length === 0) return []
    const idx = selDep ? Math.max(0, availDates.findIndex(d => d >= selDep)) : 0
    const start = Math.max(0, idx - 3)
    return availDates.slice(start, start + 7)
  }, [availDates, selDep])

  const outFiltered = useMemo(() =>
    selDep ? outbound.filter(f => f.departureTime && toDateKey(f.departureTime) === selDep) : outbound
  , [outbound, selDep])

  const cheapestRetByDate = useMemo(() => {
    const map = new Map<string, FlightDto>()
    returns.forEach(f => {
      if (!f.departureTime) return
      const k = toDateKey(f.departureTime)
      const c = map.get(k)
      if (!c || f.price < c.price) map.set(k, f)
    })
    return map
  }, [returns])

  const retDates = useMemo(() => Array.from(cheapestRetByDate.keys()).sort(), [cheapestRetByDate])

  useEffect(() => {
    if (!isRoundTrip || retDates.length === 0) return
    if (selRet && cheapestRetByDate.has(selRet)) return
    setSelRet(retDates[0])
  }, [retDates, selRet, cheapestRetByDate, isRoundTrip])

  const combos = useMemo<Combo[]>(() => {
    const bestRet = selRet ? cheapestRetByDate.get(selRet) ?? null : null
    const raw: Combo[] = outFiltered.map(f => ({
      outbound:      f,
      ret:           isRoundTrip ? bestRet : null,
      totalPrice:    f.price + (bestRet?.price ?? 0),
      totalDuration: durationMin(f) + (bestRet ? durationMin(bestRet) : 0),
      smartScore:    f.analytics?.smartScore ?? null,
      badges:        [],
    }))

    if (raw.length === 0) return []

    const minPrice    = Math.min(...raw.map(c => c.totalPrice))
    const minDur      = Math.min(...raw.map(c => c.totalDuration))
    const maxScore    = Math.max(...raw.map(c => c.smartScore ?? 0))
    let cheapDone = false, fastDone = false, bestDone = false

    raw.forEach(c => {
      if (!cheapDone && c.totalPrice === minPrice)   { c.badges.push('CHEAPEST'); cheapDone = true }
      if (!fastDone  && c.totalDuration === minDur)  { c.badges.push('FASTEST');  fastDone  = true }
      if (!bestDone  && maxScore > 0 && c.smartScore === maxScore) { c.badges.push('BEST'); bestDone = true }
      if (c.outbound.analytics?.isEcoFriendly && c.badges.length === 0) c.badges.push('ECO')
    })

    return [...raw].sort((a, b) =>
      sort === 'cheapest' ? a.totalPrice - b.totalPrice :
      sort === 'fastest'  ? a.totalDuration - b.totalDuration :
      (b.smartScore ?? 0) - (a.smartScore ?? 0)
    )
  }, [outFiltered, isRoundTrip, cheapestRetByDate, selRet, sort])

  const handleTabClick = (date: string) => {
    const oldIdx = dateTabs.indexOf(selDep ?? '')
    const newIdx = dateTabs.indexOf(date)
    const offset = newIdx - oldIdx
    setSelDep(date)
    if (isRoundTrip && selRet && offset !== 0) {
      const retIdx    = retDates.indexOf(selRet)
      const newRetIdx = Math.max(0, Math.min(retDates.length - 1, retIdx + offset))
      setSelRet(retDates[newRetIdx] ?? selRet)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> Modify search
          </button>
          <div className="text-slate-900 font-semibold text-sm">
            {fromCity} → {toCity} · {isRoundTrip ? 'Round trip' : 'One way'}
          </div>
          <div className="w-32" />
        </div>
      </div>

      {dateTabs.length > 0 && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto flex overflow-x-auto">
            {dateTabs.map(date => {
              const price  = priceByDate.get(date)
              const active = date === selDep
              return (
                <button key={date} onClick={() => handleTabClick(date)}
                  className={`flex flex-col items-center px-5 py-3 border-b-2 transition-colors shrink-0 ${
                    active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span className="text-xs font-medium">{fmtTab(date)}</span>
                  {price !== undefined && (
                    <span className="text-sm font-bold mt-0.5">€{Math.round(price)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {isRoundTrip && retDates.length > 0 && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto flex items-center gap-2 px-4 py-2.5 overflow-x-auto">
            <span className="text-xs text-slate-400 font-medium shrink-0">Return:</span>
            {retDates.slice(0, 10).map(date => (
              <button key={date} onClick={() => setSelRet(date)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors shrink-0 ${
                  date === selRet
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                {fmtTab(date)} · €{Math.round(cheapestRetByDate.get(date)!.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 pt-5 pb-10">
        <div className="flex items-center gap-2 mb-4">
          {(['cheapest', 'fastest', 'best'] as Sort[]).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
                sort === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-400">
            {loading ? '' : `${combos.length} result${combos.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading flights…
          </div>
        ) : combos.length === 0 ? (
          <div className="text-center py-24 text-slate-400">No flights found for this route.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {combos.map((combo, i) => (
              <FlightCard key={`${combo.outbound.id}_${i}`} combo={combo} isRoundTrip={isRoundTrip} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
