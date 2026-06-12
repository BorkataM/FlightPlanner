import { useState, useRef } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { Globe, Plus, Minus } from 'lucide-react'
import { ALPHA2_TO_NUMERIC } from '../../data/countryIsoMap'
import { useTheme } from '../../context/ThemeContext'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface Props {
  visitedCountries: string[]
  loading?: boolean
  compact?: boolean
}

export default function TravelMapCard({ visitedCountries, loading, compact }: Props) {
  const [zoom, setZoom] = useState(1.8)
  const [center, setCenter] = useState<[number, number]>([10, 20])
  const [tooltip, setTooltip] = useState<{ name: string; x: number; y: number } | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const visitedSet = new Set(
    visitedCountries.map(c => ALPHA2_TO_NUMERIC[c]).filter(Boolean)
  )

  const fillUnvisited = dark ? '#1e3a5f' : '#e2e8f0'
  const fillVisited   = dark ? '#22c55e' : '#22c55e'
  const fillHoverUnvisited = dark ? '#2d4f7c' : '#cbd5e1'
  const fillHoverVisited   = dark ? '#4ade80' : '#16a34a'
  const stroke = dark ? '#0f172a' : '#ffffff'

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
      {/* Header */}
      {!compact && <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-blue-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">Travel Map</h3>
            <p className="text-[11px] text-slate-400 leading-tight">Countries you've visited</p>
          </div>
        </div>
        <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
          {visitedCountries.length} / 195 countries
        </span>
      </div>}

      {/* Map */}
      <div
        ref={mapRef}
        className="relative bg-slate-50 dark:bg-slate-900 select-none flex-1 min-h-0 overflow-hidden"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Zoom controls */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.6, 10))}
            className="w-7 h-7 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z / 1.6, 1.8))}
            className="w-7 h-7 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
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
                        fill={isVisited ? fillVisited : fillUnvisited}
                        stroke={stroke}
                        strokeWidth={0.5}
                        style={{
                          default: { outline: 'none' },
                          hover:   { fill: isVisited ? fillHoverVisited : fillHoverUnvisited, outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={(e) => {
                          const rect = mapRef.current?.getBoundingClientRect()
                          setTooltip({
                            name: geo.properties.name,
                            x: e.clientX - (rect?.left ?? 0),
                            y: e.clientY - (rect?.top ?? 0),
                          })
                        }}
                        onMouseMove={(e) => {
                          const rect = mapRef.current?.getBoundingClientRect()
                          setTooltip(t => t ? {
                            ...t,
                            x: e.clientX - (rect?.left ?? 0),
                            y: e.clientY - (rect?.top ?? 0),
                          } : null)
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    )
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>
        )}

        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg bg-slate-900 dark:bg-slate-700 text-white whitespace-nowrap"
            style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
          >
            {tooltip.name}
          </div>
        )}
      </div>

      {/* Footer */}
      {!compact && <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            Visited Countries
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-600 shrink-0" />
            Not Visited
          </span>
        </div>
        <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          View All Countries <span className="text-sm">›</span>
        </button>
      </div>}
    </div>
  )
}
