import { Star, Leaf } from 'lucide-react'
import type { SmartTag } from './types'

interface Props {
  score: number
  tag: SmartTag
}

export default function SmartScoreBadge({ score, tag }: Props) {
  if (!tag) return null
  const isGold = tag === 'bestValue'
  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isGold ? 'gold-glow' : 'green-glow'}`}
      style={{
        background: isGold ? 'rgba(251,191,36,0.18)' : 'rgba(34,197,94,0.18)',
        border: `1px solid ${isGold ? 'rgba(251,191,36,0.5)' : 'rgba(34,197,94,0.5)'}`,
        color: isGold ? '#FBBF24' : '#22C55E',
      }}
    >
      {isGold ? <Star className="w-2.5 h-2.5 fill-current" /> : <Leaf className="w-2.5 h-2.5" />}
      {score}
    </div>
  )
}
