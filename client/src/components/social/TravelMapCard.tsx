import { useState } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { Globe, ExternalLink, Plus, Minus } from 'lucide-react'
import { COUNTRY_ISO_MAP } from '../../data/countryIsoMap'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface Props {
  visitedCountries: string[]
  loading?: boolean
}

export default function TravelMapCard({ visitedCountries, loading }: Props) {
  const [zoom, setZoom] = useState(1.8)
  const [center, setCenter] = useState<[number, number]>([10, 20])

  const visitedSet = new Set(
    visitedCountries.map(c => COUNTRY_ISO_MAP[c]).filter(Boolean)
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Travel Map</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Countries you've visited</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">
            {visitedCountries.length} / 195 countries
          </span>
          <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="relative bg-slate-50 select-none flex-1 min-h-0 overflow-hidden">
        {/* Zoom controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.6, 10))}
            className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z / 1.6, 1.8))}
            className="w-7 h-7 bg-white border border-slate-200 rounded-md flex items-center justify-center hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>

        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 160, center: [10, 20] }}
            style={{ width: '100%', height: '100%' }}
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ coordinates, zoom: z }) => {
                setCenter(coordinates)
                setZoom(z)
              }}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  geographies.map((geo: any) => {
                    const isVisited = visitedSet.has(String(geo.id))
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={isVisited ? '#3b82f6' : '#e2e8f0'}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default:  { outline: 'none' },
                          hover:    { fill: isVisited ? '#2563eb' : '#cbd5e1', outline: 'none' },
                          pressed:  { outline: 'none' },
                        }}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            Visited Countries
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 shrink-0" />
            Not Visited
          </span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
          View All Countries <span className="text-sm">›</span>
        </button>
      </div>
    </div>
  )
}
