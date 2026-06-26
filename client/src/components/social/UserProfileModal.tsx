import { useEffect, useState } from 'react'
import { X, Plane, Globe, Users, UserPlus } from 'lucide-react'
import { socialApi, usersApi, type UserStats, type UserAppearance } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { alpha2ToFullName } from '../../data/countryIsoMap'
import TravelMapCard from './TravelMapCard'

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
]
function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }

interface Props {
  userId:  number
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const { user: me } = useAuth()
  const [stats,      setStats]      = useState<UserStats | null>(null)
  const [countries,  setCountries]  = useState<string[]>([])
  const [appearance, setAppearance] = useState<UserAppearance | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [following,  setFollowing]  = useState(false)
  const [busy,       setBusy]       = useState(false)

  useEffect(() => {
    setLoading(true)
    setStats(null)
    setCountries([])
    setAppearance(null)
    Promise.allSettled([
      socialApi.getUserStats(userId, me?.token),
      socialApi.getUserVisitedCountries(userId, me?.token),
      usersApi.getUserAppearance(userId, me?.token),
    ]).then(([statsResult, countriesResult, appearanceResult]) => {
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value)
        setFollowing(statsResult.value.isFollowedByCurrentUser)
      }
      if (countriesResult.status === 'fulfilled') {
        setCountries(countriesResult.value)
      }
      if (appearanceResult.status === 'fulfilled') {
        setAppearance(appearanceResult.value)
      }
    }).finally(() => setLoading(false))
  }, [userId, me?.token])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function toggleFollow() {
    if (!me || !stats || busy) return
    setBusy(true)
    try {
      if (following) {
        await socialApi.unfollow(userId, me.token)
        setFollowing(false)
        setStats(s => s ? { ...s, followersCount: s.followersCount - 1 } : s)
      } else {
        await socialApi.follow(userId, me.token)
        setFollowing(true)
        setStats(s => s ? { ...s, followersCount: s.followersCount + 1 } : s)
      }
    } catch {} finally { setBusy(false) }
  }

  const gradient   = appearance?.coverGradient ?? (stats ? avatarColor(stats.id) : 'from-blue-500 to-indigo-600')
  const hasCoverImg = !!appearance?.coverImageDataUrl
  const initials   = stats
    ? `${stats.firstName[0] ?? ''}${stats.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Cover banner */}
        <div
          className={`relative h-32 shrink-0 ${hasCoverImg ? '' : `bg-gradient-to-br ${gradient}`}`}
          style={hasCoverImg ? { backgroundImage: `url(${appearance!.coverImageDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Profile info */}
        <div className="px-6 pb-4 shrink-0 bg-white dark:bg-slate-800">
          {/* Avatar row */}
          <div className="-mt-10 relative z-10">
            <div className={`w-20 h-20 rounded-2xl border-4 border-white dark:border-slate-800 shadow-xl shrink-0 overflow-hidden ${appearance?.avatarDataUrl ? '' : `bg-gradient-to-br ${gradient} flex items-center justify-center`}`}>
              {appearance?.avatarDataUrl
                ? <img src={appearance.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-2xl font-black text-white">{initials}</span>
              }
            </div>
          </div>

          {/* Name + email + Follow button */}
          <div className="mt-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {loading ? (
                <div className="space-y-2">
                  <div className="h-5 w-40 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  <div className="h-3.5 w-52 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              ) : stats ? (
                <>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                    {stats.firstName} {stats.lastName}
                  </p>
                  <p className="text-sm text-slate-400 mt-0.5">{stats.email}</p>
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">Could not load profile</p>
              )}
            </div>

            {/* Follow / Following button */}
            {!loading && stats && me && stats.id !== me.userId && (
              <button
                onClick={toggleFollow}
                disabled={busy}
                className={`shrink-0 px-5 py-2 rounded-xl text-sm font-black transition-colors ${
                  following
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {busy ? '…' : following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Stats strip */}
          {!loading && stats && (
            <div className="flex gap-6 mt-4">
              {([
                { icon: Plane,    value: stats.flightsCount,    label: 'Flights'   },
                { icon: Globe,    value: stats.countriesVisited, label: 'Countries' },
                { icon: Users,    value: stats.followersCount,   label: 'Followers' },
                { icon: UserPlus, value: stats.followingCount,   label: 'Following' },
              ] as const).map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{value}</span>
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body: map + countries sidebar */}
        <div className="flex-1 min-h-0 flex overflow-hidden border-t border-slate-100 dark:border-slate-700">
          {/* Map */}
          <div className="flex-1 min-w-0 min-h-0 p-4">
            {loading ? (
              <div className="h-full rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
            ) : (
              <TravelMapCard compact visitedCountries={countries} loading={false} />
            )}
          </div>

          {/* Countries sidebar */}
          <div className="w-52 shrink-0 border-l border-slate-100 dark:border-slate-700 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Visited Countries
              </p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-100 leading-tight">
                {countries.length > 0 ? countries.length : (stats?.countriesVisited ?? 0)}
                <span className="text-sm font-medium text-slate-400"> / 195</span>
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                ))
              ) : countries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center pt-4">No countries visited yet</p>
              ) : (
                countries.map((c, i) => (
                  <div key={c} className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{alpha2ToFullName(c)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
