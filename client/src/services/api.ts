import type { Airport, FlightDto } from '../features/search/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const AI_URL   = import.meta.env.VITE_AI_URL  ?? 'http://localhost:8000'

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('skywave_user')
    return stored ? (JSON.parse(stored) as { token: string }).token : null
  } catch { return null }
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

async function authGet<T>(url: string, token?: string): Promise<T> {
  const tok = token ?? getToken()
  const headers: Record<string, string> = {}
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(res.statusText)
  return res.json() as Promise<T>
}

async function authPost<T>(url: string, body: unknown, token?: string): Promise<T> {
  const tok = token ?? getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export interface BookingRecord {
  id:                number
  flightId:          number
  flightNumber:      string
  departureAirport:  string
  arrivalAirport:    string
  departureTime:     string
  arrivalTime:       string
  price:             number
  bookingDate:       string
  seatNumber:        string
  confirmationCode:  string
}

export interface FlightSearchParams {
  from?:  string
  to?:    string
  date?:  string
  limit?: number
}

export interface RegisterData {
  email:     string
  password:  string
  firstName: string
  lastName:  string
  age:       number
}

export interface LoginData {
  email:    string
  password: string
}

export interface AuthResponse {
  token:        string
  refreshToken: string
  userId:       number
  email:        string
  firstName:    string
  lastName:     string
}

function buildFlightSearchUrl({ from, to, date, limit }: FlightSearchParams): string {
  const params = new URLSearchParams()
  if (from)  params.set('from',  from)
  if (to)    params.set('to',    to)
  if (date)  params.set('date',  date)
  if (limit) params.set('limit', String(limit))
  return `${BASE_URL}/api/flights/search?${params}`
}

export const authApi = {
  login:    (data: LoginData)    => post<AuthResponse>(`${BASE_URL}/api/auth/login`,    data),
  register: (data: RegisterData) => post<AuthResponse>(`${BASE_URL}/api/auth/register`, data),
  refresh:  (refreshToken: string) => post<AuthResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken }),
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

export const bookingsApi = {
  create:        (flightId: number, token?: string) => authPost<BookingRecord>(`${BASE_URL}/api/bookings`, { flightId }, token),
  getMyBookings: (token?: string)                   => authGet<BookingRecord[]>(`${BASE_URL}/api/bookings`, token),
}
