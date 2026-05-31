import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { airportsApi, flightsApi } from '../../services/api'
import { flightsToAirports, normalizeAirportQuery } from './searchUtils'
import type { Airport } from './types'

interface Props {
  label:              string
  icon:               React.ReactNode
  placeholder:        string
  value:              Airport | null
  onChange:           (airport: Airport | null) => void
  fromAirport?:       Airport | null
  validCodes?:        Set<string>
  validCodesLoaded?:  boolean
  onBrowseOpen?:      () => void
  onBrowseClose?:     () => void
  closeSignal?:       number
}

export default function AirportSelect({
  label, icon, placeholder, value, onChange,
  fromAirport, validCodes, validCodesLoaded, onBrowseOpen, onBrowseClose, closeSignal,
}: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<Airport[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)

  const containerRef        = useRef<HTMLDivElement>(null)
  const inputRef            = useRef<HTMLInputElement>(null)
  const debounce            = useRef<ReturnType<typeof setTimeout>>()
  const validCodesRef       = useRef(validCodes)
  const validCodesLoadedRef = useRef(validCodesLoaded)
  useEffect(() => { validCodesRef.current       = validCodes       }, [validCodes])
  useEffect(() => { validCodesLoadedRef.current = validCodesLoaded }, [validCodesLoaded])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    const showBrowse = open && query.length < 2
    showBrowse ? onBrowseOpen?.() : onBrowseClose?.()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query])

  useEffect(() => {
    if (!closeSignal) return
    setOpen(false)
    setQuery('')
    setResults([])
  }, [closeSignal])

  const searchAirports = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const all    = await airportsApi.search(normalizeAirportQuery(q))
      const codes  = validCodesRef.current
      const loaded = validCodesLoadedRef.current
      if (loaded === false) { setResults([]); return }
      setResults(codes && codes.size > 0 ? all.filter(a => codes.has(a.iataCode ?? a.icaoCode)) : all)
    }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const loadDestinations = useCallback(async () => {
    if (!fromAirport) return
    setLoading(true)
    try {
      const code    = fromAirport.iataCode ?? fromAirport.icaoCode
      const flights = await flightsApi.search({ from: code, limit: 50 })
      setResults(flightsToAirports(flights))
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [fromAirport])

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 10)
    if (fromAirport) loadDestinations()
  }

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => searchAirports(q), 300)
  }

  const handleSelect = (airport: Airport) => {
    onChange(airport)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const displayCode = value?.iataCode ?? value?.icaoCode ?? null

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-3 px-5 py-4 cursor-pointer"
      onClick={!open ? handleOpen : undefined}
    >
      <span className="text-slate-400 shrink-0">{icon}</span>

      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">{label}</div>

        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            placeholder={placeholder}
            className="bg-transparent text-slate-900 text-base font-semibold outline-none w-full placeholder-slate-400 mt-0.5"
          />
        ) : (
          <div className="text-base font-semibold mt-0.5 truncate">
            {value
              ? <span className="text-slate-900">{value.city}</span>
              : <span className="text-slate-400">{placeholder}</span>
            }
          </div>
        )}

        {value && !open && (
          <div className="text-slate-400 text-xs">{displayCode}</div>
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="airport-dropdown absolute top-[calc(100%+4px)] left-0 w-72 z-50 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-slate-400 text-sm">
              {fromAirport ? 'No available routes found' : 'No airports found'}
            </div>
          )}

          {results.map(airport => (
            <button
              key={airport.icaoCode}
              onClick={() => handleSelect(airport)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left border-t border-slate-100 first:border-0"
            >
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-slate-900 text-sm font-semibold">{airport.city}</div>
                <div className="text-slate-400 text-xs truncate">
                  {airport.name} · {airport.iataCode ?? airport.icaoCode}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
