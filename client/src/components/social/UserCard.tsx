import { useState } from 'react'
import { Plane, Users } from 'lucide-react'
import type { UserSearchResult } from '../../services/api'
import { socialApi } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface Props {
  user:           UserSearchResult
  onOpen:         (id: number) => void
  onFollowChange?: () => void
}

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

export default function UserCard({ user, onOpen, onFollowChange }: Props) {
  const { user: me } = useAuth()
  const [following, setFollowing] = useState(user.isFollowedByCurrentUser)
  const [busy,      setBusy]      = useState(false)

  async function toggleFollow(e: React.MouseEvent) {
    e.stopPropagation()
    if (!me || busy) return
    setBusy(true)
    try {
      if (following) {
        await socialApi.unfollow(user.id, me.token)
        setFollowing(false)
      } else {
        await socialApi.follow(user.id, me.token)
        setFollowing(true)
      }
      onFollowChange?.()
    } catch {
      // revert on error — state unchanged
    } finally {
      setBusy(false)
    }
  }

  const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase()
  const gradient = avatarColor(user.id)

  return (
    <div
      onClick={() => onOpen(user.id)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all group"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-sm`}>
          <span className="text-white font-black text-base">{initials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Plane  className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-bold text-slate-700">{user.flightsCount}</span> flights
        </span>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <Users  className="w-3.5 h-3.5 text-violet-400" />
          <span className="font-bold text-slate-700">{user.followersCount}</span> followers
        </span>
      </div>

      {/* Follow button */}
      <button
        onClick={toggleFollow}
        disabled={busy}
        className={`w-full py-2 rounded-xl text-xs font-black transition-colors ${
          following
            ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } ${busy ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {busy ? '…' : following ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}
