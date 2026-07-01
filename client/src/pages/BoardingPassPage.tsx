import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Printer } from 'lucide-react'
import type { FlightDto } from '../features/search/types'
import type { BookingRecord } from '../services/api'
import { useLocale } from '../context/LocaleContext'
import { type PassengerInfo, type CardProps, fmtTime, fmtDate, genSeat } from '../features/boarding/boardingPass'
import { BoardingPassCard } from '../features/boarding/BoardingPassCard'

export default function BoardingPassPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { t } = useLocale()
  const bp = t.boardingPass
  const raw = location.state as any // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!raw) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{bp.noData}</p>
          <button onClick={() => navigate('/')} className="text-blue-600 font-semibold hover:underline">
            {bp.goHome}
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
      depCode:   bk.departureAirportCode || bk.departureAirport.slice(0, 4).toUpperCase(),
      arrCode:   bk.arrivalAirportCode   || bk.arrivalAirport.slice(0, 4).toUpperCase(),
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 print:bg-white flex flex-col">

        {/* header */}
        <div className="print:hidden bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 lg:py-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <button
              onClick={() => raw?.fromBooking ? navigate('/', { replace: true }) : navigate(-1)}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> {bp.back}
            </button>
            <button onClick={() => navigate('/')} className="font-black text-slate-900 dark:text-slate-100 tracking-tight hover:opacity-70 transition-opacity">SkyWave</button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Printer className="w-4 h-4" /> {bp.print}
            </button>
          </div>
        </div>

        {/* content */}
        <div className="flex-1 flex flex-col print:block print:p-0">

          {/* title - pinned at top, centered */}
          <div className="print:hidden text-center pt-10 pb-6 px-6">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-1">{bp.title}</h1>
            <p className="text-slate-400 text-sm">
              {bp.bookingRef}&nbsp;
              <span className="font-black text-blue-600 tracking-[0.15em] font-mono">{bookingRef}</span>
              {grandTotal > 0 && (
                <>
                  <span className="ml-3 text-slate-300">·</span>
                  <span className="ml-3 font-semibold text-slate-500">€{Math.round(grandTotal)} {bp.paid}</span>
                </>
              )}
            </p>
          </div>

          {/* cards - fill remaining height, centered in both axes */}
          <div className="flex-1 flex items-center justify-center px-4 lg:px-6 pb-10">
            <div
              className={`bp-cards flex gap-6 xl:gap-8 justify-center items-center ${
                hasReturn ? 'flex-col xl:flex-row' : 'flex-col'
              }`}
            >
              {outboundCard && (
                <div className={`bp-card-wrap shrink-0 ${hasReturn ? 'w-full max-w-[700px]' : 'w-full max-w-[800px]'}`}>
                  <BoardingPassCard {...outboundCard} />
                </div>
              )}
              {returnCard && (
                <div className="bp-card-wrap w-full max-w-[700px] shrink-0">
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
