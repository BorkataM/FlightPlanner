import type { ProfileData } from '../../components/social/EditProfileModal'

export const DEFAULT_PROFILE: ProfileData = {
  avatarDataUrl:     null,
  coverGradient:     'from-slate-800 via-slate-700 to-blue-900',
  coverImageDataUrl: null,
  bio: 'Aviation enthusiast ✈  |  Exploring the world one flight at a time.',
}

export function loadCachedProfile(userId: number): ProfileData {
  try {
    const raw = localStorage.getItem(`skywave_profile_${userId}`)
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) as ProfileData }
  } catch {}
  return { ...DEFAULT_PROFILE }
}

export function cacheProfile(userId: number, data: ProfileData) {
  try { localStorage.setItem(`skywave_profile_${userId}`, JSON.stringify(data)) } catch {}
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-sky-600',
]
export function avatarGradient(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }
