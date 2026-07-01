export interface LocaleSchema {
  navbar: {
    brand:      string
    links:      readonly string[]
    activeLink: string
    language:   string
    signIn:     string
  }
  hero: {
    tagline:  string
    headline: { line1: string; accent: string; line2: string }
    subtitle: string
  }
  mobileApp: {
    badge:    string
    title:    string
    subtitle: string
    comingSoon: string
    emailPlaceholder: string
    thanks:   string
    invalidEmail: string
  }
  search: {
    tabs:         { flights: string; hotels: string; cars: string }
    tripType:     string
    roundTrip:    string
    oneWay:       string
    passengers:   string
    fields: {
      from:      { label: string; value: string; sub: string }
      to:        { label: string; value: string; sub: string }
      departure: { label: string; value: string }
      return:    { label: string; value: string }
    }
    filters:           readonly string[]
    flexibleDates:     string
    from:              string
    noFlights:         string
    flightsFromAllDates: string
  }
  browse: {
    loading:            string
    originCountry:      string
    destinationCountry: string
    flightsFrom:        string
    popular:            string
    allCountries:       string
    pickAirport:        string
    selectCountry:      string
    clear:              string
  }
  aiCopilot: {
    label:    string
    subtitle: string
    status:   string
    chat: {
      title:        string
      greeting:     string
      placeholder:  string
      send:         string
      errorMessage: string
      emptyState:   string
      suggestions:  readonly string[]
    }
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
  searchResults: {
    modifySearch:      string
    roundTrip:         string
    oneWay:            string
    allDates:          string
    fromPrice:         string
    returnLabel:       string
    noReturnFlights:   string
    sort: { cheapest: string; fastest: string; best: string }
    result:            string
    results:           string
    searching:         string
    noFlightsFound:    string
    tryDifferentDates: string
    direct:            string
    stop:              string
    stops:             string
    totalBothLegs:     string
    outboundOnly:      string
    perPerson:         string
    select:            string
    outbound:          string
    return:            string
  }
  booking: {
    noFlightSelected:    string
    backToSearch:        string
    back:                string
    results:             string
    stepOf:              string
    step1Label:          string
    step2Label:          string
    tripSummary:         string
    direct:              string
    stop:                string
    primaryPassenger:    string
    passengerSub:        string
    useMyDetails:        string
    useMyDetailsHint:    string
    useMyDetailsHintFull: string
    filledFromProfile:   string
    givenNames:          string
    surnames:            string
    nationality:         string
    gender:              string
    dateOfBirth:         string
    selectCountry:       string
    selectGender:        string
    male:                string
    female:              string
    other:               string
    month:               string
    cabinBaggage:        string
    cabinBaggageSub:     string
    personalItem:        string
    personalItemSub:     string
    personalItemDim:     string
    included:            string
    carryOnBundle:       string
    carryOnBundleSub:    string
    carryOnBundleDim:    string
    checkedBaggage:      string
    checkedBaggageSub:   string
    noCheckedBaggage:    string
    bag23kg:             string
    bag23kgSub:          string
    travelInsurance:     string
    insuranceSub:        string
    insProvider:         string
    noInsurance:         string
    noCoverage:          string
    insBasic:            string
    insPlus:             string
    medical:             string
    cancellation:        string
    assistance:          string
    lostBaggage:         string
    liability:           string
    free:                string
    continue:            string
    passengerAndExtras:  string
    fullName:            string
    checkedBag:          string
    insuranceNone:       string
    contactDetails:      string
    contactDetailsSub:   string
    email:               string
    phone:               string
    payWithCard:         string
    payWithCardSub:      string
    cardNumber:          string
    expiry:              string
    cvv:                 string
    nameOnCard:          string
    securityNote:        string
    processing:          string
    priceSummary:        string
    adultRoundTrip:      string
    adultOneWay:         string
    total:               string
    taxesNote:           string
    yourFlights:         string
    bookingConfirmed:    string
    bookingConfirmedSub: string
    bookingReference:    string
    passenger:           string
    route:               string
    totalPaid:           string
    andBack:             string
    viewBoardingPass:    string
    signInTitle:         string
    signInSub:           string
    goToHomepage:        string
    outbound:            string
    return:              string
  }
  myBookings: {
    home:            string
    nextFlight:      string
    days:            string
    hrs:             string
    min:             string
    untilDeparture:  string
    departingNow:    string
    departure:       string
    flight:          string
    bookingRef:      string
    noUpcomingTrips: string
    summary:         string
    upcoming:        string
    pastTrips:       string
    total:           string
    allTrips:        string
    sortFlight:      string
    sortBought:      string
    roundTrip:       string
    oneWay:          string
    showBoardingPass:string
    ref:             string
    flightConditions:string
    getToAirport:    string
    outbound:        string
    return:          string
    nonStop:         string
    noBookings:      string
    noBookingsSub:   string
    searchFlights:   string
    signIn:          string
    signInSub:       string
    goToHomepage:    string
    loading:         string
  }
  boardingPass: {
    back:     string
    print:    string
    title:    string
    bookingRef: string
    paid:     string
    noData:   string
    goHome:   string
  }
  travelers: {
    searchPlaceholder:   string
    suggestedTravelers:  string
    noTravelersFound:    string
    noTravelersYet:      string
    follow:              string
    following:           string
    close:               string
    flight:              string
    flights:             string
    yourJourney:         string
    ofTheWorld:          string
    keepExploring:       string
    topCountries:        string
    viewAll:             string
    flightsTotal:        string
    countriesVisited:    string
    followersLabel:      string
    followingLabel:      string
    people:              string
    travelersLabel:      string
    followersTitle:      string
    followingTitle:      string
    editProfile:         string
    allVisitedCountries: string
    noCountriesVisited:  string
  }
}

export const en: LocaleSchema = {
  navbar: {
    brand:      'SkyWave',
    links:      ['Flights', 'Hotels', 'Travelers', 'My Bookings'],
    activeLink: 'Flights',
    language:   'EN',
    signIn:     'Sign in',
  },

  hero: {
    tagline:  '✦ Your journey starts here',
    headline: { line1: 'The world is', accent: 'closer', line2: 'than you think' },
    subtitle: 'Smart search. Best deals. Unforgettable experiences.',
  },

  mobileApp: {
    badge:      'Coming soon',
    title:      'SkyWave for mobile',
    subtitle:   'Book flights, track trips and get smart deal alerts - right from your pocket. The iOS and Android apps are on their way.',
    comingSoon: 'Notify me',
    emailPlaceholder: 'Enter your email',
    thanks:     "Thanks! We'll email you the moment the app launches.",
    invalidEmail: 'Please enter a valid email address.',
  },

  search: {
    tabs:       { flights: 'Flights', hotels: 'Hotels', cars: 'Cars' },
    tripType:   'One way',
    roundTrip:  'Round trip',
    oneWay:     'One way',
    passengers: '1 Passenger',
    fields: {
      from:      { label: 'From',      value: 'Sofia',     sub: 'SOF'        },
      to:        { label: 'To',        value: 'Anywhere',  sub: 'Everywhere' },
      departure: { label: 'Departure', value: '12 Jun, Thu'                  },
      return:    { label: 'Return',    value: 'Add date'                     },
    },
    filters:             ['Price', 'Best time to fly', 'Direct flights', 'Baggage', 'Airlines'],
    flexibleDates:       'Flexible dates',
    from:                'from',
    noFlights:           'No flights found from this airport.',
    flightsFromAllDates: 'Flights from {city} - all dates',
  },

  browse: {
    loading:            'Loading airports…',
    originCountry:      'Origin country',
    destinationCountry: 'Destination country',
    flightsFrom:        'Flights from {city}',
    popular:            'Popular',
    allCountries:       'All countries',
    pickAirport:        'Pick an airport',
    selectCountry:      'Select a country to see airports',
    clear:              'Clear',
  },

  aiCopilot: {
    label:    'AI Smart Scorer Co-Pilot',
    subtitle: 'Analyzing your inputs - personalized smart results incoming',
    status:   'Scoring live',
    chat: {
      title:        'SkyWave AI',
      greeting:     "Hi {name}! I'm SkyWave AI. Ask me to find flights, compare options, or check your bookings.",
      placeholder:  'Ask about flights, prices, destinations…',
      send:         'Send',
      errorMessage: 'Something went wrong. Please try again.',
      emptyState:   'No messages yet. Say hello!',
      suggestions:  [
        'Find me the smartest flights from Sofia',
        'Show my recent bookings',
        'What are the cheapest flights to London?',
      ],
    },
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

  socialFeed: { label: "Live Social Feed - Friends' Activity" },

  destinations: {
    title:    'Popular destinations',
    subtitle: 'Trending places loved by travelers',
    from:     'from',
    currency: '€',
  },

  searchResults: {
    modifySearch:      'Modify search',
    roundTrip:         'Round trip',
    oneWay:            'One way',
    allDates:          'All dates',
    fromPrice:         'from',
    returnLabel:       'Return',
    noReturnFlights:   'No return flights found for {route}. Showing outbound prices only.',
    sort: { cheapest: 'Cheapest', fastest: 'Fastest', best: 'Best' },
    result:            'result',
    results:           'results',
    searching:         'Searching flights…',
    noFlightsFound:    'No flights found',
    tryDifferentDates: 'Try different dates or tap "All dates"',
    direct:            'Direct',
    stop:              'stop',
    stops:             'stops',
    totalBothLegs:     'total · both legs',
    outboundOnly:      'outbound only',
    perPerson:         'per person',
    select:            'Select',
    outbound:          'Outbound',
    return:            'Return',
  },

  booking: {
    noFlightSelected:    'No flight selected.',
    backToSearch:        'Back to search',
    back:                'Back',
    results:             'Results',
    stepOf:              'Step {step} of 2',
    step1Label:          'Passenger & Extras',
    step2Label:          'Overview & Payment',
    tripSummary:         'Trip summary',
    direct:              'Direct',
    stop:                'stop',
    primaryPassenger:    'Primary Passenger',
    passengerSub:        'Enter details exactly as in your passport / ID',
    useMyDetails:        'Use my details',
    useMyDetailsHint:    'Fill the name from your profile',
    useMyDetailsHintFull: 'Fill all passenger details from your saved info',
    filledFromProfile:   'Filled from your details',
    givenNames:          'Given names',
    surnames:            'Surnames',
    nationality:         'Nationality',
    gender:              'Gender',
    dateOfBirth:         'Date of birth',
    selectCountry:       'Select country',
    selectGender:        'Select',
    male:                'Male',
    female:              'Female',
    other:               'Other / prefer not to say',
    month:               'Month',
    cabinBaggage:        'Cabin Baggage',
    cabinBaggageSub:     'Select one option',
    personalItem:        'Personal item',
    personalItemSub:     'Must fit under front seat',
    personalItemDim:     '20 × 30 × 40 cm',
    included:            'Included',
    carryOnBundle:       'Carry-on bundle',
    carryOnBundleSub:    'Personal item + cabin bag + priority boarding',
    carryOnBundleDim:    'up to 20 kg',
    checkedBaggage:      'Checked Baggage',
    checkedBaggageSub:   'Large luggage stored in the hold',
    noCheckedBaggage:    'No checked baggage',
    bag23kg:             '23 kg bag',
    bag23kgSub:          'Max 23 kg · hard or soft case',
    travelInsurance:     'Travel Insurance',
    insuranceSub:        'Protect your trip',
    insProvider:         'by AXA Assistance',
    noInsurance:         'No insurance',
    noCoverage:          'No coverage included',
    insBasic:            'Travel Basic',
    insPlus:             'Travel Plus',
    medical:             'Medical expenses',
    cancellation:        'Trip cancellation',
    assistance:          'Assistance',
    lostBaggage:         'Lost baggage',
    liability:           'Liability',
    free:                'Free',
    continue:            'Continue',
    passengerAndExtras:  'Passenger & extras',
    fullName:            'Full name',
    checkedBag:          'Checked bag',
    insuranceNone:       'None',
    contactDetails:      'Contact Details',
    contactDetailsSub:   "We'll send your booking confirmation here",
    email:               'Email',
    phone:               'Phone number',
    payWithCard:         'Pay with Card',
    payWithCardSub:      'All major cards accepted',
    cardNumber:          'Card number',
    expiry:              'Expiry (MM/YY)',
    cvv:                 'CVV',
    nameOnCard:          'Name on card',
    securityNote:        'Your payment is secured with 256-bit SSL encryption. By paying you agree to our Terms & Conditions.',
    processing:          'Processing…',
    priceSummary:        'Price summary',
    adultRoundTrip:      '1× Adult (round trip)',
    adultOneWay:         '1× Adult (one way)',
    total:               'Total',
    taxesNote:           'Including all taxes and fees',
    yourFlights:         'Your flights',
    bookingConfirmed:    'Booking Confirmed!',
    bookingConfirmedSub: 'Your trip to {city} is all set.',
    bookingReference:    'Booking reference',
    passenger:           'Passenger',
    route:               'Route',
    totalPaid:           'Total paid',
    andBack:             'and back',
    viewBoardingPass:    'View Boarding Pass',
    signInTitle:         'Sign in to see your bookings',
    signInSub:           'Your trip history is linked to your account.',
    goToHomepage:        'Go to homepage',
    outbound:            'Outbound',
    return:              'Return',
  },

  myBookings: {
    home:             'Home',
    nextFlight:       'Next Flight',
    days:             'Days',
    hrs:              'Hrs',
    min:              'Min',
    untilDeparture:   'until departure',
    departingNow:     'Departing now!',
    departure:        'Departure',
    flight:           'Flight',
    bookingRef:       'Booking ref',
    noUpcomingTrips:  'No upcoming trips',
    summary:          'Summary',
    upcoming:         'Upcoming',
    pastTrips:        'Past trips',
    total:            'Total',
    allTrips:         'All Trips',
    sortFlight:       'Flight',
    sortBought:       'Bought',
    roundTrip:        'Round Trip',
    oneWay:           'One Way',
    showBoardingPass: 'Show boarding pass',
    ref:              'Ref',
    flightConditions: 'Flight Conditions',
    getToAirport:     'Get to Airport',
    outbound:         'Outbound',
    return:           'Return',
    nonStop:          'Non-stop',
    noBookings:       'No bookings yet',
    noBookingsSub:    'Once you book a flight it will appear here.',
    searchFlights:    'Search flights',
    signIn:           'Sign in to see your bookings',
    signInSub:        'Your trip history is linked to your account.',
    goToHomepage:     'Go to homepage',
    loading:          'Loading your bookings…',
  },

  boardingPass: {
    back:       'Back',
    print:      'Print',
    title:      'Your Boarding Pass',
    bookingRef: 'Booking reference:',
    paid:       'paid',
    noData:     'No boarding pass data found.',
    goHome:     'Go home',
  },

  travelers: {
    searchPlaceholder:   'Search travelers by name or email…',
    suggestedTravelers:  'Suggested Travelers',
    noTravelersFound:    'No travelers found',
    noTravelersYet:      'No other travelers yet',
    follow:              'Follow',
    following:           'Following',
    close:               'Close',
    flight:              'flight',
    flights:             'flights',
    yourJourney:         'Your Journey',
    ofTheWorld:          'OF THE WORLD',
    keepExploring:       "Keep exploring! You've got a whole world to discover.",
    topCountries:        'Top Countries',
    viewAll:             'View all',
    flightsTotal:        'Total taken',
    countriesVisited:    'Visited',
    followersLabel:      'People',
    followingLabel:      'Travelers',
    travelersLabel:      'Travelers',
    followersTitle:      'Followers',
    followingTitle:      'Following',
    editProfile:         'Edit Profile',
    allVisitedCountries: 'All Visited Countries',
    noCountriesVisited:  'No countries visited yet.',
    people:              'People',
  },
}

export type Locale = LocaleSchema
