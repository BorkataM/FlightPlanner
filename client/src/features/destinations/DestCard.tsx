import { Heart } from 'lucide-react'
import type { Destination } from './types'
import SmartScoreBadge from './SmartScoreBadge'

interface Props {
  dest:         Destination
  currency:     string
  fromLabel:    string
  onToggleLike: () => void
}

export default function DestCard({ dest, currency, fromLabel, onToggleLike }: Props) {
  return (
    <div className="relative flex-shrink-0 w-56 rounded-2xl overflow-hidden cursor-pointer group">

      <div
        className={`absolute inset-0 bg-cover bg-center bg-gradient-to-b ${dest.gradient}`}
        style={{ backgroundImage: dest.image ? `url('${dest.image}')` : undefined }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10 group-hover:from-black/70 transition-all" />

      <button
        onClick={onToggleLike}
        className="heart-btn absolute top-3 right-3 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110"
      >
        <Heart className={`w-3.5 h-3.5 transition-colors ${dest.liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
      </button>

      <div className="relative z-10 p-4 pt-36">
        <div className="text-white font-bold text-lg leading-tight">{dest.name}</div>
        <div className="text-gray-300 text-xs mb-3">{dest.country}</div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">{fromLabel}</div>
            <div className="text-white font-bold text-base">
              <span className="text-gray-400 text-xs font-normal">{currency}</span>{dest.price}
            </div>
          </div>
          <SmartScoreBadge score={dest.smartScore} tag={dest.tag} />
        </div>
      </div>

    </div>
  )
}
