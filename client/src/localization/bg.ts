import type { LocaleSchema } from './en'

export const bg: LocaleSchema = {
  navbar: {
    brand:      'SkyWave',
    links:      ['Полети', 'Хотели', 'Оферти', 'Пътешественици', 'Моите резервации'],
    activeLink: 'Полети',
    language:   'BG',
    signIn:     'Вход',
  },

  hero: {
    tagline: '✦ Твоето пътешествие започва тук',
    headline: { line1: 'Светът е', accent: 'по-близо', line2: 'отколкото мислиш' },
    subtitle: 'Умно търсене. Най-добрите сделки. Незабравими преживявания.',
  },

  search: {
    tabs:       { flights: 'Полети', hotels: 'Хотели', cars: 'Коли' },
    tripType:   'В една посока',
    roundTrip:  'Отиване и връщане',
    oneWay:     'В една посока',
    passengers: '1 Пътник',
    fields: {
      from:      { label: 'От',         value: 'София',       sub: 'SOF'       },
      to:        { label: 'До',         value: 'Навсякъде',   sub: 'Навсякъде' },
      departure: { label: 'Заминаване', value: '12 Юни, Чет'                   },
      return:    { label: 'Връщане',    value: 'Добави дата'                   },
    },
    filters:             ['Цена', 'Най-добро време', 'Директни полети', 'Багаж', 'Авиолинии'],
    flexibleDates:       'Гъвкави дати',
    from:                'от',
    noFlights:           'Няма намерени полети от това летище.',
    flightsFromAllDates: 'Полети от {city} — всички дати',
  },

  browse: {
    loading:            'Зареждане на летища…',
    originCountry:      'Страна на заминаване',
    destinationCountry: 'Страна на пристигане',
    flightsFrom:        'Полети от {city}',
    popular:            'Популярни',
    allCountries:       'Всички страни',
    pickAirport:        'Изберете летище',
    selectCountry:      'Изберете страна, за да видите летища',
    clear:              'Изчисти',
  },

  aiCopilot: {
    label:    'AI Умен Скорер Ко-Пилот',
    subtitle: 'Анализира въведеното — персонализирани резултати очаквайте',
    status:   'Оценява на живо',
    chat: {
      title:        'SkyWave AI',
      greeting:     'Здравей, {name}! Аз съм SkyWave AI. Попитай ме за полети, цени или резервации.',
      placeholder:  'Питай за полети, цени, дестинации…',
      send:         'Изпрати',
      errorMessage: 'Нещо се обърка. Моля, опитай отново.',
      emptyState:   'Няма съобщения. Кажи здравей!',
      suggestions:  [
        'Намери ми най-умните полети от София',
        'Покажи последните ми резервации',
        'Какви са най-евтините полети до Лондон?',
      ],
    },
  },

  stats: {
    countries: { value: '12', label: 'Посетени страни' },
    co2: { value: '350', unit: 'кг', label: 'CO₂ Отпечатък' },
    ecoRating: { value: '9.2', sub: 'Най-добра стойност', label: 'Еко оценка' },
  },

  guarantees: [
    { title: 'Гаранция за най-ниска цена', sub: 'Намираме най-евтините тарифи' },
    { title: 'Гъвкаво резервиране', sub: 'Промени или откажи лесно' },
    { title: 'Поддръжка 24/7', sub: 'Тук сме за теб по всяко време' },
    { title: 'Доверен от милиони', sub: 'Присъедини се към щастливи пътници' },
  ],

  socialFeed: { label: 'Социална активност на приятели' },

  destinations: {
    title: 'Популярни дестинации',
    subtitle: 'Харесвани места сред пътниците',
    from: 'от',
    currency: '€',
  },
}
