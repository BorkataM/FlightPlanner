import type { Destination } from '../../features/destinations/types'
import { IMAGES } from '../images'

export const DESTINATIONS: Destination[] = [
  { name: 'Bali',     country: 'Indonesia', price: '843', image: IMAGES.destinations.bali,    gradient: 'from-amber-900 via-orange-800 to-yellow-900', smartScore: 94, tag: 'bestValue', liked: false },
  { name: 'New York', country: 'USA',       price: '765', image: IMAGES.destinations.newYork, gradient: 'from-slate-800 via-blue-900 to-indigo-900',   smartScore: 81, tag: null,        liked: false },
  { name: 'Tokyo',    country: 'Japan',     price: '912', image: IMAGES.destinations.tokyo,   gradient: 'from-rose-900 via-pink-800 to-rose-900',      smartScore: 88, tag: 'eco',       liked: false },
]
