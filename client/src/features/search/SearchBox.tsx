import { Plane, ArrowLeftRight, Calendar, Search, ChevronDown, Users, Loader2 } from 'lucide-react'
import AirportSelect from './AirportSelect'
import DateField from './DateField'
import FlexDatesGrid from './FlexDatesGrid'
import AirportBrowser from './AirportBrowser'
import { useSearchBox } from './useSearchBox'
import { useLocale } from '../../context/LocaleContext'

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

const FilterChip = ({ label }: { label: string }) => (
  <button className="text-slate-500 hover:text-slate-900 text-xs font-medium transition-colors whitespace-nowrap">{label}</button>
)

export default function SearchBox() {
  const { t: locale } = useLocale()
  const t             = locale.search
  const sb            = useSearchBox()
  const minReturnDate = calcMinReturnDate(sb.departure)

  return (
    <>
      <div className="search-glass rounded-2xl w-full max-w-[900px]">

        <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1">
            <Tab icon={<Plane className="w-3.5 h-3.5" />} label={t.tabs.flights} active onClick={() => {}} />
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <button onClick={sb.handleTripTypeToggle} className="flex items-center gap-1 hover:text-slate-900 transition-colors font-medium">
              {sb.isRoundTrip ? 'Round trip' : 'One way'} <ChevronDown className="w-3 h-3" />
            </button>
            <button className="flex items-center gap-1.5 hover:text-slate-900 transition-colors font-medium">
              <Users className="w-3.5 h-3.5" /> {t.passengers} <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="relative flex items-stretch border-b border-slate-100">
          <div className={`flex-1 grid divide-x divide-slate-100 ${sb.isRoundTrip ? ROUND_TRIP_GRID : ONE_WAY_GRID}`}>
            <AirportSelect
              label={t.fields.from.label}
              icon={<Plane className="w-4 h-4 rotate-45" />}
              placeholder={t.fields.from.value}
              value={sb.fromAirport}
              onChange={(a) => { sb.setFromAirport(a); sb.setToAirport(null) }}
              onBrowseOpen={sb.onFromBrowseOpen}
              onBrowseClose={sb.onFromBrowseClose}
              closeSignal={sb.fromCloseSignal}
            />

            <button onClick={sb.swapAirports} className="flex items-center justify-center px-3 text-gray-500 hover:text-white transition-colors">
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <AirportSelect
              label={t.fields.to.label}
              icon={<Plane className="w-4 h-4 rotate-45" />}
              placeholder={t.fields.to.value}
              value={sb.toAirport}
              onChange={sb.setToAirport}
              fromAirport={sb.fromAirport}
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
            <button className="btn-search w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
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

        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-5">
            {t.filters.map(f => <FilterChip key={f} label={f} />)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{t.flexibleDates}</span>
            <button onClick={() => sb.setFlexDates(!sb.flexDates)}
              className={`relative w-9 h-5 rounded-full transition-colors ${sb.flexDates ? 'bg-blue-500' : 'bg-gray-600'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${sb.flexDates ? 'left-4' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {sb.fromAirport && !sb.toAirport && !sb.departure && (
        <div className="mt-4 w-full max-w-[900px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-blue-100 opacity-90">
              Flights from {sb.fromAirport.city} — all dates
            </span>
            {sb.destLoading && <Loader2 className="w-4 h-4 text-blue-200 animate-spin" />}
          </div>
          {!sb.destLoading && sb.previewDestinations.length === 0 && (
            <p className="text-blue-200 text-sm opacity-70">No flights found from this airport.</p>
          )}
          {sb.previewDestinations.length > 0 && (
            <div className="grid grid-cols-4 gap-2.5">
              {sb.previewDestinations.slice(0, 16).map(d => {
                const airport = sb.destAirports.find(a => (a.iataCode ?? a.icaoCode) === d.code)
                return (
                  <button key={d.code}
                    onClick={() => airport && sb.setToAirport(airport)}
                    className="dest-preview-card text-left rounded-xl px-4 py-3 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <div className="text-white font-semibold text-sm truncate">{d.city}</div>
                    <div className="text-blue-200 text-xs opacity-80 mt-0.5">{d.code}</div>
                    <div className="text-white font-bold text-base mt-1">from €{Math.round(d.minPrice)}</div>
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
