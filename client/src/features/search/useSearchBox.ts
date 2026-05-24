import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { airportsApi, flightsApi } from '../../services/api'
import { POPULAR_COUNTRIES, toCountryName, toDateKey, flightsToAirports } from './searchUtils'
import type { Airport, FlightDto } from './types'
import type { TripType } from '../../types'

type Setter<T> = Dispatch<SetStateAction<T>>

interface PreviewDestination {
  city:     string
  code:     string
  name:     string
  minPrice: number
}

export interface SearchBoxState {
  tripType:     TripType
  isRoundTrip:  boolean
  flexDates:    boolean
  setFlexDates: Setter<boolean>

  fromAirport:    Airport | null
  setFromAirport: Setter<Airport | null>
  toAirport:      Airport | null
  setToAirport:   Setter<Airport | null>

  departure:     Date | null
  setDeparture:  Setter<Date | null>
  returnDate:    Date | null
  setReturnDate: Setter<Date | null>

  browseField:      'from' | 'to' | null
  browseCountry:    string | null
  setBrowseCountry: Setter<string | null>
  browseLoading:    boolean
  destLoading:      boolean

  allAirports:       Airport[]
  departureCodes:    Set<string>
  destAirports:      Airport[]
  destCodes:         Set<string>
  airportsByCountry: [string, Airport[]][]
  popularEntries:    [string, Airport[]][]
  otherEntries:      [string, Airport[]][]

  previewDestinations: PreviewDestination[]
  flightsByDate:       Map<string, number>

  fromCloseSignal: number
  toCloseSignal:   number

  swapAirports:         () => void
  handleTripTypeToggle: () => void
  handleBrowseSelect:   (airport: Airport) => void
  onFromBrowseOpen:     () => void
  onFromBrowseClose:    () => void
  onToBrowseOpen:       () => void
  onToBrowseClose:      () => void
}

export function useSearchBox(): SearchBoxState {
  const [tripType,    setTripType]    = useState<TripType>('roundTrip')
  const [flexDates,   setFlexDates]   = useState(true)
  const [fromAirport, setFromAirport] = useState<Airport | null>(null)
  const [toAirport,   setToAirport]   = useState<Airport | null>(null)
  const [departure,   setDeparture]   = useState<Date | null>(null)
  const [returnDate,  setReturnDate]  = useState<Date | null>(null)

  const [browseField,     setBrowseField]     = useState<'from' | 'to' | null>(null)
  const [browseCountry,   setBrowseCountry]   = useState<string | null>(null)
  const [allAirports,     setAllAirports]     = useState<Airport[]>([])
  const [browseLoading,   setBrowseLoading]   = useState(false)
  const [destFlights,     setDestFlights]     = useState<FlightDto[]>([])
  const [destLoading,     setDestLoading]     = useState(false)
  const [departureCodes,  setDepartureCodes]  = useState<Set<string>>(new Set())
  const [routeFlights,    setRouteFlights]    = useState<FlightDto[]>([])
  const [fromCloseSignal, setFromCloseSignal] = useState(0)
  const [toCloseSignal,   setToCloseSignal]   = useState(0)

  const hasFetched  = useRef(false)
  const isRoundTrip = tripType === 'roundTrip'

  useEffect(() => {
    flightsApi.search({ limit: 1000 })
      .then(flights => setDepartureCodes(new Set(flights.map(f => f.departureAirportCode))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!browseField || hasFetched.current) return
    hasFetched.current = true
    setBrowseLoading(true)
    airportsApi.getAll()
      .then(airports => setAllAirports(airports.filter(a => a.city?.trim())))
      .catch(() => setAllAirports([]))
      .finally(() => setBrowseLoading(false))
  }, [browseField])

  useEffect(() => {
    if (!fromAirport) { setDestFlights([]); return }
    const code = fromAirport.iataCode ?? fromAirport.icaoCode
    setDestLoading(true)
    flightsApi.search({ from: code, limit: 500 })
      .then(setDestFlights)
      .catch(() => setDestFlights([]))
      .finally(() => setDestLoading(false))
  }, [fromAirport])

  useEffect(() => {
    if (!fromAirport || !toAirport) { setRouteFlights([]); return }
    const from = fromAirport.iataCode ?? fromAirport.icaoCode
    const to   = toAirport.iataCode   ?? toAirport.icaoCode
    flightsApi.search({ from, to, limit: 500 })
      .then(setRouteFlights)
      .catch(() => setRouteFlights([]))
  }, [fromAirport, toAirport])

  const destAirports = useMemo(() =>
    flightsToAirports(destFlights).map(a => {
      const match = allAirports.find(x => (x.iataCode ?? x.icaoCode) === (a.iataCode ?? a.icaoCode))
      return match ? { ...a, country: match.country } : a
    })
  , [destFlights, allAirports])

  const destCodes = useMemo(() =>
    new Set(destAirports.map(a => a.iataCode ?? a.icaoCode))
  , [destAirports])

  const previewDestinations = useMemo<PreviewDestination[]>(() => {
    const map = new Map<string, PreviewDestination>()
    destFlights.forEach(f => {
      const existing = map.get(f.arrivalAirportCode)
      if (!existing || f.price < existing.minPrice) {
        map.set(f.arrivalAirportCode, {
          city:     f.arrivalCity,
          code:     f.arrivalAirportCode,
          name:     f.arrivalAirportName,
          minPrice: f.price,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.minPrice - b.minPrice)
  }, [destFlights])

  const flightsByDate = useMemo(() => {
    const map = new Map<string, number>()
    routeFlights.forEach(f => {
      if (!f.departureTime) return
      const key = toDateKey(new Date(f.departureTime))
      const cur = map.get(key)
      if (cur === undefined || f.price < cur) map.set(key, f.price)
    })
    return map
  }, [routeFlights])

  const airportsByCountry = useMemo(() => {
    const map = new Map<string, Airport[]>()
    allAirports.forEach(a => {
      const key  = a.country || 'Other'
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => toCountryName(a).localeCompare(toCountryName(b)))
  }, [allAirports])

  const popularEntries = useMemo(() =>
    airportsByCountry
      .filter(([c]) => POPULAR_COUNTRIES.includes(c))
      .sort(([a], [b]) => toCountryName(a).localeCompare(toCountryName(b)))
  , [airportsByCountry])

  const otherEntries = useMemo(() =>
    airportsByCountry.filter(([c]) => !POPULAR_COUNTRIES.includes(c))
  , [airportsByCountry])

  const swapAirports = useCallback(() => {
    setFromAirport(toAirport)
    setToAirport(fromAirport)
  }, [fromAirport, toAirport])

  const handleTripTypeToggle = useCallback(() => {
    if (isRoundTrip) setReturnDate(null)
    setTripType(prev => prev === 'oneWay' ? 'roundTrip' : 'oneWay')
  }, [isRoundTrip])

  const onFromBrowseOpen  = useCallback(() => { setBrowseField('from'); setBrowseCountry(null) }, [])
  const onFromBrowseClose = useCallback(() => setBrowseField(f => f === 'from' ? null : f), [])
  const onToBrowseOpen    = useCallback(() => { setBrowseField('to');   setBrowseCountry(null) }, [])
  const onToBrowseClose   = useCallback(() => setBrowseField(f => f === 'to'   ? null : f), [])

  const handleBrowseSelect = useCallback((airport: Airport) => {
    if (browseField === 'from') {
      setFromAirport(airport)
      setToAirport(null)
      setFromCloseSignal(s => s + 1)
    } else {
      setToAirport(airport)
      setToCloseSignal(s => s + 1)
    }
    setBrowseField(null)
  }, [browseField])

  return {
    tripType, isRoundTrip,
    flexDates, setFlexDates,
    fromAirport, setFromAirport,
    toAirport,   setToAirport,
    departure,   setDeparture,
    returnDate,  setReturnDate,
    browseField,
    browseCountry, setBrowseCountry,
    browseLoading, destLoading,
    allAirports,   departureCodes,
    destAirports,  destCodes,
    previewDestinations,
    flightsByDate,
    airportsByCountry, popularEntries, otherEntries,
    fromCloseSignal,   toCloseSignal,
    swapAirports,
    handleTripTypeToggle,
    handleBrowseSelect,
    onFromBrowseOpen,  onFromBrowseClose,
    onToBrowseOpen,    onToBrowseClose,
  }
}
