import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, ArrowLeftRight, Calendar, Search, ChevronDown, Users, Loader2, X, Hotel } from 'lucide-react'
import AirportSelect from './AirportSelect'
import DateField from './DateField'
import FlexDatesGrid from './FlexDatesGrid'
import AirportBrowser from './AirportBrowser'
import { useSearchBox } from './useSearchBox'
import { useLocale } from '../../context/LocaleContext'

function toDateStr(d: Date) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const ROUND_TRIP_GRID = 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'
const ONE_WAY_GRID    = 'grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_minmax(0,1fr)]'

function calcMinReturnDate(departure: Date | null): Date {
  if (!departure) return new Date()
  return new Date(departure.getFullYear(), departure.getMonth(), departure.getDate() + 1)
}

const Tab = ({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${active ? 'btn-tab-active text-white shadow-sm' : 'text-slate-500 hover:text-blue-700'}`}>
    {icon}{label}
  </button>
)

function PassengerPicker({ count, onChange }: { count: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium text-xs"
      >
        <Users className="w-3.5 h-3.5" />
        {count} {count === 1 ? 'Passenger' : 'Passengers'}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 p-4 w-40">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-center mb-3">Passengers</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => onChange(Math.max(1, count - 1))}
              disabled={count <= 1}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
            >−</button>
            <span className="w-6 text-center text-sm font-bold text-slate-800 dark:text-slate-100">{count}</span>
            <button
              onClick={() => onChange(Math.min(9, count + 1))}
              disabled={count >= 9}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
            >+</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchBox() {
  const { t: locale } = useLocale()
  const t             = locale.search
  const sb            = useSearchBox()
  const navigate      = useNavigate()
  const [passengers, setPassengers] = useState(1)
  const minReturnDate = calcMinReturnDate(sb.departure)
  const canSearch     = !!sb.fromAirport && !!sb.toAirport
  const hasSearch     = !!(sb.fromAirport || sb.toAirport || sb.departure || sb.returnDate)

  const handleClear = () => {
    sb.setFromAirport(null)
    sb.setToAirport(null)
    sb.setDeparture(null)
    sb.setReturnDate(null)
    sessionStorage.removeItem('skywave_last_search')
  }

  const handleSearch = () => {
    if (!canSearch) return
    const from = sb.fromAirport!.iataCode ?? sb.fromAirport!.icaoCode
    const to   = sb.toAirport!.iataCode   ?? sb.toAirport!.icaoCode
    const params = new URLSearchParams({ from, to, trip: sb.tripType, fromCity: sb.fromAirport!.city, toCity: sb.toAirport!.city, passengers: String(passengers) })
    if (sb.departure)                    params.set('departure',  toDateStr(sb.departure))
    if (sb.returnDate && sb.isRoundTrip) params.set('returnDate', toDateStr(sb.returnDate))
    navigate(`/search?${params}`)
  }

  return (
    <>
      <div className="search-glass rounded-2xl w-full max-w-[900px]">

        <div className="flex items-center justify-between px-4 pt-3 pb-3">
          <div className="flex items-center gap-1">
            <Tab icon={<Plane className="w-3.5 h-3.5" />} label={t.tabs.flights} active onClick={() => {}} />
            <Tab icon={<Hotel className="w-3.5 h-3.5" />} label={t.tabs.hotels} active={false} onClick={() => window.open('https://www.booking.bg', '_blank')} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={sb.handleTripTypeToggle} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium">
              {sb.isRoundTrip ? t.roundTrip : t.oneWay} <ChevronDown className="w-3 h-3" />
            </button>
            <PassengerPicker count={passengers} onChange={setPassengers} />
          </div>
        </div>

        <div className="relative flex items-stretch">
          <div className={`flex-1 grid ${sb.isRoundTrip ? ROUND_TRIP_GRID : ONE_WAY_GRID}`}>
            <AirportSelect
              label={t.fields.from.label}
              icon={<Plane className="w-4 h-4 rotate-45" />}
              placeholder={t.fields.from.value}
              value={sb.fromAirport}
              onChange={(a) => { sb.setFromAirport(a); sb.setToAirport(null) }}
              validCodes={sb.departureCodes}
              validCodesLoaded={sb.departureCodesLoaded}
              onBrowseOpen={sb.onFromBrowseOpen}
              onBrowseClose={sb.onFromBrowseClose}
              closeSignal={sb.fromCloseSignal}
            />

            <button onClick={sb.swapAirports} className="flex items-center justify-center px-3 text-gray-500 dark:text-slate-400 hover:text-white transition-colors">
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <AirportSelect
              label={t.fields.to.label}
              icon={<Plane className="w-4 h-4 rotate-45" />}
              placeholder={t.fields.to.value}
              value={sb.toAirport}
              onChange={sb.setToAirport}
              fromAirport={sb.fromAirport}
              validCodes={sb.fromAirport ? sb.destCodes : sb.departureCodes}
              validCodesLoaded={sb.fromAirport ? true : sb.departureCodesLoaded}
              onBrowseOpen={sb.onToBrowseOpen}
              onBrowseClose={sb.onToBrowseClose}
              closeSignal={sb.toCloseSignal}
            />

            <DateField
              icon={<Calendar className="w-4 h-4" />}
              label={t.fields.departure.label}
              selected={sb.departure}
              onChange={sb.setDeparture}
              placeholderText={t.fields.departure.value}
              flightsByDate={sb.flightsByDate}
            />

            {sb.isRoundTrip && (
              <DateField
                icon={<Calendar className="w-4 h-4" />}
                label={t.fields.return.label}
                selected={sb.returnDate}
                onChange={sb.setReturnDate}
                placeholderText={t.fields.return.value}
                minDate={minReturnDate}
                flightsByDate={sb.flightsByDate}
                rangeStart={sb.departure}
              />
            )}
          </div>

          <div className="flex items-center px-4">
            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className={`btn-search w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 ${canSearch ? 'hover:scale-105' : 'opacity-40 cursor-not-allowed'}`}
            >
              <Search className="w-5 h-5 text-white" />
            </button>
          </div>

          {sb.browseField && (
            <AirportBrowser
              browseField={sb.browseField}
              fromAirport={sb.fromAirport}
              browseCountry={sb.browseCountry}
              setBrowseCountry={sb.setBrowseCountry}
              browseLoading={sb.browseLoading}
              destLoading={sb.destLoading}
              departureCodesLoaded={sb.departureCodesLoaded}
              allAirports={sb.allAirports}
              destCodes={sb.destCodes}
              departureCodes={sb.departureCodes}
              popularEntries={sb.popularEntries}
              otherEntries={sb.otherEntries}
              airportsByCountry={sb.airportsByCountry}
              onSelectAirport={sb.handleBrowseSelect}
            />
          )}
        </div>

        <div className="flex items-center justify-end px-4 py-2.5 gap-4">
          {hasSearch && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" /> Clear search
            </button>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t.flexibleDates}</span>
          <button onClick={() => sb.setFlexDates(!sb.flexDates)}
            className={`relative w-9 h-5 rounded-full transition-colors ${sb.flexDates ? 'bg-blue-500' : 'bg-gray-600'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sb.flexDates ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {sb.fromAirport && !sb.toAirport && !sb.departure && (
        <div className="mt-4 w-full max-w-[900px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-100 opacity-90">
              {t.flightsFromAllDates.replace('{city}', sb.fromAirport.city)}
            </span>
            {sb.destLoading && <Loader2 className="w-4 h-4 text-blue-200 animate-spin" />}
          </div>
          {!sb.destLoading && sb.previewDestinations.length === 0 && (
            <p className="text-blue-200 text-sm opacity-70">{t.noFlights}</p>
          )}
          {sb.previewDestinations.length > 0 && (
            <div className="dest-scroll grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {sb.previewDestinations.map(d => {
                const airport = sb.destAirports.find(a => (a.iataCode ?? a.icaoCode) === d.code)
                return (
                  <button key={d.code}
                    onClick={() => airport && sb.setToAirport(airport)}
                    className="dest-preview-card text-left rounded-xl px-4 py-3 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="text-white font-semibold text-sm truncate">{d.city}</div>
                    <div className="text-blue-200 text-xs opacity-80 mt-0.5">{d.code}</div>
                    <div className="text-white font-bold text-base mt-1">{t.from} €{Math.round(d.minPrice)}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {sb.fromAirport && sb.toAirport && sb.flexDates && (
        <FlexDatesGrid
          flightsByDate={sb.flightsByDate}
          departure={sb.departure}
          returnDate={sb.returnDate}
          onSelectDeparture={(d) => { sb.setDeparture(d); sb.setReturnDate(null) }}
          onSelectReturn={sb.setReturnDate}
        />
      )}
    </>
  )
}
