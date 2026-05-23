import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DESTINATIONS } from '../../assets/data/destinations'
import { en } from '../../localization/en'
import DestCard from './DestCard'

const t = en.destinations
const VISIBLE = 4

export default function PopularDestinations() {
  const [cards, setCards] = useState(DESTINATIONS)
  const [offset, setOffset] = useState(0)
  const maxOffset = cards.length - VISIBLE

  const toggleLike = (idx: number) =>
    setCards(prev => prev.map((d, i) => (i === idx ? { ...d, liked: !d.liked } : d)))

  return (
    <section className="py-14 border-b border-white/[0.10]" style={{ background: 'rgba(10,22,44,0.98)' }}>
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.title}</h2>
            <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0}
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setOffset(Math.min(maxOffset, offset + 1))} disabled={offset >= maxOffset}
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${offset} * (14rem + 1rem)))` }}>
            {cards.map((dest, i) => (
              <DestCard key={dest.name} dest={dest} currency={t.currency} fromLabel={t.from} onToggleLike={() => toggleLike(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
