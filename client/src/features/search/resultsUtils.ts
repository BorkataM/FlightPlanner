import type { FlightDto } from './types'

export type Sort  = 'cheapest' | 'fastest' | 'best'
export type Badge = 'CHEAPEST' | 'FASTEST' | 'BEST' | 'ECO'

export interface Combo {
  outbound:      FlightDto
  ret:           FlightDto | null
  totalPrice:    number
  totalDuration: number
  smartScore:    number | null
  badges:        Badge[]
}

export const toDateKey = (s: string) => s.slice(0, 10)

export function durationMin(f: FlightDto) {
  if (!f.departureTime || !f.arrivalTime) return Infinity
  return (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000
}

export const fmtTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const fmtDur = (min: number) =>
  isFinite(min) ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '—'

export const fmtTabDate = (s: string) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export const fmtLegDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

export const BADGE_CLASS: Record<Badge, string> = {
  CHEAPEST: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
  FASTEST:  'bg-sky-50     dark:bg-sky-950  text-sky-700     dark:text-sky-400  border border-sky-200     dark:border-sky-800',
  BEST:     'bg-violet-50  dark:bg-violet-950 text-violet-700  dark:text-violet-400 border border-violet-200  dark:border-violet-800',
  ECO:      'bg-teal-50    dark:bg-teal-950 text-teal-700    dark:text-teal-400 border border-teal-200    dark:border-teal-800',
}
