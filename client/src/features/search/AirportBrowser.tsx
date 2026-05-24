import type { Dispatch, SetStateAction } from 'react'
import { Loader2 } from 'lucide-react'
import { toCountryName } from './searchUtils'
import type { Airport } from './types'

interface Props {
  browseField: 'from' | 'to'
  fromAirport: Airport | null
  browseCountry: string | null
  setBrowseCountry: Dispatch<SetStateAction<string | null>>
  browseLoading: boolean
  destLoading: boolean
  allAirports: Airport[]
  destCodes: Set<string>
  departureCodes: Set<string>
  popularEntries: [string, Airport[]][]
  otherEntries: [string, Airport[]][]
  airportsByCountry: [string, Airport[]][]
  onSelectAirport: (airport: Airport) => void
}

interface CountryButtonProps {
  country: string
  selected: boolean
  enabled: boolean
  onClick: () => void
}

function CountryButton({ country, selected, enabled, onClick }: CountryButtonProps) {
  return (
    <button
      onClick={enabled ? onClick : undefined}
      className={`block w-full text-left py-1 px-2 rounded text-sm mb-0.5 ${
        !enabled  ? 'text-slate-300 cursor-not-allowed'
        : selected ? 'bg-indigo-600 text-white font-semibold'
        :            'text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors'
      }`}
    >
      {toCountryName(country)}
    </button>
  )
}

export default function AirportBrowser({
  browseField, fromAirport, browseCountry, setBrowseCountry,
  browseLoading, destLoading, allAirports,
  destCodes, departureCodes,
  popularEntries, otherEntries, airportsByCountry,
  onSelectAirport,
}: Props) {
  const isToWithFrom = browseField === 'to' && !!fromAirport

  const isCountryEnabled = (airports: Airport[]) => {
    if (isToWithFrom) return airports.some(a => destCodes.has(a.iataCode ?? a.icaoCode))
    return departureCodes.size === 0 || airports.some(a => departureCodes.has(a.iataCode ?? a.icaoCode))
  }

  const isAirportEnabled = (a: Airport) => {
    const code = a.iataCode ?? a.icaoCode
    if (isToWithFrom) return destCodes.has(code)
    return departureCodes.size === 0 || departureCodes.has(code)
  }

  const toggle = (country: string) => setBrowseCountry(c => c === country ? null : country)

  return (
    <div
      onMouseDown={e => e.nativeEvent.stopImmediatePropagation()}
      className="browse-panel absolute top-full left-0 right-0 z-50 rounded-b-2xl flex overflow-hidden"
    >
      {(browseLoading || destLoading) ? (
        <div className="flex items-center gap-2 px-6 py-5 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading airports…
        </div>
      ) : (
        <>
          <div className="flex-1 p-5 overflow-y-auto max-h-56 border-r border-slate-100">
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
              {browseField === 'from' ? 'Origin country'
                : fromAirport ? `Flights from ${fromAirport.city}`
                : 'Destination country'}
            </div>

            {isToWithFrom ? (
              <div className="columns-4 gap-x-4">
                {airportsByCountry.map(([country, airports]) => (
                  <CountryButton key={country} country={country}
                    selected={browseCountry === country}
                    enabled={isCountryEnabled(airports)}
                    onClick={() => toggle(country)}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Popular</div>
                <div className="columns-4 gap-x-4 mb-3">
                  {popularEntries.map(([country, airports]) => (
                    <CountryButton key={country} country={country}
                      selected={browseCountry === country}
                      enabled={isCountryEnabled(airports)}
                      onClick={() => toggle(country)}
                    />
                  ))}
                </div>

                <div className="border-t border-slate-100 mb-3" />

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">All countries</div>
                <div className="columns-4 gap-x-4">
                  {otherEntries.map(([country, airports]) => (
                    <CountryButton key={country} country={country}
                      selected={browseCountry === country}
                      enabled={isCountryEnabled(airports)}
                      onClick={() => toggle(country)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="browse-airport-sidebar w-60 shrink-0 flex flex-col">
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <span className="text-sm font-bold text-slate-900">Pick an airport</span>
              {browseCountry && (
                <button onClick={() => setBrowseCountry(null)} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                  Clear
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1 max-h-44 px-2 pb-3">
              {browseCountry ? (
                allAirports
                  .filter(a => (a.country || 'Other') === browseCountry)
                  .map(a => {
                    const enabled = isAirportEnabled(a)
                    return (
                      <button key={a.icaoCode}
                        disabled={!enabled}
                        onClick={() => enabled ? onSelectAirport(a) : undefined}
                        className={`flex items-center justify-between w-full py-2 px-2 rounded-lg text-left group transition-colors ${
                          enabled ? 'hover:bg-indigo-50 cursor-pointer' : 'opacity-35 cursor-not-allowed'
                        }`}
                      >
                        <span className={`text-sm truncate ${enabled ? 'text-slate-800 group-hover:text-indigo-700' : 'text-slate-400'}`}>
                          {a.city}
                        </span>
                        <span className="text-slate-400 text-xs ml-2 shrink-0 font-mono">{a.iataCode ?? a.icaoCode}</span>
                      </button>
                    )
                  })
              ) : (
                <p className="text-slate-400 text-sm px-2 pt-1">Select a country to see airports</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
