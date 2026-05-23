import type { Airport, FlightDto } from '../features/search/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const AI_URL   = import.meta.env.VITE_AI_URL  ?? 'http://localhost:8000'

const get = <T>(url: string): Promise<T> =>
  fetch(url).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })

const post = <T>(url: string, body: unknown): Promise<T> =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json())

export const airportsApi = {
  search: (query: string): Promise<Airport[]> =>
    get(`${BASE_URL}/api/airports/search?query=${encodeURIComponent(query)}`),
  getAll: (): Promise<Airport[]> =>
    get(`${BASE_URL}/api/airports`),
}

export const flightsApi = {
  search: (params: { from?: string; to?: string; limit?: number }): Promise<FlightDto[]> => {
    const q = new URLSearchParams()
    if (params.from)  q.set('from', params.from)
    if (params.to)    q.set('to', params.to)
    if (params.limit) q.set('limit', String(params.limit))
    return get(`${BASE_URL}/api/flights/search?${q}`)
  },
  smartest: (limit = 10): Promise<FlightDto[]> =>
    get(`${BASE_URL}/api/flights/smartest?limit=${limit}`),
}

export const aiApi = {
  score: (params: unknown) => post(`${AI_URL}/ai/score`, params),
  chat:  (message: string) => post(`${AI_URL}/ai/chat`, { message }),
}
