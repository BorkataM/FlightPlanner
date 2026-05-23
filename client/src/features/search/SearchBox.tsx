import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Plane, BedDouble, Car, ArrowLeftRight, Calendar, Search, ChevronDown, Users, MapPin, Loader2 } from 'lucide-react'
import AirportSelect from './AirportSelect'
import { airportsApi } from '../../services/api'
import { en } from '../../localization/en'
import type { TabType, TripType } from '../../types'
import type { Airport } from './types'

const t = en.search

const Tab = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}>
    {icon}{label}
  </button>
)

const FilterChip = ({ label }: { label: string }) => (
  <button className="text-slate-500 hover:text-slate-900 text-xs font-medium transition-colors whitespace-nowrap">{label}</button>
)

const DateField = ({ icon, label, selected, onChange, placeholderText, minDate }: {
  icon: React.ReactNode; label: string; selected: Date | null
  onChange: (d: Date | null) => void; placeholderText: string; minDate?: Date
}) => (
  <div className="flex items-center gap-3 px-5 py-4">
    <span className="text-gray-500 shrink-0">{icon}</span>
    <div className="min-w-0 flex-1">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{label}</div>
      <DatePicker
        selected={selected}
        onChange={onChange}
        dateFormat="d MMM, EEE"
        placeholderText={placeholderText}
        minDate={minDate ?? new Date()}
        popperPlacement="bottom-start"
        className="bg-transparent text-white text-base font-semibold outline-none w-full cursor-pointer placeholder-gray-500 mt-0.5"
      />
    </div>
  </div>
)

export default function SearchBox() {
  const [activeTab, setActiveTab] = useState<TabType>('flights')
  const [tripType, setTripType]   = useState<TripType>('oneWay')
  const [flexDates, setFlexDates] = useState(true)
  const [fromAirport, setFromAirport] = useState<Airport | null>(null)
  const [toAirport, setToAirport]     = useState<Airport | null>(null)
  const [departure, setDeparture]     = useState<Date | null>(null)
  const [returnDate, setReturnDate]   = useState<Date | null>(null)

  const [browseField, setBrowseField]   = useState<'from' | 'to' | null>(null)
  const [allAirports, setAllAirports]   = useState<Airport[]>([])
  const [browseLoading, setBrowseLoading] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!browseField || hasFetched.current) return
    hasFetched.current = true
    setBrowseLoading(true)
    airportsApi.getAll()
      .then(setAllAirports)
      .catch(() => setAllAirports([]))
      .finally(() => setBrowseLoading(false))
  }, [browseField])

  const airportsByCountry = useMemo(() => {
    const map = new Map<string, Airport[]>()
    allAirports.forEach(a => {
      const key = a.country || 'Other'
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    })
    return Array.from(map.entries())
  }, [allAirports])

  const onFromBrowseOpen  = useCallback(() => setBrowseField('from'), [])
  const onFromBrowseClose = useCallback(() => setBrowseField(f => f === 'from' ? null : f), [])
  const onToBrowseOpen    = useCallback(() => setBrowseField('to'), [])
  const onToBrowseClose   = useCallback(() => setBrowseField(f => f === 'to' ? null : f), [])

  const handleBrowseSelect = useCallback((airport: Airport) => {
    if (browseField === 'from') { setFromAirport(airport); setToAirport(null) }
    else setToAirport(airport)
    setBrowseField(null)
  }, [browseField])

  const isRoundTrip = tripType === 'roundTrip'

  const swapAirports = () => {
    setFromAirport(toAirport)
    setToAirport(fromAirport)
  }

  const handleTripTypeToggle = () => {
    setTripType(prev => prev === 'oneWay' ? 'roundTrip' : 'oneWay')
    if (isRoundTrip) setReturnDate(null)
  }

  return (
    <div className="search-glass rounded-2xl w-full max-w-[900px] shadow-2xl">
      {/* Tab row */}
      <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-1">
          <Tab icon={<Plane className="w-3.5 h-3.5" />}    label={t.tabs.flights} active={activeTab === 'flights'} onClick={() => setActiveTab('flights')} />
          <Tab icon={<BedDouble className="w-3.5 h-3.5" />} label={t.tabs.hotels}  active={activeTab === 'hotels'}  onClick={() => setActiveTab('hotels')} />
          <Tab icon={<Car className="w-3.5 h-3.5" />}       label={t.tabs.cars}    active={activeTab === 'cars'}    onClick={() => setActiveTab('cars')} />
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <button onClick={handleTripTypeToggle}
            className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium">
            {isRoundTrip ? 'Round trip' : 'One way'} <ChevronDown className="w-3 h-3" />
          </button>
          <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-medium">
            <Users className="w-3.5 h-3.5" /> {t.passengers} <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Input row */}
      <div className="relative flex items-stretch border-b border-slate-100">
        <div className={`flex-1 grid divide-x divide-slate-100 ${isRoundTrip ? 'grid-cols-[1fr_auto_1fr_1fr_1fr]' : 'grid-cols-[1fr_auto_1fr_1fr]'}`}>

          <AirportSelect
            label={t.fields.from.label}
            icon={<Plane className="w-4 h-4 rotate-45" />}
            placeholder={t.fields.from.value}
            value={fromAirport}
            onChange={(a) => { setFromAirport(a); setToAirport(null) }}
            onBrowseOpen={onFromBrowseOpen}
            onBrowseClose={onFromBrowseClose}
          />

          <button onClick={swapAirports}
            className="flex items-center justify-center px-3 text-gray-500 hover:text-white transition-colors">
            <ArrowLeftRight className="w-4 h-4" />
          </button>

          <AirportSelect
            label={t.fields.to.label}
            icon={<Plane className="w-4 h-4 rotate-45" />}
            placeholder={t.fields.to.value}
            value={toAirport}
            onChange={setToAirport}
            fromAirport={fromAirport}
            onBrowseOpen={onToBrowseOpen}
            onBrowseClose={onToBrowseClose}
          />

          <DateField
            icon={<Calendar className="w-4 h-4" />}
            label={t.fields.departure.label}
            selected={departure}
            onChange={setDeparture}
            placeholderText={t.fields.departure.value}
          />

          {isRoundTrip && (
            <DateField
              icon={<Calendar className="w-4 h-4" />}
              label={t.fields.return.label}
              selected={returnDate}
              onChange={setReturnDate}
              placeholderText={t.fields.return.value}
              minDate={departure ?? new Date()}
            />
          )}
        </div>

        {/* Search button */}
        <div className="flex items-center px-4">
          <button
            className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #5B21B6 100%)', boxShadow: '0 4px 24px rgba(124,58,237,0.5)' }}>
            <Search className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Wide airport browser panel */}
        {browseField && (
          <div
            onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}
            className="absolute top-full left-0 right-0 z-50 rounded-b-2xl shadow-2xl overflow-hidden"
            style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderTop: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
          >
            {browseLoading ? (
              <div className="flex items-center gap-2 px-6 py-5 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading airports…
              </div>
            ) : (
              <div className="p-5 max-h-72 overflow-y-auto columns-3 gap-6">
                {airportsByCountry.map(([country, airports]) => (
                  <div key={country} className="break-inside-avoid mb-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1.5">{country}</div>
                    {airports.map(a => (
                      <button
                        key={a.icaoCode}
                        onClick={() => handleBrowseSelect(a)}
                        className="flex items-center justify-between w-full py-1 px-1 rounded hover:bg-slate-50 transition-colors text-left group"
                      >
                        <span className="flex items-center gap-1.5 text-sm text-slate-800 group-hover:text-slate-600">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {a.city}
                        </span>
                        <span className="text-slate-400 text-xs ml-2 shrink-0">{a.iataCode ?? a.icaoCode}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter row */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-5">
          {t.filters.map(f => <FilterChip key={f} label={f} />)}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">{t.flexibleDates}</span>
          <button onClick={() => setFlexDates(!flexDates)}
            className={`relative w-9 h-5 rounded-full transition-colors ${flexDates ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${flexDates ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      </div>
    </div>
  )
}
