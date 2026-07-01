import type { FlightDto } from '../search/types'

export interface BookingState {
  outbound:    FlightDto
  ret:         FlightDto | null
  totalPrice:  number
  isRoundTrip: boolean
  fromCity:    string
  toCity:      string
  token:       string
  passenger?:  { firstName: string; lastName: string }
}

export type BaggageType   = 'personal' | 'carryOn'
export type InsuranceType = 'none' | 'basic' | 'plus'

/* Per-user passenger details remembered after a booking, for one-click refill next time */
export interface SavedTraveller {
  firstName:   string
  lastName:    string
  nationality: string
  gender:      string
  dobDay:      string
  dobMonth:    string
  dobYear:     string
  email:       string
  phone:       string
}

export const CARRY_ON_PRICE  = 25
export const CHECKED_PRICE   = 35
export const INS_BASIC_PRICE = 12
export const INS_PLUS_PRICE  = 20

export const fmtTime = (s?: string | null) => {
  if (!s) return '-'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export const fmtShortDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

export function durMin(f: FlightDto) {
  if (!f.departureTime || !f.arrivalTime) return 0
  return (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000
}

export const fmtDur = (m: number) =>
  `${Math.floor(m / 60)}h ${String(m % 60).padStart(2,'0')}m`

export const genRef = () => Math.random().toString(36).slice(2, 8).toUpperCase()

export const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Belarus','Belgium','Brazil','Bulgaria','Canada','Chile','China',
  'Colombia','Croatia','Czech Republic','Denmark','Ecuador','Egypt','Estonia',
  'Finland','France','Georgia','Germany','Greece','Hungary','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kazakhstan',
  'Latvia','Lebanon','Lithuania','Malaysia','Mexico','Moldova','Morocco',
  'Netherlands','New Zealand','Nigeria','North Macedonia','Norway','Pakistan',
  'Peru','Philippines','Poland','Portugal','Romania','Russia','Saudi Arabia',
  'Serbia','Singapore','Slovakia','Slovenia','South Africa','South Korea',
  'Spain','Sweden','Switzerland','Thailand','Turkey','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Venezuela','Vietnam','Other',
]

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const NAME_RE  = /^[\p{L}][\p{L} '.-]{1,}$/u

export const STEP1_FIELDS = ['firstName', 'lastName', 'nationality', 'gender', 'dob']
export const STEP2_FIELDS = ['email', 'phone', 'cardNum', 'cardExpiry', 'cardCvv', 'cardName']

export function nameError(v: string, field: string): string {
  if (!v.trim()) return `${field} is required`
  if (!NAME_RE.test(v.trim())) return `${field} can only contain letters`
  return ''
}

export function dobError(d: string, m: string, y: string): string {
  if (!d || !m || !y) return 'Date of birth is required'
  const day = +d, month = +m, year = +y
  const today = new Date(); today.setHours(0, 0, 0, 0)
  if (year < 1900 || year > today.getFullYear()) return 'Enter a valid year of birth'
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return 'Invalid day for that month'
  const dob = new Date(year, month - 1, day)
  if (dob > today) return 'Date of birth cannot be in the future'
  const age = (today.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000)
  if (age > 120) return 'Please check the year of birth'
  return ''
}

export function emailError(v: string): string {
  if (!v.trim()) return 'Email is required'
  if (!EMAIL_RE.test(v.trim())) return 'Enter a valid email address'
  return ''
}

export function phoneError(v: string): string {
  if (!v.trim()) return 'Phone number is required'
  if (!/^\+?[\d\s().-]+$/.test(v.trim())) return 'Enter a valid phone number'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number'
  return ''
}

function luhnOk(digits: string): boolean {
  let sum = 0, alt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = +digits[i]
    if (alt) { n *= 2; if (n > 9) n -= 9 }
    sum += n; alt = !alt
  }
  return sum % 10 === 0
}

export function cardError(v: string): string {
  const digits = v.replace(/\D/g, '')
  if (!digits) return 'Card number is required'
  if (digits.length < 16) return 'Card number must be 16 digits'
  if (!luhnOk(digits)) return 'This card number is invalid'
  return ''
}

export function expiryError(v: string): string {
  const m = v.match(/^(\d{2})\/(\d{2})$/)
  if (!m) return 'Use MM/YY format'
  const mm = +m[1], yy = +m[2]
  if (mm < 1 || mm > 12) return 'Invalid month'
  const now = new Date()
  const curYY = now.getFullYear() % 100
  const curMM = now.getMonth() + 1
  if (yy < curYY || (yy === curYY && mm < curMM)) return 'Card has expired'
  if (yy > curYY + 15) return 'Invalid expiry year'
  return ''
}

export function cvvError(v: string): string {
  if (!v) return 'CVV is required'
  if (v.length < 3) return 'CVV must be 3–4 digits'
  return ''
}

export const inputCls  = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all placeholder-slate-300 bg-white dark:bg-slate-700'
export const selectCls = 'w-full border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all bg-white dark:bg-slate-700 cursor-pointer'
