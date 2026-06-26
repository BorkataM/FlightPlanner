import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import {
  Plane, ChevronLeft, ChevronRight, Check,
  Shield, Briefcase, CreditCard, User, Mail, Info, Loader2,
} from 'lucide-react'
import { bookingsApi } from '../services/api'
import GooglePayButton from '@google-pay/button-react'
import {
  CARRY_ON_PRICE, CHECKED_PRICE, INS_BASIC_PRICE, INS_PLUS_PRICE,
  MONTHS, COUNTRIES, STEP1_FIELDS, STEP2_FIELDS,
  fmtTime, fmtShortDate, genRef,
  nameError, dobError, emailError, phoneError, cardError, expiryError, cvvError,
  inputCls, selectCls,
  type BookingState, type BaggageType, type InsuranceType, type SavedTraveller,
} from '../features/booking/bookingForm'
import {
  ProgressDot, FlightRow, FormField, SectionHeader, OptionCard, RadioDot, SummaryRow,
} from '../features/booking/BookingFormParts'

export default function BookingPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()
  const { t } = useLocale()
  const bk = t.booking
  const state     = location.state as BookingState | null

  useEffect(() => {
    if (!user && !state?.token) navigate('/', { replace: true })
  }, [user, state, navigate])

  const [step, setStep] = useState<1 | 2>(1)

  /* step 1 – passenger */
  const [firstName,   setFirstName]   = useState(state?.passenger?.firstName ?? '')
  const [lastName,    setLastName]    = useState(state?.passenger?.lastName  ?? '')
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

  /* validation: show field errors once touched (or after a submit attempt) */
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const touch     = (f: string) => setTouched(p => (p[f] ? p : { ...p, [f]: true }))
  const touchMany = (fs: string[]) => setTouched(p => ({ ...p, ...Object.fromEntries(fs.map(f => [f, true])) }))

  /* quick-fill passenger + contact from the signed-in user's profile / last booking */
  const travellerKey = user ? `skywave_traveller_${user.userId}` : ''
  const [savedTraveller] = useState<SavedTraveller | null>(() => {
    if (!travellerKey) return null
    try {
      const raw = localStorage.getItem(travellerKey)
      return raw ? (JSON.parse(raw) as SavedTraveller) : null
    } catch { return null }
  })
  const [profileApplied, setProfileApplied] = useState(false)

  const applyProfile = () => {
    if (savedTraveller) {
      // Everything we remembered from a previous booking
      setFirstName(savedTraveller.firstName)
      setLastName(savedTraveller.lastName)
      setNationality(savedTraveller.nationality)
      setGender(savedTraveller.gender)
      setDobDay(savedTraveller.dobDay)
      setDobMonth(savedTraveller.dobMonth)
      setDobYear(savedTraveller.dobYear)
      setEmail(savedTraveller.email)
      setPhone(savedTraveller.phone)
      touchMany(STEP1_FIELDS)
    } else if (user) {
      // First time — only name + email exist on the account profile
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setEmail(user.email)
      touchMany(['firstName', 'lastName'])
    }
    setProfileApplied(true)
  }

  const rememberTraveller = () => {
    if (!travellerKey) return
    try {
      localStorage.setItem(travellerKey, JSON.stringify({
        firstName, lastName, nationality, gender, dobDay, dobMonth, dobYear, email, phone,
      } satisfies SavedTraveller))
    } catch { /* ignore storage errors */ }
  }

  /* guard */
  if (!state) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{bk.noFlightSelected}</p>
          <button onClick={() => navigate('/')} className="text-blue-600 font-semibold hover:underline">
            {bk.backToSearch}
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

  const errors: Record<string, string> = {
    firstName:   nameError(firstName, 'First name'),
    lastName:    nameError(lastName, 'Surname'),
    nationality: nationality ? '' : 'Please select a nationality',
    gender:      gender ? '' : 'Please select a gender',
    dob:         dobError(dobDay, dobMonth, dobYear),
    email:       emailError(email),
    phone:       phoneError(phone),
    cardNum:     cardError(cardNum),
    cardExpiry:  expiryError(cardExpiry),
    cardCvv:     cvvError(cardCvv),
    cardName:    nameError(cardName, 'Name on card'),
  }
  const err = (f: string) => (touched[f] ? errors[f] : '')

  const step1Valid = STEP1_FIELDS.every(f => !errors[f])
  const step2Valid = STEP2_FIELDS.every(f => !errors[f])

  const handleContinue = () => {
    if (!step1Valid) { touchMany(STEP1_FIELDS); return }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const executeBooking = async () => {
    const token = state?.token || user?.token || ''
    const outboundBooking = await bookingsApi.create(outbound.id, token)
    let retBooking = null
    if (isRoundTrip && ret) retBooking = await bookingsApi.create(ret.id, token)
    const code = outboundBooking.confirmationCode || genRef()
    setBookingRef(code)
    const existing = JSON.parse(localStorage.getItem('skywave_local_bookings') ?? '[]')
    existing.unshift({
      confirmationCode:  code,
      outboundBookingId: outboundBooking.id,
      returnBookingId:   retBooking?.id ?? null,
      passenger: { firstName, lastName, gender, nationality, dob: `${dobDay}/${dobMonth}/${dobYear}` },
      fromCity, toCity, isRoundTrip,
      outbound, ret,
      baggage, checkedBaggage, insurance, grandTotal,
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem('skywave_local_bookings', JSON.stringify(existing))
    rememberTraveller()
    setConfirmed(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePay = async () => {
    if (paying) return
    if (!step2Valid) { touchMany(STEP2_FIELDS); return }
    setPaying(true)
    setPayError('')
    try {
      await executeBooking()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  const handleGooglePay = async () => {
    if (paying) return
    if (errors.email)  { touch('email'); return }
    if (errors.phone)  { touch('phone'); return }
    setPaying(true)
    setPayError('')
    try {
      await executeBooking()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  /* Confirmation */
  if (confirmed) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-1">{bk.bookingConfirmed}</h1>
          <p className="text-slate-400 mb-8">{bk.bookingConfirmedSub.replace('{city}', toCity)}</p>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 text-left mb-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">{bk.bookingReference}</span>
              <span className="text-xl font-black text-blue-600 tracking-[0.2em] font-mono">{bookingRef}</span>
            </div>
            <div className="pt-4 space-y-3 text-sm">
              {[
                [bk.passenger,   `${firstName} ${lastName}`],
                [bk.route,       `${fromCity} → ${toCity}${isRoundTrip ? ` ${bk.andBack}` : ''}`],
                [bk.outbound,    `${outbound.flightNumber} · ${fmtShortDate(outbound.departureTime)}`],
                ...(ret ? [[bk.return, `${ret.flightNumber} · ${fmtShortDate(ret.departureTime)}`]] : []),
                [bk.totalPaid,   `€${Math.round(grandTotal)}`],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between">
                  <span className="text-slate-400">{lbl}</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{val}</span>
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
                  fromBooking: true,
                },
              })}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
            >
              {bk.viewBoardingPass}
            </button>
            <button onClick={() => navigate('/')}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-semibold rounded-xl transition-colors">
              {bk.backToSearch}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* price sidebar */
  const PriceSidebar = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 sticky top-24">
      <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{bk.priceSummary}</div>
      <div className="space-y-2">
        {[
          [isRoundTrip ? bk.adultRoundTrip : bk.adultOneWay, totalPrice],
          ...(baggageExtra  ? [[bk.carryOnBundle,              baggageExtra]]  : []),
          ...(checkedExtra  ? [[`${bk.bag23kg} (23 kg)`,       checkedExtra]]  : []),
          ...(insExtra      ? [[insurance === 'basic' ? bk.insBasic : bk.insPlus, insExtra]] : []),
        ].map(([lbl, amt]) => (
          <div key={String(lbl)} className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>{lbl}</span>
            <span>€{Math.round(Number(amt))}</span>
          </div>
        ))}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-1 flex justify-between font-black text-slate-900 dark:text-slate-100 text-base">
          <span>{bk.total}</span>
          <span>€{Math.round(grandTotal)}</span>
        </div>
        <p className="text-[10px] text-slate-400 pt-0.5">{bk.taxesNote}</p>
      </div>

      {/* mini flight strip */}
      <div className="border-t border-slate-100 dark:border-slate-700 mt-4 pt-4 space-y-2">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{bk.yourFlights}</div>
        {[
          { f: outbound, color: 'text-blue-500', rot: 'rotate-90' },
          ...(ret ? [{ f: ret, color: 'text-violet-500', rot: '-rotate-90' }] : []),
        ].map(({ f, color, rot }, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-300">
            <Plane className={`w-3 h-3 shrink-0 ${color} ${rot}`} />
            <span className="tabular-nums font-medium">
              {fmtTime(f.departureTime)} {f.departureAirportCode} → {fmtTime(f.arrivalTime)} {f.arrivalAirportCode}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  /* page */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* sticky header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-4 py-3 lg:py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => step === 2 ? (setStep(1), window.scrollTo({ top: 0 })) : navigate(-1)}
            className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 2 ? bk.back : bk.results}
          </button>
          <button onClick={() => navigate('/')} className="font-black text-slate-900 dark:text-slate-100 tracking-tight hover:opacity-70 transition-opacity">SkyWave</button>
          <span className="text-xs text-slate-400 font-medium">{bk.stepOf.replace('{step}', String(step))}</span>
        </div>
      </div>

      {/* progress */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-center">
          <ProgressDot n={1} label={bk.step1Label} state={step > 1 ? 'done' : 'active'} />
          <div className={`w-20 h-px mx-3 ${step > 1 ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
          <ProgressDot n={2} label={bk.step2Label} state={step === 2 ? 'active' : 'upcoming'} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 pb-16">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-6">
          {fromCity} → {toCity}{isRoundTrip ? ` ${bk.andBack}` : ''}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* left */}
          <div className="space-y-4">

            {/* trip summary */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{bk.tripSummary}</div>
              <div className="space-y-4">
                <FlightRow flight={outbound} dir="Outbound" />
                {ret && (
                  <>
                    <div className="border-t border-dashed border-slate-100 dark:border-slate-700" />
                    <FlightRow flight={ret} dir="Return" />
                  </>
                )}
              </div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                {/* passenger */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <SectionHeader
                    icon={<User className="w-4 h-4 text-blue-600" />}
                    title={bk.primaryPassenger}
                    sub={bk.passengerSub}
                  />

                  {user && (
                    <button
                      type="button"
                      onClick={applyProfile}
                      className={`w-full flex items-center gap-3 p-3 mb-4 rounded-xl border-2 text-left transition-all ${
                        profileApplied
                          ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30'
                          : 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 hover:border-blue-400'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm ${profileApplied ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                        {profileApplied
                          ? <Check className="w-4 h-4" />
                          : `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {profileApplied
                            ? bk.filledFromProfile
                            : savedTraveller ? bk.useMyDetailsHintFull : bk.useMyDetailsHint}
                        </div>
                      </div>
                      {!profileApplied && (
                        <span className="ml-auto shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                          {bk.useMyDetails}
                        </span>
                      )}
                    </button>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label={bk.givenNames} required error={err('firstName')}>
                        <input value={firstName} onChange={e => setFirstName(e.target.value)} onBlur={() => touch('firstName')}
                          placeholder="e.g. Harry James" className={`${inputCls} ${err('firstName') ? '!border-red-400' : ''}`} />
                      </FormField>
                      <FormField label={bk.surnames} required error={err('lastName')}>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} onBlur={() => touch('lastName')}
                          placeholder="e.g. Brown" className={`${inputCls} ${err('lastName') ? '!border-red-400' : ''}`} />
                      </FormField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label={bk.nationality} required error={err('nationality')}>
                        <select value={nationality} onChange={e => { setNationality(e.target.value); touch('nationality') }} onBlur={() => touch('nationality')}
                          className={`${selectCls} ${err('nationality') ? '!border-red-400' : ''}`}>
                          <option value="">{bk.selectCountry}</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </FormField>
                      <FormField label={bk.gender} required error={err('gender')}>
                        <select value={gender} onChange={e => { setGender(e.target.value); touch('gender') }} onBlur={() => touch('gender')}
                          className={`${selectCls} ${err('gender') ? '!border-red-400' : ''}`}>
                          <option value="">{bk.selectGender}</option>
                          <option value="male">{bk.male}</option>
                          <option value="female">{bk.female}</option>
                          <option value="other">{bk.other}</option>
                        </select>
                      </FormField>
                    </div>

                    <FormField label={bk.dateOfBirth} required error={err('dob')}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <input value={dobDay} onChange={e => setDobDay(e.target.value.replace(/\D/,'').slice(0,2))} onBlur={() => touch('dob')}
                          placeholder="DD" className={`${inputCls} ${err('dob') ? '!border-red-400' : ''}`} />
                        <select value={dobMonth} onChange={e => { setDobMonth(e.target.value); touch('dob') }}
                          className={`${selectCls} ${err('dob') ? '!border-red-400' : ''}`}>
                          <option value="">{bk.month}</option>
                          {MONTHS.map((m,i) => <option key={m} value={String(i+1)}>{m}</option>)}
                        </select>
                        <input value={dobYear} onChange={e => setDobYear(e.target.value.replace(/\D/,'').slice(0,4))} onBlur={() => touch('dob')}
                          placeholder="YYYY" className={`${inputCls} ${err('dob') ? '!border-red-400' : ''}`} />
                      </div>
                    </FormField>
                  </div>
                </div>

                {/* cabin baggage */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <SectionHeader
                    icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                    title={bk.cabinBaggage}
                    sub={bk.cabinBaggageSub}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={baggage === 'personal'} onClick={() => setBaggage('personal')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{bk.personalItem}</span>
                        <RadioDot checked={baggage === 'personal'} />
                      </div>
                      <div className="text-xs text-slate-500 mb-1">{bk.personalItemSub}</div>
                      <div className="text-xs text-slate-400 font-mono">{bk.personalItemDim}</div>
                      <div className="text-sm font-bold text-emerald-600 mt-3">{bk.included}</div>
                    </OptionCard>

                    <OptionCard selected={baggage === 'carryOn'} onClick={() => setBaggage('carryOn')}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{bk.carryOnBundle}</span>
                        <RadioDot checked={baggage === 'carryOn'} />
                      </div>
                      <div className="text-xs text-slate-500 mb-1">{bk.carryOnBundleSub}</div>
                      <div className="text-xs text-slate-400 font-mono">{bk.carryOnBundleDim}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-3">+€{CARRY_ON_PRICE}</div>
                    </OptionCard>
                  </div>
                </div>

                {/* checked baggage */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <SectionHeader
                    icon={<Briefcase className="w-4 h-4 text-blue-600" />}
                    title={bk.checkedBaggage}
                    sub={bk.checkedBaggageSub}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <OptionCard selected={!checkedBaggage} onClick={() => setCheckedBaggage(false)}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{bk.noCheckedBaggage}</span>
                        <RadioDot checked={!checkedBaggage} />
                      </div>
                      <div className="text-sm font-bold text-emerald-600">{bk.included}</div>
                    </OptionCard>

                    <OptionCard selected={checkedBaggage} onClick={() => setCheckedBaggage(true)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{bk.bag23kg}</span>
                        <RadioDot checked={checkedBaggage} />
                      </div>
                      <div className="text-xs text-slate-400 mb-3">{bk.bag23kgSub}</div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">+€{CHECKED_PRICE}</div>
                    </OptionCard>
                  </div>
                </div>

                {/* insurance */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <SectionHeader
                      icon={<Shield className="w-4 h-4 text-blue-600" />}
                      title={bk.travelInsurance}
                      sub={bk.insuranceSub}
                    />
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">{bk.insProvider}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        { type: 'none'  as InsuranceType, label: bk.noInsurance, price: 0,               features: [] },
                        { type: 'basic' as InsuranceType, label: bk.insBasic,    price: INS_BASIC_PRICE, features: [bk.medical, bk.cancellation, bk.assistance] },
                        { type: 'plus'  as InsuranceType, label: bk.insPlus,     price: INS_PLUS_PRICE,  features: [bk.medical, bk.cancellation, bk.assistance, bk.lostBaggage, bk.liability] },
                      ]
                    ).map(({ type, label, price, features }) => (
                      <OptionCard key={type} selected={insurance === type} onClick={() => setInsurance(type)}>
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{label}</span>
                          <RadioDot checked={insurance === type} />
                        </div>
                        {features.length === 0
                          ? <div className="text-xs text-slate-400 mb-3">{bk.noCoverage}</div>
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
                        <div className={`text-sm font-bold ${price === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {price === 0 ? bk.free : `+€${price}`}
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
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {bk.continue} <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <>
                {/* booking summary */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{bk.passengerAndExtras}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <SummaryRow label={bk.fullName}     value={`${firstName} ${lastName}`} />
                    <SummaryRow label={bk.gender}       value={gender} />
                    <SummaryRow label={bk.nationality}  value={nationality} />
                    <SummaryRow label={bk.dateOfBirth}  value={`${dobDay}/${dobMonth}/${dobYear}`} />
                    <SummaryRow label={bk.cabinBaggage} value={baggage === 'personal' ? `1× ${bk.personalItem}` : bk.carryOnBundle} />
                    <SummaryRow label={bk.checkedBag}   value={checkedBaggage ? '23 kg' : bk.insuranceNone} />
                    <SummaryRow label={bk.travelInsurance} value={insurance === 'none' ? bk.insuranceNone : insurance === 'basic' ? bk.insBasic : bk.insPlus} />
                  </div>
                </div>

                {/* contact */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <SectionHeader
                    icon={<Mail className="w-4 h-4 text-blue-600" />}
                    title={bk.contactDetails}
                    sub={bk.contactDetailsSub}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label={bk.email} required error={err('email')}>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch('email')}
                        placeholder="your@email.com" className={`${inputCls} ${err('email') ? '!border-red-400' : ''}`} />
                    </FormField>
                    <FormField label={bk.phone} required error={err('phone')}>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} onBlur={() => touch('phone')}
                        placeholder="+359 88 888 8888" className={`${inputCls} ${err('phone') ? '!border-red-400' : ''}`} />
                    </FormField>
                  </div>
                </div>

                {/* payment */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
                  <SectionHeader
                    icon={<CreditCard className="w-4 h-4 text-blue-600" />}
                    title={bk.payWithCard}
                    sub={bk.payWithCardSub}
                  />

                  {/* Google Pay — requires valid contact details */}
                  <div className={`mb-4 ${errors.email || errors.phone ? 'opacity-50 pointer-events-none' : ''}`}>
                    <GooglePayButton
                      environment="TEST"
                      paymentRequest={{
                        apiVersion: 2,
                        apiVersionMinor: 0,
                        allowedPaymentMethods: [{
                          type: 'CARD',
                          parameters: {
                            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                            allowedCardNetworks: ['MASTERCARD', 'VISA'],
                          },
                          tokenizationSpecification: {
                            type: 'PAYMENT_GATEWAY',
                            parameters: {
                              gateway: 'example',
                              gatewayMerchantId: 'exampleGatewayMerchantId',
                            },
                          },
                        }],
                        merchantInfo: {
                          merchantId: '12345678901234567890',
                          merchantName: 'SkyWave',
                        },
                        transactionInfo: {
                          totalPriceStatus: 'FINAL',
                          totalPriceLabel: 'Total',
                          totalPrice: grandTotal.toFixed(2),
                          currencyCode: 'EUR',
                          countryCode: 'BG',
                        },
                      }}
                      onLoadPaymentData={() => { handleGooglePay() }}
                      buttonSizeMode="fill"
                      buttonType="pay"
                      style={{ width: '100%', height: '40px' }}
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
                    <span className="text-xs text-slate-400">or pay by card</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
                  </div>

                  <div className="space-y-4">
                    <FormField label={bk.cardNumber} required error={err('cardNum')}>
                      <input
                        value={cardNum}
                        onChange={e => {
                          const raw = e.target.value.replace(/\D/g,'').slice(0,16)
                          setCardNum(raw.replace(/(.{4})/g,'$1 ').trim())
                        }}
                        onBlur={() => touch('cardNum')}
                        placeholder="1234 5678 9012 3456"
                        className={`${inputCls} font-mono tracking-widest ${err('cardNum') ? '!border-red-400' : ''}`}
                        maxLength={19}
                      />
                    </FormField>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={bk.expiry} required error={err('cardExpiry')}>
                        <input
                          value={cardExpiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g,'')
                            if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2,4)
                            setCardExpiry(v)
                          }}
                          onBlur={() => touch('cardExpiry')}
                          placeholder="MM/YY"
                          className={`${inputCls} font-mono ${err('cardExpiry') ? '!border-red-400' : ''}`}
                          maxLength={5}
                        />
                      </FormField>
                      <FormField label={bk.cvv} required error={err('cardCvv')}>
                        <input
                          value={cardCvv}
                          onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                          onBlur={() => touch('cardCvv')}
                          placeholder="···"
                          className={`${inputCls} font-mono ${err('cardCvv') ? '!border-red-400' : ''}`}
                          maxLength={4}
                        />
                      </FormField>
                    </div>

                    <FormField label={bk.nameOnCard} required error={err('cardName')}>
                      <input
                        value={cardName}
                        onChange={e => setCardName(e.target.value.toUpperCase())}
                        onBlur={() => touch('cardName')}
                        placeholder="HARRY J BROWN"
                        className={`${inputCls} uppercase tracking-wider font-mono ${err('cardName') ? '!border-red-400' : ''}`}
                      />
                    </FormField>

                    <div className="flex items-start gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-700 rounded-xl">
                      <Info className="w-4 h-4 text-slate-400 shrink-0 mt-px" />
                      <p className="text-xs text-slate-400 leading-relaxed">{bk.securityNote}</p>
                    </div>
                  </div>
                </div>

                {payError && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl text-sm text-red-600 dark:text-red-400">
                    <Info className="w-4 h-4 shrink-0" /> {payError}
                  </div>
                )}

                {/* pay button */}
                <button onClick={handlePay} disabled={!step2Valid || paying}
                  className={`w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2 transition-all ${
                    step2Valid && !paying
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg active:scale-[0.99]'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {paying
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {bk.processing}</>
                    : <>Pay €{Math.round(grandTotal)} <ChevronRight className="w-5 h-5" /></>
                  }
                </button>
              </>
            )}
          </div>

          {/* right sidebar */}
          <div className="hidden lg:block">
            <PriceSidebar />
          </div>
        </div>
      </div>
    </div>
  )
}
