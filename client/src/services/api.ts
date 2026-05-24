import type { Airport, FlightDto } from '../features/search/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const AI_URL   = import.meta.env.VITE_AI_URL  ?? 'http://localhost:8000'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.statusText)
  return res.json() as Promise<T>
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  return res.json() as Promise<T>
}

export interface FlightSearchParams {
  from?:  string
  to?:    string
  limit?: number
}

function buildFlightSearchUrl({ from, to, limit }: FlightSearchParams): string {
  const params = new URLSearchParams()
  if (from)  params.set('from',  from)
  if (to)    params.set('to',    to)
  if (limit) params.set('limit', String(limit))
  return `${BASE_URL}/api/flights/search?${params}`
}

export const airportsApi = {
  search: (query: string) =>
    get<Airport[]>(`${BASE_URL}/api/airports/search?query=${encodeURIComponent(query)}`),

  getAll: () =>
    get<Airport[]>(`${BASE_URL}/api/airports`),
}

export const flightsApi = {
  search:   (params: FlightSearchParams) => get<FlightDto[]>(buildFlightSearchUrl(params)),
  smartest: (limit = 10)                 => get<FlightDto[]>(`${BASE_URL}/api/flights/smartest?limit=${limit}`),
}

export const aiApi = {
  score: (params: unknown) => post(`${AI_URL}/ai/score`, params),
  chat:  (message: string) => post(`${AI_URL}/ai/chat`, { message }),
}
