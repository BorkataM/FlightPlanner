export interface LocaleSchema {
  navbar: {
    brand:      string
    links:      readonly string[]
    activeLink: string
    currency:   string
    language:   string
    signIn:     string
  }
  hero: {
    tagline:  string
    headline: { line1: string; accent: string; line2: string }
    subtitle: string
  }
  search: {
    tabs:         { flights: string; hotels: string; cars: string }
    tripType:     string
    passengers:   string
    fields: {
      from:      { label: string; value: string; sub: string }
      to:        { label: string; value: string; sub: string }
      departure: { label: string; value: string }
      return:    { label: string; value: string }
    }
    filters:      readonly string[]
    flexibleDates: string
  }
  aiCopilot: {
    label:    string
    subtitle: string
    status:   string
  }
  stats: {
    countries: { value: string; label: string }
    co2:       { value: string; unit: string; label: string }
    ecoRating: { value: string; sub: string; label: string }
  }
  guarantees: readonly { title: string; sub: string }[]
  socialFeed: { label: string }
  destinations: {
    title:    string
    subtitle: string
    from:     string
    currency: string
  }
}

export const en: LocaleSchema = {
  navbar: {
    brand:      'SkyWave',
    links:      ['Flights', 'Hotels', 'Offers', 'Explore', 'Travel Guide'],
    activeLink: 'Flights',
    currency:   'BGN',
    language:   'EN',
    signIn:     'Sign in',
  },

  hero: {
    tagline:  '✦ Your journey starts here',
    headline: { line1: 'The world is', accent: 'closer', line2: 'than you think' },
    subtitle: 'Smart search. Best deals. Unforgettable experiences.',
  },

  search: {
    tabs:       { flights: 'Flights', hotels: 'Hotels', cars: 'Cars' },
    tripType:   'One way',
    passengers: '1 Passenger',
    fields: {
      from:      { label: 'From',      value: 'Sofia',     sub: 'SOF'        },
      to:        { label: 'To',        value: 'Anywhere',  sub: 'Everywhere' },
      departure: { label: 'Departure', value: '12 Jun, Thu'                  },
      return:    { label: 'Return',    value: 'Add date'                     },
    },
    filters:      ['Price', 'Best time to fly', 'Direct flights', 'Baggage', 'Airlines'],
    flexibleDates: 'Flexible dates',
  },

  aiCopilot: {
    label:    'AI Smart Scorer Co-Pilot',
    subtitle: 'Analyzing your inputs — personalized smart results incoming',
    status:   'Scoring live',
  },

  stats: {
    countries: { value: '12',  label: 'Countries Visited' },
    co2:       { value: '350', unit: 'kg', label: 'CO₂ Footprint' },
    ecoRating: { value: '9.2', sub: 'Best Value', label: 'Eco Rating' },
  },

  guarantees: [
    { title: 'Best Price Guarantee', sub: 'We match the lowest fares'       },
    { title: 'Flexible Booking',     sub: 'Change or cancel with ease'       },
    { title: '24/7 Support',         sub: "We're here for you anytime"       },
    { title: 'Trusted by Millions',  sub: 'Join happy travelers worldwide'   },
  ],

  socialFeed: { label: "Live Social Feed — Friends' Activity" },

  destinations: {
    title:    'Popular destinations',
    subtitle: 'Trending places loved by travelers',
    from:     'from',
    currency: '€',
  },
}

export type Locale = LocaleSchema
