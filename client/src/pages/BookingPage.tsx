import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Plane, ChevronLeft, ChevronRight, Check,
  Shield, Briefcase, CreditCard, User, Mail, Info, Loader2,
} from 'lucide-react'
import type { FlightDto } from '../features/search/types'
import { bookingsApi } from '../services/api'

/* ── types ──────────────────────────────────────────────── */
export interface BookingState {
  outbound:    FlightDto
  ret:         FlightDto | null
  totalPrice:  number
  isRoundTrip: boolean
  fromCity:    string
  toCity:      string
  token:       string
}

type BaggageType   = 'personal' | 'carryOn'
type InsuranceType = 'none' | 'basic' | 'plus'

const CARRY_ON_PRICE  = 25
const CHECKED_PRICE   = 35
const INS_BASIC_PRICE = 12
const INS_PLUS_PRICE  = 20

/* ── helpers ────────────────────────────────────────────── */
const fmtTime = (s?: string | null) => {
  if (!s) return '—'
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

const fmtShortDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''

function durMin(f: FlightDto) {
  if (!f.departureTime || !f.arrivalTime) return 0
  return (new Date(f.arrivalTime).getTime() - new Date(f.departureTime).getTime()) / 60000
}

const fmtDur = (m: number) =>
  `${Math.floor(m / 60)}h ${String(m % 60).padStart(2,'0')}m`

const genRef = () => Math.random().toString(36).slice(2, 8).toUpperCase()

/* ── constants ──────────────────────────────────────────── */
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const COUNTRIES = [
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

/* ── shared styles ──────────────────────────────────────── */
const inputCls  = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder-slate-300 bg-white'
const selectCls = 'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white cursor-pointer'

/* ── small components ───────────────────────────────────── */
function ProgressDot({ n, label, state }: { n: number; label: string; state: 'done' | 'active' | 'upcoming' }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        state === 'done'   ? 'bg-emerald-500 text-white' :
        state === 'active' ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                             'bg-slate-200 text-slate-400'
      }`}>
        {state === 'done' ? <Check className="w-4 h-4" /> : n}
      </div>
      <span className={`text-[11px] font-semibold whitespace-nowrap ${
        state === 'active' ? 'text-blue-600' : state === 'done' ? 'text-emerald-600' : 'text-slate-400'
      }`}>{label}</span>
    </div>
  )
}

function FlightRow({ flight, dir }: { flight: FlightDto; dir: 'Outbound' | 'Return' }) {
  const dur = durMin(flight)
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full border ${
          dir === 'Outbound' ? 'bg-blue-50 text-blue-500 border-blue-100' : 'bg-violet-50 text-violet-500 border-violet-100'
        }`}>{dir}</span>
        <span className="text-[12px] text-slate-400 font-medium">{fmtShortDate(flight.departureTime)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <div className="text-[20px] font-black text-slate-900 tabular-nums leading-none">
            {fmtTime(flight.departureTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">{flight.departureAirportCode}</div>
        </div>
        <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
          <span className="text-[10px] text-slate-400">{fmtDur(dur)}</span>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-slate-200" />
            <Plane className="w-3 h-3 text-slate-400 rotate-90 shrink-0" />
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <span className="text-[10px] text-slate-400">
            {flight.airlineName} · {flight.stops === 0 ? 'Direct' : `${flight.stops} stop`}
          </span>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[20px] font-black text-slate-900 tabular-nums leading-none">
            {fmtTime(flight.arrivalTime)}
          </div>
          <div className="text-[11px] font-bold text-slate-500 mt-1">{flight.arrivalAirportCode}</div>
        </div>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SectionHeader({ icon, title, sub }: { icon: React.ReactNode; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function OptionCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  )
}

function RadioDot({ checked }: { checked: boolean }) {
  return (
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
      checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
    }`}>
      {checked && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
    </div>
  )
}

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className={`font-semibold text-slate-800 mt-0.5 capitalize ${mono ? 'font-mono text-blue-600 text-base' : 'text-sm'}`}>
        {value}
      </div>
    </div>
  )
}

/* ── main page ──────────────────────────────────────────── */
export default function BookingPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const state     = location.state as BookingState | null

  useEffect(() => {
    if (!user && !state?.token) navigate('/', { replace: true })
  }, [user, state, navigate])

  const [step, setStep] = useState<1 | 2>(1)

  /* step 1 – passenger */
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [nationality, setNationality] = useState('')
  const [gender,      setGender]      = useState('')
  const [dobDay,      setDobDay]      = useState('')
  const [dobMonth,    setDobMonth]    = useState('')
  const [dobYear,     setDobYear]     = useState('')

  /* step 1 – extras */
  const [baggage,         setBaggage]         = useState<BaggageType>('personal')
  const [checkedBaggage,  setCheckedBaggage]  = useState(false)
  const [insurance,       setInsurance]       = useState<InsuranceType>('none')

  /* step 2 – contact + payment */
  const [email,      setEmail]      = useState('')
  const [phone,      setPhone]      = useState('')
  const [cardNum,    setCardNum]    = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv,    setCardCvv]    = useState('')
  const [cardName,   setCardName]   = useState('')

  /* confirmation */
  const [confirmed,   setConfirmed]   = useState(false)
  const [bookingRef,  setBookingRef]  = useState('')
  const [paying,      setPaying]      = useState(false)
  const [payError,    setPayError]    = useState('')

  /* guard */
  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">No flight selected.</p>
          <button onClick={() => navigate('/')} className="text-blue-600 font-semibold hover:underline">
            Back to search
          </button>
        </div>
      </div>
    )
  }

  const { outbound, ret, totalPrice, isRoundTrip, fromCity, toCity } = state

  /* price calc */
  const baggageExtra   = baggage === 'carryOn' ? CARRY_ON_PRICE : 0
  const checkedExtra   = checkedBaggage ? CHECKED_PRICE : 0
  const insExtra       = insurance === 'basic' ? INS_BASIC_PRICE : insurance === 'plus' ? INS_PLUS_PRICE : 0
  const grandTotal     = totalPrice + baggageExtra + checkedExtra + insExtra

  const step1Valid  = firstName.trim() && lastName.trim() && nationality && gender && dobDay && dobMonth && dobYear
  const step2Valid  = email.trim() && cardNum.length >= 19 && cardExpiry.length === 5 && cardCvv.length >= 3 && cardName.trim()

  const handleContinue = () => {
    if (!step1Valid) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePay = async () => {
    if (!step2Valid || paying) return
    setPaying(true)
    setPayError('')
    try {
      const token = state?.token || user?.token || ''
      const outboundBooking = await bookingsApi.create(outbound.id, token)
      let retBooking = null
      if (isRoundTrip && ret) retBooking = await bookingsApi.create(ret.id, token)

      const code = outboundBooking.confirmationCode || genRef()
      setBookingRef(code)

      /* persist passenger + booking metadata locally so My Bookings can display them */
      const existing = JSON.parse(localStorage.getItem('skywave_local_bookings') ?? '[]')
      existing.unshift({
        confirmationCode: code,
        outboundBookingId: outboundBooking.id,
        returnBookingId:   retBooking?.id ?? null,
        passenger: { firstName, lastName, gender, nationality, dob: `${dobDay}/${dobMonth}/${dobYear}` },
        fromCity, toCity, isRoundTrip,
        outbound, ret,
        baggage, checkedBaggage, insurance, grandTotal,
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('skywave_local_bookings', JSON.stringify(existing))

      setConfirmed(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  /* ── Confirmation ──────────────────────────────────────── */
  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">Booking Confirmed!</h1>
          <p className="text-slate-400 mb-8">Your trip to <strong className="text-slate-700">{toCity}</strong> is all set.</p>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left mb-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Booking reference</span>
              <span className="text-xl font-black text-blue-600 tracking-[0.2em] font-mono">{bookingRef}</span>
            </div>
            <div className="pt-4 space-y-3 text-sm">
              {[
                ['Passenger',      `${firstName} ${lastName}`],
                ['Route',          `${fromCity} → ${toCity}${isRoundTrip ? ' and back' : ''}`],
                ['Outbound',       `${outbound.flightNumber} · ${fmtShortDate(outbound.departureTime)}`],
                ...(ret ? [['Return', `${ret.flightNumber} · ${fmtShortDate(ret.departureTime)}`]] : []),
                ['Total paid',     `€${Math.round(grandTotal)}`],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between">
                  <span className="text-slate-400">{lbl}</span>
                  <span className="font-semibold text-slate-900">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/boarding-pass', {
                state: {
                  bookingRef,
                  passenger: { firstName, lastName, gender, nationality, dob: `${dobDay}/${dobMonth}/${dobYear}` },
                  outbound, ret, isRoundTrip, fromCity, toCity,
                  baggage, checkedBaggage, insurance, grandTotal,
                },
              })}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              View Boarding Pass
            </button>
            <button onClick={() => navigate('/')}
              className="flex-1 py-3 border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold rounded-xl transition-colors">
              Back to Search
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── price sidebar ─────────────────────────────────────── */
  const PriceSidebar = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sticky top-24">
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Price summary</div>
      <div className="space-y-2">
        {[
          [`1× Adult (${isRoundTrip ? 'round trip' : 'one way'})`, totalPrice],
          ...(baggageExtra  ? [['Carry-on bundle',    baggageExtra]]  : []),
          ...(checkedExtra  ? [['Checked bag (23 kg)', checkedExtra]] : []),
          ...(insExtra      ? [`Travel ${insurance}`,  insExtra].map(x => [x]) : []),
        ].map(([lbl, amt]) => (
          <div key={String(lbl)} className="flex justify-between text-sm text-slate-600">
            <span>{lbl}</span>
            <span>€{Math.round(Number(amt))}</span>
          </div>
        ))}
        <div className="border-t border-slate-100 pt-3 mt-1 flex justify-between font-black text-slate-900 text-base">
          <span>Total</span>
          <span>€{Math.round(grandTotal)}</span>
        </div>
        <p className="text-[10px] text-slate-400 pt-0.5">Including all taxes and fees</p>
      </div>

      {/* mini flight strip */}
      <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Your flights</div>
        {[
          { f: outbound, color: 'text-blue-500', rot: 'rotate-90' },
          ...(ret ? [{ f: ret, color: 'text-violet-500', rot: '-rotate-90' }] : []),
        ].map(({ f, color, rot }, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-slate-600">
            <Plane className={`w-3 h-3 shrink-0 ${color} ${rot}`} />
            <span className="tabular-nums font-medium">
              {fmtTime(f.departureTime)} {f.departureAirportCode} → {fmtTime(f.arrivalTime)} {f.arrivalAirportCode}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  /* ── page ──────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* sticky header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => step === 2 ? (setStep(1), window.scrollTo({ top: 0 })) : navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 2 ? 'Back' : 'Results'}
          </button>
          <span className="font-black text-slate-900 tracking-tight">SkyWave</span>
          <span className="text-xs text-slate-400 font-medium">Step {step} of 2</span>
        </div>
      </div>

      {/* progress */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <ProgressDot n={1} label="Passenger & Extras" state={step > 1 ? 'done' : 'active'} />
          <div className={`w-20 h-px mx-3 ${step > 1 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
          <ProgressDot n={2} label="Overview & Payment" state={step === 2 ? 'active' : 'upcoming'} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
        <h1 className="text-2xl font-black text-slate-900 mb-6">
          {fromCity} → {toCity}{isRoundTrip ? ' and back' : ''}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* ── left ────────────────────────────────────── */}
          <div className="space-y-4">

            {/* trip summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Trip summary</div>
              <div className="space-y-4">
                <FlightRow flight={outbound} dir="Outbound" />
                {ret && (
                  <>
                    <div className="border-t border-dashed border-slate-100" />
                    <FlightRow flight={ret} dir="Return" />
                  </>
                )}
              </div>
            </div>

            {/* ── STEP 1 ─────────────────────────────────── */}
            {step === 1 && (
              <>
                {/* passenger */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader
                    icon={<User className="w-4 h-4 text-blue-600" />}
                    title="Primary Passenger"
                    sub="Enter details exactly as in your passport / ID"
                  />

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Given names" required>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)}
                          placeholder="e.g. Harry James" className={inputCls} />
                      </FormField>
                      <FormField label="Surnames" required>
                        <input value={lastName} onChange={e => setLastName(e.target.value)}
                          placeholder="e.g. Brown" className={inputCls} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Nationality" required>
                        <select value={nationality} onChange={e => setNationality(e.target.value)} className={selectCls}>
                          <option value="">Select country</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </FormField>
                      <FormField label="Gender" required>
                        <select value={gender} onChange={e => setGender(e.target.value)} className={selectCls}>
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other / prefer not to say</option>
                        </select>
                      </FormField>
                    </div>

                    <FormField label="Date of birth" required>
                      <div className="grid grid-cols-3 gap-3">
                        <input value={dobDay} onChange={e => setDobDay(e.target.value.replace(/\D/,'').slice(0,2))}
                          placeholder="DD" className={inputCls} />
                        <select value={dobMonth} onChange={e => setDobMonth(e.target.value)} className={selectCls}>
                          <option value="">Month</option>
                          {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                        </select>
                        <input value={dobYear} onChange={e => setDobYear(e.target.value.replace(/\D/,'').slice(0,4))}
                          placeholder="YYYY" className={inputCls} />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* cabin baggage */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader
                    icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                    title="Cabin Baggage"
                    sub="Select one option"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={baggage === 'personal'} onClick={() => setBaggage('personal')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">Personal item</span>
                        <RadioDot checked={baggage === 'personal'} />
                      </div>
                      <div className="text-xs text-slate-500 mb-1">Must fit under front seat</div>
                      <div className="text-xs text-slate-400 font-mono">20 × 30 × 40 cm</div>
                      <div className="text-sm font-bold text-emerald-600 mt-3">Included</div>
                    </OptionCard>

                    <OptionCard selected={baggage === 'carryOn'} onClick={() => setBaggage('carryOn')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900">Carry-on bundle</span>
                        <RadioDot checked={baggage === 'carryOn'} />
                      </div>
                      <div className="text-xs text-slate-500 mb-1">Personal item + cabin bag + priority boarding</div>
                      <div className="text-xs text-slate-400 font-mono">up to 20 kg</div>
                      <div className="text-sm font-bold text-slate-900 mt-3">+€{CARRY_ON_PRICE}</div>
                    </OptionCard>
                  </div>
                </div>

                {/* checked baggage */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader
                    icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                    title="Checked Baggage"
                    sub="Large luggage stored in the hold"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={!checkedBaggage} onClick={() => setCheckedBaggage(false)}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-900">No checked baggage</span>
                        <RadioDot checked={!checkedBaggage} />
                      </div>
                      <div className="text-sm font-bold text-emerald-600">Included</div>
                    </OptionCard>

                    <OptionCard selected={checkedBaggage} onClick={() => setCheckedBaggage(true)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-900">23 kg bag</span>
                        <RadioDot checked={checkedBaggage} />
                      </div>
                      <div className="text-xs text-slate-400 mb-3">Max 23 kg · hard or soft case</div>
                      <div className="text-sm font-bold text-slate-900">+€{CHECKED_PRICE}</div>
                    </OptionCard>
                  </div>
                </div>

                {/* insurance */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <SectionHeader
                      icon={<Shield className="w-4 h-4 text-blue-600" />}
                      title="Travel Insurance"
                      sub="Protect your trip"
                    />
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">by AXA Assistance</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(
                      [
                        { type: 'none'  as InsuranceType, label: 'No insurance', price: 0,               features: [] },
                        { type: 'basic' as InsuranceType, label: 'Travel Basic', price: INS_BASIC_PRICE, features: ['Medical expenses','Trip cancellation','Assistance'] },
                        { type: 'plus'  as InsuranceType, label: 'Travel Plus',  price: INS_PLUS_PRICE,  features: ['Medical expenses','Trip cancellation','Assistance','Lost baggage','Liability'] },
                      ]
                    ).map(({ type, label, price, features }) => (
                      <OptionCard key={type} selected={insurance === type} onClick={() => setInsurance(type)}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-bold text-slate-900 leading-snug">{label}</span>
                          <RadioDot checked={insurance === type} />
                        </div>
                        {features.length === 0
                          ? <div className="text-xs text-slate-400 mb-3">No coverage included</div>
                          : (
                            <ul className="space-y-1 mb-3">
                              {features.map(f => (
                                <li key={f} className="flex items-start gap-1.5 text-xs text-slate-500">
                                  <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )
                        }
                        <div className={`text-sm font-bold ${price === 0 ? 'text-slate-400' : 'text-slate-900'}`}>
                          {price === 0 ? 'Free' : `+€${price}`}
                        </div>
                      </OptionCard>
                    ))}
                  </div>
                </div>

                {/* continue */}
                <button onClick={handleContinue} disabled={!step1Valid}
                  className={`w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 transition-all ${
                    step1Valid
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Continue <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* ── STEP 2 ─────────────────────────────────── */}
            {step === 2 && (
              <>
                {/* booking summary */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Passenger & extras</div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <SummaryRow label="Full name"     value={`${firstName} ${lastName}`} />
                    <SummaryRow label="Gender"        value={gender} />
                    <SummaryRow label="Nationality"   value={nationality} />
                    <SummaryRow label="Date of birth" value={`${dobDay}/${dobMonth}/${dobYear}`} />
                    <SummaryRow label="Cabin baggage" value={baggage === 'personal' ? '1× Personal item' : 'Carry-on bundle'} />
                    <SummaryRow label="Checked bag"   value={checkedBaggage ? '23 kg' : 'None'} />
                    <SummaryRow label="Insurance"     value={insurance === 'none' ? 'None' : insurance === 'basic' ? 'Travel Basic' : 'Travel Plus'} />
                  </div>
                </div>

                {/* contact */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader
                    icon={<Mail className="w-4 h-4 text-blue-600" />}
                    title="Contact Details"
                    sub="We'll send your booking confirmation here"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Email" required>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com" className={inputCls} />
                    </FormField>
                    <FormField label="Phone number" required>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="+359 88 888 8888" className={inputCls} />
                    </FormField>
                  </div>
                </div>

                {/* payment */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <SectionHeader
                    icon={<CreditCard className="w-4 h-4 text-blue-600" />}
                    title="Pay with Card"
                    sub="All major cards accepted"
                  />
                  <div className="space-y-4">
                    <FormField label="Card number" required>
                      <input
                        value={cardNum}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g,'').slice(0,16)
                          setCardNum(raw.replace(/(.{4})/g,'$1 ').trim())
                        }}
                        placeholder="1234 5678 9012 3456"
                        className={`${inputCls} font-mono tracking-widest`}
                        maxLength={19}
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Expiry (MM/YY)" required>
                        <input
                          value={cardExpiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g,'')
                            if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2,4)
                            setCardExpiry(v)
                          }}
                          placeholder="MM/YY"
                          className={`${inputCls} font-mono`}
                          maxLength={5}
                        />
                      </FormField>
                      <FormField label="CVV" required>
                        <input
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                          placeholder="···"
                          className={`${inputCls} font-mono`}
                          maxLength={4}
                        />
                      </FormField>
                    </div>

                    <FormField label="Name on card" required>
                      <input
                        value={cardName}
                        onChange={e => setCardName(e.target.value.toUpperCase())}
                        placeholder="HARRY J BROWN"
                        className={`${inputCls} uppercase tracking-wider font-mono`}
                      />
                    </FormField>

                    <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-px" />
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Your payment is secured with 256-bit SSL encryption.
                        By paying you agree to our Terms &amp; Conditions.
                      </p>
                    </div>
                  </div>
                </div>

                {payError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    <Info className="w-4 h-4 shrink-0" /> {payError}
                  </div>
                )}

                {/* pay button */}
                <button onClick={handlePay} disabled={!step2Valid || paying}
                  className={`w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all ${
                    step2Valid && !paying
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-[0.99]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {paying
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
                    : <>Pay €{Math.round(grandTotal)} <ChevronRight className="w-5 h-5" /></>
                  }
                </button>
              </>
            )}
          </div>

          {/* ── right sidebar ────────────────────────────── */}
          <div className="hidden lg:block">
            <PriceSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
