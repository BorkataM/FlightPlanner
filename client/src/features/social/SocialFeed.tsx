import { ACTIVITIES } from '../../assets/data/social'
import { en } from '../../localization/en'
import type { ActivityCard } from './types'

const t = en.socialFeed

const AVATAR_COLORS: Record<string, string> = {
  B: '#6D28D9', M: '#0891B2', A: '#059669', S: '#D97706',
  D: '#DC2626', N: '#7C3AED', I: '#0D9488', P: '#2563EB',
}

const ActivityItem = ({ item }: { item: ActivityCard }) => (
  <div
    className="flex-shrink-0 flex items-start gap-3 px-4 py-3 rounded-xl mx-2 w-72"
    style={{ background: 'rgba(13, 21, 48, 0.8)', border: '1px solid rgba(0,229,204,0.12)', boxShadow: '0 0 20px rgba(0,229,204,0.04)', backdropFilter: 'blur(10px)' }}
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
      style={{ background: AVATAR_COLORS[item.avatar] ?? '#6D28D9' }}>
      {item.avatar}
    </div>
    <div className="min-w-0">
      <div className="text-[13px] text-white font-medium leading-snug">
        <span className="font-semibold">{item.name}</span>{' '}
        <span className="text-gray-300 font-normal">{item.action}</span>
      </div>
      <div className="text-[11px] text-gray-500 mt-1">{item.time}</div>
    </div>
    {item.flag && <span className="text-lg ml-auto shrink-0">{item.flag}</span>}
  </div>
)

export default function SocialFeed() {
  const looped = [...ACTIVITIES, ...ACTIVITIES]

  return (
    <div className="py-10 overflow-hidden border-b border-white/[0.06]" style={{ background: 'rgba(4,11,28,0.98)' }}>
      <div className="max-w-[1280px] mx-auto px-8 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full animate-shimmer" style={{ background: '#00E5CC' }} />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">{t.label}</span>
        </div>
      </div>
      <div className="relative flex overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #040B1C, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #040B1C, transparent)' }} />
        <div className="flex animate-marquee">
          {looped.map((item, i) => <ActivityItem key={i} item={item} />)}
        </div>
      </div>
    </div>
  )
}
