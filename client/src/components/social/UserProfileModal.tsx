import { useEffect, useState } from 'react'
import { X, Plane, Globe, Users, UserPlus } from 'lucide-react'
import { socialApi, type UserStats } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import StatTile from './StatTile'

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
]

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

interface Props {
  userId:  number
  onClose: () => void
}

export default function UserProfileModal({ userId, onClose }: Props) {
  const { user: me } = useAuth()
  const [stats,     setStats]     = useState<UserStats | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [following, setFollowing] = useState(false)
  const [busy,      setBusy]      = useState(false)

  useEffect(() => {
    setLoading(true)
    socialApi.getUserStats(userId, me?.token)
      .then(s => { setStats(s); setFollowing(s.isFollowedByCurrentUser) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId, me?.token])

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
    } catch {
      // revert on error — state unchanged
    } finally {
      setBusy(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const gradient = stats ? avatarColor(stats.id) : 'from-blue-500 to-indigo-600'
  const initials  = stats
    ? `${stats.firstName[0] ?? ''}${stats.lastName[0] ?? ''}`.toUpperCase()
    : '?'

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-br ${gradient} px-6 pt-6 pb-10 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-white/30">
              <span className="text-3xl font-black text-white">{initials}</span>
            </div>
            {loading ? (
              <div className="space-y-2 mt-1">
                <div className="h-5 w-32 bg-white/30 rounded animate-pulse mx-auto" />
                <div className="h-3 w-40 bg-white/20 rounded animate-pulse mx-auto" />
              </div>
            ) : stats ? (
              <>
                <div>
                  <p className="text-xl font-black text-white leading-tight">
                    {stats.firstName} {stats.lastName}
                  </p>
                  <p className="text-sm text-white/60 mt-0.5">{stats.email}</p>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Stats */}
        <div className="-mt-6 mx-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
          {loading ? (
            <div className="flex gap-2 px-4 py-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 animate-pulse">
                  <div className="w-9 h-9 bg-slate-100 rounded-xl" />
                  <div className="h-5 w-8 bg-slate-100 rounded" />
                  <div className="h-2.5 w-12 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="flex divide-x divide-slate-100">
              <StatTile icon={Plane}    value={stats.flightsCount}     label="Flights"    color="bg-blue-50 text-blue-500"    />
              <StatTile icon={Globe}    value={stats.countriesVisited}  label="Countries"  color="bg-emerald-50 text-emerald-500" />
              <StatTile icon={Users}    value={stats.followersCount}    label="Followers"  color="bg-violet-50 text-violet-500"  />
              <StatTile icon={UserPlus} value={stats.followingCount}    label="Following"  color="bg-sky-50 text-sky-500"       />
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-6">Failed to load profile</p>
          )}
        </div>

        {/* Follow button */}
        {stats && me && stats.id !== me.userId && (
          <div className="px-5 py-5">
            <button
              onClick={toggleFollow}
              disabled={busy}
              className={`w-full py-3 rounded-2xl text-sm font-black transition-colors ${
                following
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {busy ? '…' : following ? 'Following' : 'Follow'}
            </button>
          </div>
        )}

        {(!stats || !me || stats.id === me.userId) && <div className="pb-5" />}
      </div>
    </div>
  )
}
