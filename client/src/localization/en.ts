export const en = {
  navbar: {
    brand: 'SkyWave',
    links: ['Flights', 'Hotels', 'Offers', 'Explore', 'Travel Guide'] as const,
    activeLink: 'Flights',
    currency: 'BGN',
    language: 'EN',
    signIn: 'Sign in',
  },

  hero: {
    tagline: '✦ Your journey starts here',
    headline: {
      line1: 'The world is',
      accent: 'closer',
      line2: 'than you think',
    },
    subtitle: 'Smart search. Best deals. Unforgettable experiences.',
  },

  search: {
    tabs: { flights: 'Flights', hotels: 'Hotels', cars: 'Cars' },
    tripType: 'One way',
    passengers: '1 Passenger',
    fields: {
      from: { label: 'From', value: 'Sofia', sub: 'SOF' },
      to:   { label: 'To',   value: 'Anywhere', sub: 'Everywhere' },
      departure: { label: 'Departure', value: '12 Jun, Thu' },
      return:    { label: 'Return',    value: 'Add date' },
    },
    filters: ['Price', 'Best time to fly', 'Direct flights', 'Baggage', 'Airlines'] as const,
    flexibleDates: 'Flexible dates',
  },

  aiCopilot: {
    label: 'AI Smart Scorer Co-Pilot',
    subtitle: 'Analyzing your inputs — personalized smart results incoming',
    status: 'Scoring live',
  },

  stats: {
    countries:  { value: '12',  label: 'Countries Visited' },
    co2:        { value: '350', unit: 'kg', label: 'CO₂ Footprint' },
    ecoRating:  { value: '9.2', sub: 'Best Value', label: 'Eco Rating' },
  },

  guarantees: [
    { title: 'Best Price Guarantee', sub: 'We match the lowest fares' },
    { title: 'Flexible Booking',     sub: 'Change or cancel with ease' },
    { title: '24/7 Support',         sub: "We're here for you anytime" },
    { title: 'Trusted by Millions',  sub: 'Join happy travelers worldwide' },
  ],

  socialFeed: {
    label: "Live Social Feed — Friends' Activity",
  },

  destinations: {
    title:    'Popular destinations',
    subtitle: 'Trending places loved by travelers',
    from:     'from',
    currency: 'BGN',
  },
}

export type Locale = typeof en
