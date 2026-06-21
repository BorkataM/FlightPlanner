// Airline logos: the flight number is prefixed with the airline's ICAO code
// (e.g. "WZZ1649" → WZZ). Logo CDNs key off the 2-letter IATA code, so we map
// ICAO → IATA for the airlines in our dataset, then build a free Kiwi.com logo
// URL (no API key required). Unknown airlines fall back to an initials badge.

const ICAO_TO_IATA: Record<string, string> = {
  LZB: 'FB', BGH: '8H', THY: 'TK', DLH: 'LH', BAW: 'BA', EZY: 'U2',
  EJU: 'U2', RYR: 'FR', WZZ: 'W6', AFR: 'AF', KLM: 'KL', TVF: 'TO',
  PGT: 'PC', SAS: 'SK', LOT: 'LO', AUA: 'OS', SWR: 'LX', AAL: 'AA',
  DAL: 'DL', UAL: 'UA', ACA: 'AC', UAE: 'EK', QTR: 'QR', ETD: 'EY',
  SIA: 'SQ', CPA: 'CX', JAL: 'JL', ANA: 'NH', KAL: 'KE', QFA: 'QF',
  ANZ: 'NZ', THA: 'TG', MAS: 'MH', AIC: 'AI', CCA: 'CA', CSN: 'CZ',
  LAN: 'LA', AMX: 'AM', AVA: 'AV', GLO: 'G3', ARG: 'AR', SWA: 'WN',
  JBU: 'B6', WJA: 'WS', VIR: 'VS',
}

export function airlineIata(flightNumber: string): string | null {
  const icao = flightNumber.match(/^[A-Za-z]+/)?.[0]?.toUpperCase()
  return icao ? ICAO_TO_IATA[icao] ?? null : null
}

export function airlineLogoUrl(flightNumber: string): string | null {
  const iata = airlineIata(flightNumber)
  return iata ? `https://images.kiwi.com/airlines/128/${iata}.png` : null
}
