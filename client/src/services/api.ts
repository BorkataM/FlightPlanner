import type { Airport, FlightDto } from '../features/search/types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export const STORAGE_KEY = 'skywave_user'

export interface StoredUser {
  userId:       number
  email:        string
  firstName:    string
  lastName:     string
  token:        string
  refreshToken: string
}

export function getStoredUser(): StoredUser | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as StoredUser) : null
  } catch { return null }
}

export function getStoredToken(): string {
  return getStoredUser()?.token ?? ''
}

interface RequestOptions {
  body?:  unknown
  token?: string
  auth?:  boolean
}

async function request<T>(method: string, url: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.auth) {
    const tok = opts.token || getStoredToken()
    if (tok) headers['Authorization'] = `Bearer ${tok}`
  }

  const res = await fetch(url, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { message?: string }).message ?? res.statusText)
  }
  return res.json() as Promise<T>
}

const get        = <T>(url: string)                              => request<T>('GET',    url)
const post       = <T>(url: string, body: unknown)              => request<T>('POST',   url, { body })
const authGet    = <T>(url: string, token?: string)             => request<T>('GET',    url, { auth: true, token })
const authPost   = <T>(url: string, body: unknown, token?: string) => request<T>('POST', url, { body, auth: true, token })
const authPut    = <T>(url: string, body: unknown, token?: string) => request<T>('PUT',  url, { body, auth: true, token })
const authDelete = <T>(url: string, token?: string)             => request<T>('DELETE', url, { auth: true, token })

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
  login:       (data: LoginData)    => post<AuthResponse>(`${BASE_URL}/api/auth/login`,    data),
  register:    (data: RegisterData) => post<AuthResponse>(`${BASE_URL}/api/auth/register`, data),
  refresh:     (refreshToken: string) => post<AuthResponse>(`${BASE_URL}/api/auth/refresh`, { refreshToken }),
  googleAuth:  (credential: string) => post<AuthResponse>(`${BASE_URL}/api/auth/google`, { credential }),
  forgotPassword: (email: string) =>
    post<{ message: string }>(`${BASE_URL}/api/auth/forgot-password`, { email }),
  resetPassword:  (token: string, newPassword: string) =>
    post<{ message: string }>(`${BASE_URL}/api/auth/reset-password`, { token, newPassword }),
}

export const airportsApi = {
  search: (query: string) =>
    get<Airport[]>(`${BASE_URL}/api/airports/search?query=${encodeURIComponent(query)}`),

  getAll: () =>
    get<Airport[]>(`${BASE_URL}/api/airports`),
}

export const flightsApi = {
  search:         (params: FlightSearchParams) => get<FlightDto[]>(buildFlightSearchUrl(params)),
  smartest:       (limit = 10)                 => get<FlightDto[]>(`${BASE_URL}/api/flights/smartest?limit=${limit}`),
  getById:        (id: number)                 => get<FlightDto>(`${BASE_URL}/api/flights/${id}`),
  departureCodes: ()                           => get<string[]>(`${BASE_URL}/api/flights/departure-codes`),
}

export interface AiChatHistoryMessage {
  role:    'user' | 'assistant'
  content: string
}

export interface AiCheckoutData {
  flightId:        number
  passenger:       { firstName: string; lastName: string }
  priceEur:        number | null
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
