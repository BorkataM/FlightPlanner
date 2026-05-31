import type { Airport, FlightDto } from './types'

const CYRILLIC: Record<string, string> = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p',
  'р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch',
  'ш':'sh','щ':'sht','ъ':'a','ь':'','ю':'yu','я':'ya',
}

// Cities where transliteration alone doesn't match the English DB name
const BG_CITY_MAP: Record<string, string> = {
  'софия':'sofia','пловдив':'plovdiv','варна':'varna','бургас':'burgas',
  'горна оряховица':'gorna oryahovitsa',
  'лондон':'london','париж':'paris','рим':'rome','виена':'vienna',
  'прага':'prague','будапеща':'budapest','варшава':'warsaw',
  'истанбул':'istanbul','дубай':'dubai','амстердам':'amsterdam',
  'копенхаген':'copenhagen','осло':'oslo','стокхолм':'stockholm',
  'франкфурт':'frankfurt','берлин':'berlin','мюнхен':'munich',
  'цюрих':'zurich','брюксел':'brussels','дъблин':'dublin',
  'атина':'athens','лисабон':'lisbon','барселона':'barcelona',
  'мадрид':'madrid','милано':'milan','ница':'nice','рейкявик':'reykjavik',
  'хелзинки':'helsinki','рига':'riga','вилнюс':'vilnius','талин':'tallinn',
  'загреб':'zagreb','букурещ':'bucharest','белград':'belgrade',
  'скопие':'skopje','тирана':'tirana','солун':'thessaloniki',
  'кайро':'cairo','тел авив':'tel aviv','москва':'moscow','токио':'tokyo',
}

export function normalizeAirportQuery(q: string): string {
  const lower = q.toLowerCase().trim()
  if (!lower) return lower
  if (BG_CITY_MAP[lower]) return BG_CITY_MAP[lower]
  return lower.split('').map(c => CYRILLIC[c] ?? c).join('')
}

export const POPULAR_COUNTRIES = [
  'GR', 'ES', 'IT', 'TR', 'FR', 'GB',
  'DE', 'PT', 'NL', 'HR', 'AT', 'CZ',
  'AE', 'US', 'TH',
]

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })

export function toCountryName(code: string): string {
  if (!code || code.length !== 2) return code
  try { return regionNames.of(code.toUpperCase()) ?? code }
  catch { return code }
}

export function toDateKey(d: Date): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function flightsToAirports(flights: FlightDto[]): Airport[] {
  const seen = new Set<string>()
  return flights.reduce<Airport[]>((acc, f) => {
    if (!seen.has(f.arrivalAirportCode)) {
      seen.add(f.arrivalAirportCode)
      acc.push({
        icaoCode: f.arrivalAirportCode,
        iataCode: f.arrivalAirportCode,
        name:     f.arrivalAirportName,
        city:     f.arrivalCity,
        country:  '',
      })
    }
    return acc
  }, [])
}
