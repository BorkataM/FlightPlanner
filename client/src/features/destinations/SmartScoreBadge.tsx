import { Star, Leaf } from 'lucide-react'
import type { SmartTag } from './types'

interface Props {
  score: number
  tag:   SmartTag
}

export default function SmartScoreBadge({ score, tag }: Props) {
  if (!tag) return null

  const isGold = tag === 'bestValue'

  return (
    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isGold ? 'badge-gold gold-glow' : 'badge-eco green-glow'}`}>
      {isGold
        ? <Star className="w-2.5 h-2.5 fill-current" />
        : <Leaf className="w-2.5 h-2.5" />
      }
      {score}
    </div>
  )
}
