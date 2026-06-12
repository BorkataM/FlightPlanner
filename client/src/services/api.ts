import type { Airport, FlightDto } from '../features/search/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''
const AI_URL   = import.meta.env.VITE_AI_URL  ?? 'http://localhost:8000'

function getToken(): string | null {
  try {
    const stored = localStorage.getItem('skywave_user')
    return stored ? (JSON.parse(stored) as { token: string }).token : null
  } catch { return null }
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
  const tok = token || getToken()
  const headers: Record<string, string> = {}
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(res.statusText)
  return res.json() as Promise<T>
}

async function authPost<T>(url: string, body: unknown, token?: string): Promise<T> {
  const tok = token || getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

async function authPut<T>(url: string, body: unknown, token?: string): Promise<T> {
  const tok = token || getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

async function authDelete<T>(url: string, token?: string): Promise<T> {
  const tok = token || getToken()
  const headers: Record<string, string> = {}
  if (tok) headers['Authorization'] = `Bearer ${tok}`
  const res = await fetch(url, { method: 'DELETE', headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export interface BookingRecord {
  id:                    number
  flightId:              number
  flightNumber:          string
  departureAirport:      string
  arrivalAirport:        string
  departureAirportCode:  string
  arrivalAirportCode:    string
  departureTime:         string
  arrivalTime:           string
  price:                 number
  bookingDate:           string
  seatNumber:            string
  confirmationCode:      string
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
  getById:  (id: number)                 => get<FlightDto>(`${BASE_URL}/api/flights/${id}`),
}

export interface AiChatHistoryMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface AiCheckoutData {
  flightId:        number
  passenger:       { firstName: string; lastName: string }
  priceUsd:        number | null
  departureCity?:  string | null
  arrivalCity?:    string | null
}

export interface AiChatResponse {
  message:            string
  flightIdsMentioned: number[]
  toolCallsMade:      string[]
  checkoutData?:      AiCheckoutData | null
}

export const aiApi = {
  score: (params: unknown) => post(`${AI_URL}/ai/score`, params),
  chat:  (message: string, conversationHistory: AiChatHistoryMessage[] = []) =>
    authPost<AiChatResponse>(`${BASE_URL}/api/ai/chat`, { message, conversationHistory }),
}

export const bookingsApi = {
  create:        (flightId: number, token?: string) => authPost<BookingRecord>(`${BASE_URL}/api/bookings`, { flightId }, token),
  getMyBookings: (token?: string)                   => authGet<BookingRecord[]>(`${BASE_URL}/api/bookings`, token),
}

export interface WeatherForecast {
  temperatureC:    number
  condition:       string
  description:     string
  windSpeedKmh:    number
  humidity:        number
  iconCode:        string
  forecastTimeUtc: string
  city:            string
}

export interface DelayRisk {
  risk:              'Low' | 'Medium' | 'High'
  reason:            string
  departureWeather:  WeatherForecast
}

export interface AirportGeo {
  lat:      number
  lon:      number
  name:     string
  city:     string
  iataCode: string
}

export interface FlightGeo {
  departure: AirportGeo
  arrival:   AirportGeo
}

export interface UserStats {
  id:                      number
  firstName:               string
  lastName:                string
  email:                   string
  flightsCount:            number
  countriesVisited:        number
  followersCount:          number
  followingCount:          number
  isFollowedByCurrentUser: boolean
}

export interface UserSearchResult {
  id:                      number
  firstName:               string
  lastName:                string
  email:                   string
  flightsCount:            number
  followersCount:          number
  isFollowedByCurrentUser: boolean
}

export interface UserSummary {
  id:         number
  firstName:  string
  lastName:   string
  email:      string
  followedAt: string
}

export const socialApi = {
  getMyStats:           (token?: string) =>
    authGet<UserStats>(`${BASE_URL}/api/social/stats/me`, token),
  getUserStats:         (id: number, token?: string) =>
    authGet<UserStats>(`${BASE_URL}/api/social/stats/${id}`, token),
  getVisitedCountries:  (token?: string) =>
    authGet<string[]>(`${BASE_URL}/api/social/visited-countries`, token),
  search:               (q: string, token?: string) =>
    authGet<UserSearchResult[]>(`${BASE_URL}/api/social/search?q=${encodeURIComponent(q)}`, token),
  getUserVisitedCountries: (id: number, token?: string) =>
    authGet<string[]>(`${BASE_URL}/api/social/${id}/visited-countries`, token),
  getMyFollowers:  (token?: string) =>
    authGet<UserSummary[]>(`${BASE_URL}/api/social/followers`, token),
  getMyFollowing:  (token?: string) =>
    authGet<UserSummary[]>(`${BASE_URL}/api/social/following`, token),
  follow:   (id: number, token?: string) =>
    authPost<{ message: string }>(`${BASE_URL}/api/social/follow/${id}`, {}, token),
  unfollow: (id: number, token?: string) =>
    authDelete<{ message: string }>(`${BASE_URL}/api/social/follow/${id}`, token),
}

export interface UserAppearance {
  avatarDataUrl:     string | null
  coverImageDataUrl: string | null
  coverGradient:     string | null
  bio:               string | null
}

export const usersApi = {
  getMyAppearance:    (token?: string) =>
    authGet<UserAppearance>(`${BASE_URL}/api/users/me/appearance`, token),
  updateMyAppearance: (data: UserAppearance, token?: string) =>
    authPut<UserAppearance>(`${BASE_URL}/api/users/me/appearance`, data, token),
  getUserAppearance:  (id: number, token?: string) =>
    authGet<UserAppearance>(`${BASE_URL}/api/users/${id}/appearance`, token),
}

export const weatherApi = {
  getForecast: (lat: number, lon: number, date: string, token?: string) =>
    authGet<WeatherForecast>(`${BASE_URL}/api/weather?lat=${lat}&lon=${lon}&date=${date}`, token),

  getDelayRisk: (flightId: number, token?: string) =>
    authGet<DelayRisk>(`${BASE_URL}/api/weather/delay-risk?flightId=${flightId}`, token),

  getDestinationForecast: (flightId: number, token?: string) =>
    authGet<WeatherForecast>(`${BASE_URL}/api/weather/destination?flightId=${flightId}`, token),

  getFlightGeo: (flightId: number, token?: string) =>
    authGet<FlightGeo>(`${BASE_URL}/api/weather/geo?flightId=${flightId}`, token),
}
