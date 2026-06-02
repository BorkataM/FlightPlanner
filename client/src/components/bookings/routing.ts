export interface RouteResult {
  durationSec:   number
  distanceM:     number
  coordinates:   [number, number][]   // [lat, lon] pairs for Leaflet Polyline
}

export function fmtTravelTime(sec: number): string {
  const h   = Math.floor(sec / 3600)
  const min = Math.round((sec % 3600) / 60)
  if (h > 0) return `${h}h ${min}m`
  return `${min} min`
}

export async function fetchOsrmRoute(
  origin: { lat: number; lon: number },
  dest:   { lat: number; lon: number },
  profile: 'driving' | 'walking',
): Promise<RouteResult> {
  const url =
    `https://router.project-osrm.org/route/v1/${profile}/` +
    `${origin.lon},${origin.lat};${dest.lon},${dest.lat}` +
    `?overview=full&geometries=geojson`

  const res  = await fetch(url)
  if (!res.ok) throw new Error('OSRM routing failed')
  const data = await res.json() as OsrmResponse

  if (data.code !== 'Ok' || !data.routes.length)
    throw new Error('No route found')

  const route = data.routes[0]
  const coords: [number, number][] = route.geometry.coordinates.map(
    ([lon, lat]) => [lat, lon]
  )

  return {
    durationSec: route.duration,
    distanceM:   route.distance,
    coordinates: coords,
  }
}

// ── OSRM response shape ────────────────────────────────────────────────────
interface OsrmResponse {
  code:   string
  routes: OsrmRoute[]
}
interface OsrmRoute {
  duration: number
  distance: number
  geometry: { type: string; coordinates: [number, number][] }
}
