import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { socialApi, type UserSearchResult } from '../../services/api'
import { avatarGradient } from './travelersUtils'

// Circular progress for Your Journey
export function JourneyCircle({ pct }: { pct: number }) {
  const r = 46
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <div className="relative w-36 h-36 mx-auto my-2">
      <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="#3b82f6" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{pct.toFixed(pct < 1 ? 1 : 0)}%</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">of the world</span>
      </div>
    </div>
  )
}

// Stat column in the profile stats bar
export function ProfileStat({ icon: Icon, value, label, sub, color, onClick }: {
  icon: React.ElementType; value: number; label: string; sub: string; color: string; onClick?: () => void
}) {
  return (
    <div
      className={`flex-1 flex items-center gap-2 lg:gap-3 px-3 lg:px-5 py-3 lg:py-4 ${onClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums leading-none">{value}</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

// Compact traveler row for sidebar
export function TravelerRow({ user, onOpen }: { user: UserSearchResult; onOpen: (id: number) => void }) {
  const { user: me } = useAuth()
  const { t } = useLocale()
  const tr = t.travelers
  const [following, setFollowing] = useState(user.isFollowedByCurrentUser)
  const [busy, setBusy] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!me || busy) return
    setBusy(true)
    try {
      if (following) { await socialApi.unfollow(user.id, me.token); setFollowing(false) }
      else           { await socialApi.follow(user.id, me.token);   setFollowing(true)  }
    } catch {} finally { setBusy(false) }
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()

  return (
    <div
      className="flex items-center gap-3 cursor-pointer group py-0.5"
      onClick={() => onOpen(user.id)}
    >
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(user.id)} flex items-center justify-center shrink-0 shadow-sm`}>
        <span className="text-sm font-black text-white">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors leading-tight">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-xs text-slate-400 leading-tight">{user.flightsCount} {user.flightsCount === 1 ? tr.flight : tr.flights}</p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
          following
            ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
        } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {busy ? '…' : following ? tr.following : tr.follow}
      </button>
    </div>
  )
}
