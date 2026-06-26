export interface PassengerInfo {
  firstName:    string
  lastName:     string
  gender?:      string
  nationality?: string
  dob?:         string
}

export interface CardProps {
  depCode:    string
  arrCode:    string
  depCity:    string
  arrCity:    string
  depTime:    string
  arrTime:    string
  dateStr:    string
  flightNum:  string
  seat:       string
  passenger:  PassengerInfo
  bookingRef: string
  direction:  'Outbound' | 'Return'
  compact:    boolean
}

export const fmtTime = (s?: string | null) => {
  if (!s) return '--:--'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h
}

export const genSeat     = (ref: string, fn: string) =>
  `${(hash(ref + fn) % 30) + 1}${'ABCDEF'[hash(ref + fn) % 6]}`
export const genGate     = (fn: string) => String((hash(fn + 'gate') % 30) + 1)
export const genTerminal = (code: string) => ['1', '2', '2C', '3', 'A', 'B'][hash(code) % 6]
