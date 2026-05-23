import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import { airportsApi, flightsApi } from '../../services/api'
import type { Airport, FlightDto } from './types'

interface Props {
  label: string
  icon: React.ReactNode
  placeholder: string
  value: Airport | null
  onChange: (airport: Airport | null) => void
  fromAirport?: Airport | null
  onBrowseOpen?: () => void
  onBrowseClose?: () => void
}

function flightsToAirports(flights: FlightDto[]): Airport[] {
  const seen = new Set<string>()
  return flights.reduce<Airport[]>((acc, f) => {
    if (!seen.has(f.arrivalAirportCode)) {
      seen.add(f.arrivalAirportCode)
      acc.push({ icaoCode: f.arrivalAirportCode, iataCode: f.arrivalAirportCode, name: f.arrivalAirportName, city: f.arrivalCity, country: '' })
    }
    return acc
  }, [])
}

export default function AirportSelect({ label, icon, placeholder, value, onChange, fromAirport, onBrowseOpen, onBrowseClose }: Props) {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Airport[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)
  const timer        = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  useEffect(() => {
    const inBrowse = open && query.length < 2 && !fromAirport
    if (inBrowse) onBrowseOpen?.()
    else onBrowseClose?.()
  // onBrowseOpen/onBrowseClose are stable useCallback refs from parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, fromAirport])

  const searchAirports = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try { setResults(await airportsApi.search(q)) }
    catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  const loadDestinations = useCallback(async () => {
    if (!fromAirport) return
    setLoading(true)
    try {
      const code = fromAirport.iataCode ?? fromAirport.icaoCode
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
    clearTimeout(timer.current)
    timer.current = setTimeout(() => searchAirports(q), 300)
  }

  const handleSelect = (airport: Airport) => {
    onChange(airport)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const code = value ? (value.iataCode ?? value.icaoCode) : null

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 px-5 py-4 cursor-pointer" onClick={!open ? handleOpen : undefined}>
      <span className="text-gray-500 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{label}</div>
        {open
          ? <input ref={inputRef} value={query} onChange={handleInput} placeholder={placeholder}
              className="bg-transparent text-white text-base font-semibold outline-none w-full placeholder-gray-600 mt-0.5" />
          : <div className="text-base font-semibold mt-0.5 truncate">
              {value ? <span className="text-white">{value.city}</span> : <span className="text-gray-500">{placeholder}</span>}
            </div>
        }
        {value && !open && <div className="text-gray-500 text-xs">{code}</div>}
      </div>

      {open && (query.length >= 2 || !!fromAirport) && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-72 z-50 rounded-xl overflow-hidden shadow-2xl max-h-48 overflow-y-auto"
          style={{ background: 'rgba(10,22,46,0.98)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)' }}>
          {loading && (
            <div className="flex items-center gap-2 px-4 py-3 text-gray-500 text-sm">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">
              {fromAirport ? 'No available routes found' : 'No airports found'}
            </div>
          )}
          {results.map(airport => (
            <button key={airport.icaoCode} onClick={() => handleSelect(airport)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/[0.04] first:border-0">
              <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
              <div className="min-w-0">
                <div className="text-white text-sm font-semibold">{airport.city}</div>
                <div className="text-gray-400 text-xs truncate">{airport.name} · {airport.iataCode ?? airport.icaoCode}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
