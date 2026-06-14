import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Car, Footprints, Bus, ExternalLink, Loader2, MapPin, Navigation } from 'lucide-react'
import { weatherApi, type FlightGeo } from '../../services/api'
import { fetchOsrmRoute, fmtTravelTime, type RouteResult } from './routing'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Mode = 'driving' | 'walking' | 'transit'

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length >= 2) map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] })
  }, [map, coords])
  return null
}

interface Props { flightId: number }

export default function AirportRouteMap({ flightId }: Props) {
  const [geo,          setGeo]          = useState<FlightGeo | null>(null)
  const [userPos,      setUserPos]       = useState<{ lat: number; lon: number } | null>(null)
  const [geoError,     setGeoError]      = useState(false)
  const [mode,         setMode]          = useState<Mode>('driving')
  const [route,        setRoute]         = useState<RouteResult | null>(null)
  const [routeLoading, setRouteLoading]  = useState(false)
  const currentMode = useRef(mode)
  currentMode.current = mode

  useEffect(() => {
    weatherApi.getFlightGeo(flightId).then(setGeo).catch(() => {})
  }, [flightId])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      ()  => setGeoError(true),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  // OSRM routing for car and walking — gives actual road time
  useEffect(() => {
    if (!userPos || !geo || mode === 'transit') { setRoute(null); return }
    setRouteLoading(true)
    fetchOsrmRoute(userPos, geo.departure, mode === 'driving' ? 'driving' : 'walking')
      .then(r => { if (currentMode.current === mode) setRoute(r) })
      .catch(() => setRoute(null))
      .finally(() => setRouteLoading(false))
  }, [userPos, geo, mode])

  if (!geo) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400 gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading map…
      </div>
    )
  }

  const airport = geo.departure
  const mapCenter: [number, number] = [airport.lat, airport.lon]

  const polyCoords: [number, number][] = route
    ? route.coordinates
    : userPos
      ? [[userPos.lat, userPos.lon], [airport.lat, airport.lon]]
      : []

  const gmapsUrl = (travelMode: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${airport.lat},${airport.lon}&travelmode=${travelMode}`

  return (
    <div>
      {/* Mode tabs */}
      <div className="flex gap-2 mb-3">
        {([
          { id: 'driving', icon: Car,       label: 'Car'     },
          { id: 'walking', icon: Footprints, label: 'Walk'    },
          { id: 'transit', icon: Bus,        label: 'Transit' },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              mode === id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            {mode === id && route && id !== 'transit' && (
              <span className="ml-1 font-black">{fmtTravelTime(route.durationSec)}</span>
            )}
          </button>
        ))}

        {routeLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400 self-center ml-1" />}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm" style={{ height: 260 }}>
        {mode === 'transit' ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Bus className="w-10 h-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Transit directions</p>
            <p className="text-xs text-slate-400 text-center px-8">
              Open Google Maps to see live transit routes, stop names, and departure times.
            </p>
            <a
              href={gmapsUrl('transit')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
            >
              Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : geoError ? (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-3">
            <Navigation className="w-8 h-8 text-slate-300" />
            <p className="text-xs text-slate-400 text-center px-8">
              Enable location access in your browser to see travel time to the airport.
            </p>
            <a
              href={gmapsUrl(mode === 'driving' ? 'driving' : 'walking')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Open in Google Maps <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            <Marker position={[airport.lat, airport.lon]}>
              <Popup><strong>{airport.name}</strong><br />{airport.city}</Popup>
            </Marker>

            {userPos && (
              <Marker
                position={[userPos.lat, userPos.lon]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)"></div>`,
                  iconAnchor: [7, 7],
                })}
              >
                <Popup>Your location</Popup>
              </Marker>
            )}

            {polyCoords.length >= 2 && (
              <Polyline positions={polyCoords} pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.75 }} />
            )}

            {polyCoords.length >= 2 && <FitBounds coords={polyCoords} />}
          </MapContainer>
        )}
      </div>

      {/* Info strip */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-semibold">{airport.name}</span>
          {airport.iataCode && <span className="text-slate-400">· {airport.iataCode}</span>}
        </div>

        {mode !== 'transit' && (
          <a
            href={gmapsUrl(mode === 'driving' ? 'driving' : 'walking')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
          >
            Open in Google Maps <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
