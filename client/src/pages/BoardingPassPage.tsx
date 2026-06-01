import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Plane, Printer } from 'lucide-react'
import type { FlightDto } from '../features/search/types'
import type { BookingRecord } from '../services/api'

/* ── types ──────────────────────────────────────────────────── */
interface PassengerInfo {
  firstName:    string
  lastName:     string
  gender?:      string
  nationality?: string
  dob?:         string
}

interface CardProps {
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

/* ── helpers ────────────────────────────────────────────────── */
const fmtTime = (s?: string | null) => {
  if (!s) return '--:--'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0
  return h
}

const genSeat     = (ref: string, fn: string) =>
  `${(hash(ref + fn) % 30) + 1}${'ABCDEF'[hash(ref + fn) % 6]}`
const genGate     = (fn: string) => String((hash(fn + 'gate') % 30) + 1)
const genTerminal = (code: string) => ['1', '2', '2C', '3', 'A', 'B'][hash(code) % 6]

/* ── barcode ────────────────────────────────────────────────── */
function Barcode({ seed, width = 240 }: { seed: string; width?: number }) {
  const ws: number[] = [2, 1, 1, 1, 2]
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i)
    ws.push((c & 3) + 1, ((c >> 2) & 1) + 1, ((c >> 3) & 3) + 1, ((c >> 5) & 1) + 1, ((c >> 6) & 1) + 1, 1)
  }
  ws.push(2, 1, 1, 1, 2)
  const total = ws.reduce((s, w) => s + w, 0)
  const H = 60
  const u = width / total
  let x = 0
  const rects: string[] = []
  ws.forEach((w, i) => {
    const px = w * u
    if (i % 2 === 0)
      rects.push(`<rect x="${x.toFixed(2)}" y="0" width="${Math.max(0.5, px).toFixed(2)}" height="${H}" fill="#1e293b"/>`)
    x += px
  })
  return (
    <div dangerouslySetInnerHTML={{
      __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}">${rects.join('')}</svg>`
    }} />
  )
}

/* ── boarding pass card ─────────────────────────────────────── */
function BoardingPassCard(p: CardProps) {
  const c        = p.compact
  const gate     = genGate(p.flightNum)
  const terminal = genTerminal(p.depCode)
  const fullName = `${p.passenger.firstName} ${p.passenger.lastName}`.toUpperCase()
  const isReturn = p.direction === 'Return'

  const leftBg = isReturn
    ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
    : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
  const accent = isReturn ? 'text-violet-600' : 'text-blue-600'

  /* size tokens: compact (side-by-side) vs full (single) */
  const pad      = c ? 'p-7'     : 'p-8'
  const codeFs   = c ? '52px'    : '60px'
  const cityFs   = c ? '12px'    : '14px'
  const timeFs   = c ? '28px'    : '32px'
  const mbBadge  = c ? 'mb-5'    : 'mb-6'
  const mbHero   = c ? 'mb-5'    : 'mb-6'
  const mbDate   = c ? 'mb-5'    : 'mb-7'
  const planeW   = c ? 'w-7 h-7' : 'w-8 h-8'
  const stripLbl = '9px'
  const stripVal = c ? '13px'    : '15px'
  const rPad     = c ? 'p-5'     : 'p-6'
  const rCodeFs  = c ? '18px'    : '20px'
  const rCityFs  = c ? '10px'    : '11px'
  const rTimeFs  = c ? '17px'    : '18px'
  const rPassFs  = c ? '12px'    : '13px'
  const rSeatFs  = c ? '17px'    : '18px'
  const barcodeW = c ? 230       : 260

  return (
    <div className="relative w-full">
      {/* perforated notch cutouts */}
      <div
        className="absolute z-10 w-7 h-4 bg-slate-50 rounded-b-full"
        style={{ top: -1, left: 'calc(62% - 14px)', border: '1px solid #e2e8f0', borderTop: 'none' }}
      />
      <div
        className="absolute z-10 w-7 h-4 bg-slate-50 rounded-t-full"
        style={{ bottom: -1, left: 'calc(62% - 14px)', border: '1px solid #e2e8f0', borderBottom: 'none' }}
      />

      <div className="flex rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.13)' }}>

        {/* ── LEFT ────────────────────────────────────────────── */}
        <div
          className={`relative text-white overflow-hidden ${pad}`}
          style={{ flex: '0 0 62%', background: leftBg }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute top-3 right-6 w-40 h-40 rounded-full border border-white opacity-10" />
          <div className="absolute top-10 right-14 w-28 h-28 rounded-full border border-white opacity-[0.07]" />

          {/* direction badge */}
          <div className={`relative inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full ${mbBadge}`}>
            <Plane className="w-3 h-3" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase">{p.direction}</span>
          </div>

          {/* FROM ✈ TO */}
          <div className={`relative flex items-center gap-4 ${mbHero}`}>
            <div className="shrink-0">
              <div className="text-[10px] font-bold tracking-[0.2em] opacity-60 mb-0.5">FROM</div>
              <div className="font-black tracking-tight leading-none" style={{ fontSize: codeFs }}>{p.depCode}</div>
              <div className="font-bold opacity-80 mt-1 tracking-widest uppercase" style={{ fontSize: cityFs }}>{p.depCity}</div>
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="flex-1 h-px bg-white/30" />
              <Plane className={`${planeW} opacity-90 shrink-0`} />
              <div className="flex-1 h-px bg-white/30" />
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-bold tracking-[0.2em] opacity-60 mb-0.5">TO</div>
              <div className="font-black tracking-tight leading-none" style={{ fontSize: codeFs }}>{p.arrCode}</div>
              <div className="font-bold opacity-80 mt-1 tracking-widest uppercase" style={{ fontSize: cityFs }}>{p.arrCity}</div>
            </div>
          </div>

          {/* date + times */}
          <div className={`relative ${mbDate}`}>
            <div className="text-[13px] font-bold opacity-70 mb-1">{p.dateStr}</div>
            <div className="flex items-baseline gap-4">
              <span className="font-black tabular-nums" style={{ fontSize: timeFs }}>{p.depTime}</span>
              <span className="opacity-40 text-xl">—</span>
              <span className="font-black tabular-nums" style={{ fontSize: timeFs }}>{p.arrTime}</span>
            </div>
          </div>

          {/* bottom strip */}
          <div className="relative flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-white/20">
            {(
              [
                ['Passenger', fullName],
                ['Flight',    p.flightNum],
                ['Seat',      p.seat],
                ['Gate',      gate],
                ['Terminal',  terminal],
              ] as [string, string][]
            ).map(([lbl, val]) => (
              <div key={lbl}>
                <div className="font-bold tracking-[0.15em] opacity-55 uppercase" style={{ fontSize: stripLbl }}>{lbl}</div>
                <div className="font-black mt-0.5 max-w-[140px] truncate" style={{ fontSize: stripVal }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEPARATOR ───────────────────────────────────────── */}
        <div className="self-stretch shrink-0" style={{ width: 2, borderLeft: '2px dashed #cbd5e1' }} />

        {/* ── RIGHT ───────────────────────────────────────────── */}
        <div className={`flex-1 bg-white ${rPad} flex flex-col justify-between min-w-0`}>
          <div>
            <div className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase mb-5">
              Boarding Pass
            </div>

            <div className="space-y-3">
              <div className="flex gap-6">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">From</div>
                  <div className={`font-black leading-tight ${accent}`} style={{ fontSize: rCodeFs }}>{p.depCode}</div>
                  <div className="text-slate-500 font-semibold truncate" style={{ fontSize: rCityFs }}>{p.depCity}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">To</div>
                  <div className={`font-black leading-tight ${accent}`} style={{ fontSize: rCodeFs }}>{p.arrCode}</div>
                  <div className="text-slate-500 font-semibold truncate" style={{ fontSize: rCityFs }}>{p.arrCity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date</div>
                  <div className="text-[10px] font-bold text-slate-700">{p.dateStr}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Flight</div>
                  <div className="text-[10px] font-bold text-slate-700">{p.flightNum}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Departs</div>
                  <div className="font-black text-slate-800 tabular-nums" style={{ fontSize: rTimeFs }}>{p.depTime}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Arrives</div>
                  <div className="font-black text-slate-800 tabular-nums" style={{ fontSize: rTimeFs }}>{p.arrTime}</div>
                </div>
              </div>

              <div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Passenger</div>
                <div className={`font-black truncate ${accent}`} style={{ fontSize: rPassFs }}>{fullName}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {(
                  [['Seat', p.seat], ['Gate', gate], ['Trm', terminal]] as [string, string][]
                ).map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{lbl}</div>
                    <div className={`font-black ${accent}`} style={{ fontSize: rSeatFs }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Barcode seed={p.bookingRef + p.flightNum + p.depCode + p.arrCode} width={barcodeW} />
            <div className="mt-2 text-center">
              <div className="text-[8px] font-mono text-slate-400 tracking-[0.06em]">{p.bookingRef}</div>
              <div className={`text-[9px] font-black tracking-tight mt-0.5 ${accent}`}>SkyWave</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── page ───────────────────────────────────────────────────── */
export default function BoardingPassPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const raw = location.state as any // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!raw) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No boarding pass data found.</p>
          <button onClick={() => navigate('/')} className="text-blue-600 font-semibold hover:underline">
            Go home
          </button>
        </div>
      </div>
    )
  }

  /* normalise from BookingPage or MyBookingsPage */
  const bookingRef: string   = raw.bookingRef   ?? raw.booking?.confirmationCode ?? ''
  const isRoundTrip: boolean = raw.isRoundTrip  ?? raw.local?.isRoundTrip        ?? false
  const fromCity: string     = raw.fromCity      ?? raw.local?.fromCity           ?? ''
  const toCity: string       = raw.toCity        ?? raw.local?.toCity             ?? ''
  const grandTotal: number   = raw.grandTotal    ?? raw.local?.grandTotal         ?? 0

  const passenger: PassengerInfo =
    raw.passenger ?? raw.local?.passenger ?? { firstName: 'Passenger', lastName: '' }

  const outbound: FlightDto | null = raw.outbound ?? (raw.local as any)?.outbound ?? null
  const ret: FlightDto | null      = raw.ret      ?? (raw.local as any)?.ret      ?? null
  const booking: BookingRecord | undefined = raw.booking

  const buildCard = (
    flight: FlightDto | null,
    bk: BookingRecord | undefined,
    direction: 'Outbound' | 'Return',
    dCity: string,
    aCity: string,
    compact: boolean,
  ): CardProps | null => {
    if (flight) return {
      depCode:   flight.departureAirportCode,
      arrCode:   flight.arrivalAirportCode,
      depCity:   flight.departureCity || dCity,
      arrCity:   flight.arrivalCity   || aCity,
      depTime:   fmtTime(flight.departureTime),
      arrTime:   fmtTime(flight.arrivalTime),
      dateStr:   fmtDate(flight.departureTime),
      flightNum: flight.flightNumber,
      seat:      bk?.seatNumber || genSeat(bookingRef, flight.flightNumber),
      passenger, bookingRef, direction, compact,
    }
    if (bk) return {
      depCode:   bk.departureAirport,
      arrCode:   bk.arrivalAirport,
      depCity:   dCity || bk.departureAirport,
      arrCity:   aCity || bk.arrivalAirport,
      depTime:   fmtTime(bk.departureTime),
      arrTime:   fmtTime(bk.arrivalTime),
      dateStr:   fmtDate(bk.departureTime),
      flightNum: bk.flightNumber,
      seat:      bk.seatNumber || genSeat(bookingRef, bk.flightNumber),
      passenger, bookingRef, direction, compact,
    }
    return null
  }

  const hasReturn    = isRoundTrip && ret !== null
  const compact      = hasReturn

  const outboundCard = buildCard(outbound, booking, 'Outbound', fromCity, toCity, compact)
  const returnCard   = hasReturn
    ? buildCard(ret!, undefined, 'Return', toCity, fromCity, compact)
    : null

  return (
    <>
      {/* print: each ticket on its own landscape page */}
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; }
          .bp-cards { display: block !important; }
          .bp-card-wrap { width: 100% !important; break-after: page; page-break-after: always; }
          .bp-card-wrap:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 print:bg-white flex flex-col">

        {/* ── header ──────────────────────────────────────────── */}
        <div className="print:hidden bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <span className="font-black text-slate-900 tracking-tight">SkyWave</span>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* ── content ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col print:block print:p-0">

          {/* title — pinned at top, centered */}
          <div className="print:hidden text-center pt-10 pb-6 px-6">
            <h1 className="text-2xl font-black text-slate-900 mb-1">Your Boarding Pass</h1>
            <p className="text-slate-400 text-sm">
              Booking reference:&nbsp;
              <span className="font-black text-blue-600 tracking-[0.15em] font-mono">{bookingRef}</span>
              {grandTotal > 0 && (
                <>
                  <span className="ml-3 text-slate-300">·</span>
                  <span className="ml-3 font-semibold text-slate-500">€{Math.round(grandTotal)} paid</span>
                </>
              )}
            </p>
          </div>

          {/* cards — fill remaining height, centered in both axes */}
          <div className="flex-1 flex items-center justify-center px-6 pb-10">
            <div
              className={`bp-cards flex gap-8 justify-center items-center ${
                hasReturn ? 'flex-row' : 'flex-col'
              }`}
            >
              {outboundCard && (
                <div className={`bp-card-wrap shrink-0 ${hasReturn ? 'w-[700px]' : 'w-full max-w-[800px]'}`}>
                  <BoardingPassCard {...outboundCard} />
                </div>
              )}
              {returnCard && (
                <div className="bp-card-wrap w-[700px] shrink-0">
                  <BoardingPassCard {...returnCard} />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
