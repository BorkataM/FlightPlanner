import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DESTINATIONS } from '../../assets/data/destinations'
import { useLocale } from '../../context/LocaleContext'
import DestCard from './DestCard'

const VISIBLE = 4

export default function PopularDestinations() {
  const { t } = useLocale()
  const [cards, setCards] = useState(DESTINATIONS)
  const [offset, setOffset] = useState(0)
  const maxOffset = cards.length - VISIBLE

  const toggleLike = (idx: number) =>
    setCards(prev => prev.map((d, i) => (i === idx ? { ...d, liked: !d.liked } : d)))

  return (
    <section className="py-14 border-b border-blue-100" style={{ background: '#FFFFFF' }}>
      <div className="max-w-[1280px] mx-auto px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-indigo-500 mb-2">{t.destinations.subtitle}</div>
            <h2 className="text-3xl font-extrabold text-slate-900">{t.destinations.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setOffset(Math.min(maxOffset, offset + 1))} disabled={offset >= maxOffset}
              className="w-9 h-9 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-400 disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-hidden">
          <div className="flex gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${offset} * (14rem + 1rem)))` }}>
            {cards.map((dest, i) => (
              <DestCard key={dest.name} dest={dest} currency={t.destinations.currency} fromLabel={t.destinations.from} onToggleLike={() => toggleLike(i)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
