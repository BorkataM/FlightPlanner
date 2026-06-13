import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Plane, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react'
import { flightsApi } from '../services/api'
import type { FlightDto } from '../features/search/types'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/auth/AuthModal'
import { useLocale } from '../context/LocaleContext'

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

/* ── helpers ─────────────────────────────────────────────────── */
const toDateKey = (s: string) => s.slice(0, 10)

function durationMin(f: FlightDto) {
  if (!f.departureTime || !f.arrivalTime) return Infinity
  return (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000
}

const fmtTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const fmtDur = (min: number) =>
  isFinite(min) ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '—'

const fmtTabDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

const fmtLegDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

/* ── badge styles ────────────────────────────────────────────── */
const BADGE_CLASS: Record<Badge, string> = {
  CHEAPEST: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  FASTEST:  'bg-sky-50     dark:bg-sky-950  text-sky-700     dark:text-sky-400  border border-sky-200     dark:border-sky-800',
  BEST:     'bg-violet-50  dark:bg-violet-950 text-violet-700  dark:text-violet-400 border border-violet-200  dark:border-violet-800',
  ECO:      'bg-teal-50    dark:bg-teal-950 text-teal-700    dark:text-teal-400 border border-teal-200    dark:border-teal-800',
}

/* ── FlightLeg ───────────────────────────────────────────────── */
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
        <div className="shrink-0 ml-3 text-right hidden sm:block w-28">
          <div className="text-[13px] font-semibold text-slate-600 dark:text-slate-300 truncate">{flight.airlineName}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">{flight.flightNumber}</div>
        </div>
      </div>
    </div>
  )
}

/* ── FlightCard ──────────────────────────────────────────────── */
function FlightCard({ combo, isRoundTrip, onSelect }: { combo: Combo; isRoundTrip: boolean; onSelect: () => void }) {
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

/* ── Page ────────────────────────────────────────────────────── */
export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user }  = useAuth()
  const { t } = useLocale()
  const sr = t.searchResults

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
  const [allDates, setAllDates] = useState(!depParam)
  const [selDep,   setSelDep]   = useState<string | null>(depParam ?? null)
  const [selRet,   setSelRet]   = useState<string | null>(retParam ?? null)
  const [sort,     setSort]     = useState<Sort>('cheapest')
  const [showAuth,     setShowAuth]     = useState(false)
  const [pendingCombo, setPendingCombo] = useState<Combo | null>(null)
  const tabsRef = useRef<HTMLDivElement>(null)

  /* fetch */
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

  /* price map */
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

  /* auto-select nearest date (skip when in allDates mode) */
  useEffect(() => {
    if (allDates || availDates.length === 0) return
    if (selDep && priceByDate.has(selDep)) return
    if (!selDep) { setSelDep(availDates[0]); return }
    const t = new Date(selDep).getTime()
    setSelDep(availDates.reduce((b, c) =>
      Math.abs(new Date(c).getTime() - t) < Math.abs(new Date(b).getTime() - t) ? c : b
    ))
  }, [availDates, selDep, priceByDate, allDates])

  /* visible tab window (7 tabs centred around current) */
  const dateTabs = useMemo(() => {
    if (!availDates.length) return []
    const idx   = selDep ? Math.max(0, availDates.findIndex(d => d >= selDep)) : 0
    const start = Math.max(0, idx - 3)
    return availDates.slice(start, start + 7)
  }, [availDates, selDep])

  /* filtered outbound */
  const outFiltered = useMemo(() =>
    !allDates && selDep
      ? outbound.filter(f => f.departureTime && toDateKey(f.departureTime) === selDep)
      : outbound
  , [outbound, allDates, selDep])

  /* return maps */
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
    if (!isRoundTrip || !retDates.length) return
    if (selRet && cheapestRetByDate.has(selRet)) return
    setSelRet(retDates[0])
  }, [retDates, selRet, cheapestRetByDate, isRoundTrip])

  /* cheapest return overall — fallback when selRet has no match */
  const cheapestRetOverall = useMemo(() =>
    isRoundTrip
      ? returns.reduce<FlightDto | null>((best, f) => !best || f.price < best.price ? f : best, null)
      : null
  , [returns, isRoundTrip])

  /* combos */
  const combos = useMemo<Combo[]>(() => {
    const bestRet = isRoundTrip
      ? (selRet ? (cheapestRetByDate.get(selRet) ?? cheapestRetOverall) : cheapestRetOverall)
      : null
    const useRet  = isRoundTrip

    const raw: Combo[] = outFiltered.map(f => ({
      outbound:      f,
      ret:           useRet && bestRet ? bestRet : null,
      totalPrice:    f.price + (useRet && bestRet ? Number(bestRet.price) : 0),
      totalDuration: durationMin(f) + (useRet && bestRet ? durationMin(bestRet) : 0),
      smartScore:    f.analytics?.smartScore ?? null,
      badges:        [] as Badge[],
    }))

    if (!raw.length) return []

    const minPrice = Math.min(...raw.map(c => c.totalPrice))
    const minDur   = Math.min(...raw.map(c => c.totalDuration))
    const maxScore = Math.max(...raw.map(c => c.smartScore ?? 0))
    let cd = false, fd = false, bd = false

    raw.forEach(c => {
      if (!cd && c.totalPrice    === minPrice) { c.badges.push('CHEAPEST'); cd = true }
      if (!fd && c.totalDuration === minDur)   { c.badges.push('FASTEST');  fd = true }
      if (!bd && maxScore > 0 && c.smartScore === maxScore) { c.badges.push('BEST'); bd = true }
      if (c.outbound.analytics?.isEcoFriendly && !c.badges.length) c.badges.push('ECO')
    })

    return [...raw].sort((a, b) =>
      sort === 'cheapest' ? a.totalPrice - b.totalPrice :
      sort === 'fastest'  ? a.totalDuration - b.totalDuration :
      (b.smartScore ?? 0) - (a.smartScore ?? 0)
    )
  }, [outFiltered, selRet, cheapestRetByDate, cheapestRetOverall, isRoundTrip, sort])

  const handleTabClick = (date: string) => {
    setAllDates(false)
    const oldIdx = dateTabs.indexOf(selDep ?? '')
    const newIdx = dateTabs.indexOf(date)
    const offset = newIdx - oldIdx
    setSelDep(date)
    if (isRoundTrip && selRet && offset !== 0) {
      const ri = retDates.indexOf(selRet)
      setSelRet(retDates[Math.max(0, Math.min(retDates.length - 1, ri + offset))] ?? selRet)
    }
  }

  const goToBooking = (combo: Combo, token: string) =>
    navigate('/booking', {
      state: { outbound: combo.outbound, ret: combo.ret, totalPrice: combo.totalPrice, isRoundTrip, fromCity, toCity, token },
    })

  const handleSelect = (combo: Combo) => {
    if (user) {
      goToBooking(combo, user.token)
    } else {
      setPendingCombo(combo)
      setShowAuth(true)
    }
  }

  const scrollTabs = (dir: -1 | 1) =>
    tabsRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' })

  const minPrice = priceByDate.size ? Math.min(...priceByDate.values()) : 0

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── sticky header ── */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 lg:py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => {
              try {
                sessionStorage.setItem('skywave_last_search', JSON.stringify({
                  fromAirport: { iataCode: from, icaoCode: from, city: fromCity, name: fromCity, country: '' },
                  toAirport:   { iataCode: to,   icaoCode: to,   city: toCity,   name: toCity,   country: '' },
                  tripType:    trip,
                  departure:   depParam,
                  returnDate:  retParam,
                }))
              } catch { /* ignore */ }
              navigate('/')
            }}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium shrink-0">
            <ChevronLeft className="w-4 h-4" /> {sr.modifySearch}
          </button>
          <div className="flex-1 text-center text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {fromCity} → {toCity}
            <span className="ml-2 text-sm font-normal text-slate-400 hidden sm:inline">
              · {isRoundTrip ? sr.roundTrip : sr.oneWay}
            </span>
          </div>
          <div className="hidden sm:block w-32 shrink-0" />
        </div>
      </div>

      {/* ── outbound date tabs ── */}
      {availDates.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="max-w-5xl mx-auto flex items-center">
            <button onClick={() => scrollTabs(-1)}
              className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div ref={tabsRef} className="results-tab-scroll flex overflow-x-auto">
              {/* All dates tab */}
              <button onClick={() => { setAllDates(true); setSelDep(null) }}
                className={`flex flex-col items-center px-5 py-3.5 border-b-2 transition-all shrink-0 ${
                  allDates
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-bold whitespace-nowrap">{sr.allDates}</span>
                {minPrice > 0 && (
                  <span className="text-xs font-semibold mt-0.5 opacity-80">
                    {sr.fromPrice} €{Math.round(minPrice)}
                  </span>
                )}
              </button>

              {dateTabs.map(date => {
                const price  = priceByDate.get(date)
                const active = !allDates && date === selDep
                return (
                  <button key={date} onClick={() => handleTabClick(date)}
                    className={`flex flex-col items-center px-5 py-3.5 border-b-2 transition-all shrink-0 ${
                      active
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-semibold whitespace-nowrap">{fmtTabDate(date)}</span>
                    {price !== undefined && (
                      <span className={`text-sm font-bold mt-0.5 ${active ? '' : 'text-slate-700 dark:text-slate-300'}`}>
                        €{Math.round(price)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <button onClick={() => scrollTabs(1)}
              className="p-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── return date chips ── */}
      {isRoundTrip && retDates.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
          <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-2 overflow-x-auto results-tab-scroll">
            <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 shrink-0">
              {sr.returnLabel}
            </span>
            {retDates.slice(0, 10).map(date => (
              <button key={date} onClick={() => setSelRet(date)}
                className={`text-xs px-3.5 py-1.5 rounded-full border font-semibold transition-all shrink-0 whitespace-nowrap ${
                  date === selRet
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {fmtTabDate(date)} · €{Math.round(cheapestRetByDate.get(date)!.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── no return flights notice ── */}
      {isRoundTrip && !loading && returns.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-100 dark:border-amber-900">
          <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Info className="w-4 h-4 shrink-0" />
            {sr.noReturnFlights.replace('{route}', `${toCity} → ${fromCity}`)}
          </div>
        </div>
      )}

      {/* ── results ── */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-12">
        {/* sort + count */}
        <div className="flex items-center gap-2 mb-5">
          {(['cheapest', 'fastest', 'best'] as Sort[]).map(s => (
            <button key={s} onClick={() => setSort(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                sort === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {sr.sort[s]}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-400 font-medium">
            {!loading && `${combos.length} ${combos.length !== 1 ? sr.results : sr.result}`}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-36 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm font-medium">{sr.searching}</span>
          </div>
        ) : combos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-36 gap-2 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
              <Plane className="w-7 h-7 text-slate-300 dark:text-slate-500" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg">{sr.noFlightsFound}</p>
            <p className="text-slate-400 text-sm">{sr.tryDifferentDates}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {combos.map((combo, i) => (
              <FlightCard
                key={`${combo.outbound.id}_${i}`}
                combo={combo}
                isRoundTrip={isRoundTrip}
                onSelect={() => handleSelect(combo)}
              />
            ))}
          </div>
        )}
      </div>

      {showAuth && (
        <AuthModal
          onClose={() => { setShowAuth(false); setPendingCombo(null) }}
          onSuccess={(_type) => {
            setShowAuth(false)
            if (pendingCombo) {
              const stored = localStorage.getItem('skywave_user')
              const token  = stored ? (JSON.parse(stored) as { token: string }).token : ''
              goToBooking(pendingCombo, token)
            }
            setPendingCombo(null)
          }}
        />
      )}
    </div>
  )
}
