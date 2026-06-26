import { useEffect, useState, useCallback, useRef } from 'react'
import { useLocale } from '../context/LocaleContext'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Search, Plane, Globe, Users, UserPlus,
  Loader2, Briefcase, Flag, Mail, Check,
} from 'lucide-react'
import SkyWaveLogo from '../assets/logo/SkyWaveLogo'
import { socialApi, usersApi, type UserStats, type UserSearchResult, type UserSummary } from '../services/api'
import { alpha2ToFullName } from '../data/countryIsoMap'
import { useAuth } from '../context/AuthContext'
import UserProfileModal from '../components/social/UserProfileModal'
import TravelMapCard from '../components/social/TravelMapCard'
import EditProfileModal, { type ProfileData } from '../components/social/EditProfileModal'

const DEFAULT_PROFILE: ProfileData = {
  avatarDataUrl:     null,
  coverGradient:     'from-slate-800 via-slate-700 to-blue-900',
  coverImageDataUrl: null,
  bio: 'Aviation enthusiast ✈  |  Exploring the world one flight at a time.',
}

function loadCachedProfile(userId: number): ProfileData {
  try {
    const raw = localStorage.getItem(`skywave_profile_${userId}`)
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) as ProfileData }
  } catch {}
  return { ...DEFAULT_PROFILE }
}

function cacheProfile(userId: number, data: ProfileData) {
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
function avatarGradient(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length] }

// Circular progress for Your Journey
function JourneyCircle({ pct }: { pct: number }) {
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
function ProfileStat({ icon: Icon, value, label, sub, color, onClick }: {
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
function TravelerRow({ user, onOpen }: { user: UserSearchResult; onOpen: (id: number) => void }) {
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

// Page
export default function TravelersPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useLocale()
  const tr = t.travelers

  const [myStats,          setMyStats]          = useState<UserStats | null>(null)
  const [visitedCountries, setVisitedCountries] = useState<string[]>([])
  const [results,          setResults]          = useState<UserSearchResult[]>([])
  const [suggestedUsers,   setSuggestedUsers]   = useState<UserSearchResult[]>([])
  const [query,            setQuery]            = useState('')
  const [debouncedQ,       setDebouncedQ]       = useState('')
  const [loadingStats,     setLoadingStats]     = useState(true)
  const [loadingMap,       setLoadingMap]       = useState(true)
  const [loadingSearch,    setLoadingSearch]    = useState(false)
  const [dropdownOpen,     setDropdownOpen]     = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [selectedId,       setSelectedId]       = useState<number | null>(null)
  const [editOpen,         setEditOpen]         = useState(false)
  const [countriesOpen,    setCountriesOpen]    = useState(false)
  const [followModal,      setFollowModal]      = useState<'followers' | 'following' | null>(null)
  const [followList,       setFollowList]       = useState<UserSummary[]>([])
  const [followLoading,    setFollowLoading]    = useState(false)
  const [profileData,      setProfileData]      = useState<ProfileData>(DEFAULT_PROFILE)

  // Load own stats + visited countries + appearance
  useEffect(() => {
    if (!user) { setLoadingStats(false); setLoadingMap(false); return }
    // Show cached profile instantly, then overwrite with server data
    setProfileData(loadCachedProfile(user.userId))
    Promise.allSettled([
      socialApi.getMyStats(user.token),
      socialApi.getVisitedCountries(user.token),
      usersApi.getMyAppearance(user.token),
    ]).then(([statsRes, countriesRes, appearanceRes]) => {
      if (statsRes.status === 'fulfilled')    { setMyStats(statsRes.value); }
      if (countriesRes.status === 'fulfilled') setVisitedCountries(countriesRes.value)
      if (appearanceRes.status === 'fulfilled') {
        const a = appearanceRes.value
        const data: ProfileData = {
          avatarDataUrl:     a.avatarDataUrl ?? null,
          coverImageDataUrl: a.coverImageDataUrl ?? null,
          coverGradient:     a.coverGradient ?? DEFAULT_PROFILE.coverGradient,
          bio:               a.bio ?? DEFAULT_PROFILE.bio,
        }
        setProfileData(data)
        cacheProfile(user.userId, data)
      }
    }).finally(() => {
      setLoadingStats(false)
      setLoadingMap(false)
    })
  }, [user])

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300)
    return () => clearTimeout(t)
  }, [query])

  // Load suggested users once (sidebar content, unaffected by search)
  useEffect(() => {
    if (!user) return
    socialApi.search('', user.token).then(setSuggestedUsers).catch(() => {})
  }, [user])

  // Search for dropdown results
  const runSearch = useCallback(() => {
    if (!user || !debouncedQ) { setResults([]); return }
    setLoadingSearch(true)
    socialApi.search(debouncedQ, user.token)
      .then(r => { setResults(r); setDropdownOpen(true) })
      .catch(() => {})
      .finally(() => setLoadingSearch(false))
  }, [debouncedQ, user])

  useEffect(() => { runSearch() }, [runSearch])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const refreshStats = () => {
    if (!user) return
    Promise.all([
      socialApi.getMyStats(user.token),
      socialApi.getVisitedCountries(user.token),
    ]).then(([s, c]) => { setMyStats(s); setVisitedCountries(c) }).catch(() => {})
  }

  const openFollowModal = (type: 'followers' | 'following') => {
    if (!user) return
    setFollowModal(type)
    setFollowLoading(true)
    const fn = type === 'followers' ? socialApi.getMyFollowers : socialApi.getMyFollowing
    fn(user.token).then(setFollowList).catch(() => setFollowList([])).finally(() => setFollowLoading(false))
  }

  const handleProfileSave = (data: ProfileData) => {
    if (!user) return
    setProfileData(data)
    setEditOpen(false)
    cacheProfile(user.userId, data)
    usersApi.updateMyAppearance({
      avatarDataUrl:     data.avatarDataUrl,
      coverImageDataUrl: data.coverImageDataUrl,
      coverGradient:     data.coverGradient,
      bio:               data.bio,
    }, user.token).catch(() => {})
  }

  const initials = myStats
    ? `${myStats.firstName[0] ?? ''}${myStats.lastName[0] ?? ''}`.toUpperCase()
    : user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '?'

  const journeyPct = myStats ? (myStats.countriesVisited / 195) * 100 : 0

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
          <div className="w-full px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0 mr-1 hover:opacity-80 transition-opacity">
              <SkyWaveLogo idSuffix="travelers-guest" />
              <span className="text-slate-900 dark:text-slate-100 font-semibold text-[1.15rem] tracking-tight">SkyWave</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Home
            </button>
            <div className="flex-1" />
            <span className="text-sm font-black text-blue-600 border-b-2 border-blue-600 pb-0.5">
              Travelers
            </span>
          </div>
        </nav>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto">
              <Users className="w-7 h-7 text-blue-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-200 font-bold text-lg">Sign in to connect with travelers</p>
            <p className="text-slate-400 text-sm">See other travelers' journeys and follow friends.</p>
            <button onClick={() => navigate('/')} className="mt-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
              Go to homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 shadow-sm">
        <div className="w-full px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0 mr-1 hover:opacity-80 transition-opacity">
            <SkyWaveLogo idSuffix="travelers" />
            <span className="text-slate-900 dark:text-slate-100 font-semibold text-[1.15rem] tracking-tight">SkyWave</span>
          </button>

          {/* Back */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-sm font-medium transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" /> Home
          </button>

          {/* Search */}
          <div ref={searchRef} className="flex-1 max-w-xl mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) setDropdownOpen(false) }}
              onFocus={() => { if (query && results.length > 0) setDropdownOpen(true) }}
              placeholder={tr.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 border border-transparent rounded-full text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-300 dark:focus:border-slate-500 transition"
            />

            {/* Search dropdown */}
            {dropdownOpen && query && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50">
                {loadingSearch ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <Users className="w-7 h-7 text-slate-200" />
                    <p className="text-xs text-slate-400 font-medium">{tr.noTravelersFound}</p>
                  </div>
                ) : (
                  <div className="py-2 max-h-72 overflow-y-auto">
                    {results.map(u => {
                      const initials = `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase()
                      return (
                        <button
                          key={u.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                          onClick={() => { setSelectedId(u.id); setDropdownOpen(false); setQuery('') }}
                        >
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient(u.id)} flex items-center justify-center shrink-0 shadow-sm`}>
                            <span className="text-xs font-black text-white">{initials}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{u.firstName} {u.lastName}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{u.flightsCount} {u.flightsCount === 1 ? tr.flight : tr.flights}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: active tab + bell + avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-black text-blue-600 border-b-2 border-blue-600 pb-0.5">
              Travelers
            </span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 w-full px-3 lg:px-6 py-4 lg:py-6 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 grid md:grid-cols-[1fr_3fr] lg:grid-cols-4 gap-3 lg:gap-6">

          {/* Main column (3/4): profile card + map stacked */}
          <div className="lg:col-span-3 flex flex-col gap-5 min-h-0">

            {/* Profile cover card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm shrink-0">
              {/* Cover */}
              <div
                className={`relative h-40 lg:h-52 flex items-center px-4 lg:px-8 gap-4 lg:gap-6 ${profileData.coverImageDataUrl ? '' : `bg-gradient-to-br ${profileData.coverGradient}`}`}
                style={profileData.coverImageDataUrl ? { backgroundImage: `url(${profileData.coverImageDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* Avatar */}
                <div className="relative shrink-0 z-10">
                  <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-full border-4 border-white/70 shadow-2xl overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    {profileData.avatarDataUrl
                      ? <img src={profileData.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-2xl lg:text-4xl font-black text-white select-none">{initials}</span>
                    }
                  </div>
                </div>

                {/* Profile info */}
                <div className="flex-1 text-white min-w-0 z-10">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black leading-tight truncate">
                      {user.firstName} {user.lastName}
                    </h1>
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-sm">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-white/70 text-sm">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {profileData.bio && (
                    <p className="text-white/55 text-sm mt-1.5 truncate">{profileData.bio}</p>
                  )}
                </div>

                {/* Edit Profile */}
                <button
                  onClick={() => setEditOpen(true)}
                  className="absolute top-4 right-5 z-10 flex items-center gap-1.5 px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold rounded-xl backdrop-blur-sm transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit Profile
                </button>
              </div>

              {/* Stats bar */}
              {loadingStats ? (
                <div className="flex">
                  {[0,1,2,3].map(i => (
                    <div key={i} className="flex-1 flex items-center gap-3 px-5 py-5 animate-pulse">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-4 w-16 bg-slate-100 rounded" />
                        <div className="h-2.5 w-12 bg-slate-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex divide-x divide-slate-100 dark:divide-slate-700">
                  <ProfileStat icon={Plane}    value={myStats?.flightsCount    ?? 0} label="Flights"    sub="Total taken" color="bg-blue-50 dark:bg-blue-950 text-blue-500"       />
                  <ProfileStat icon={Globe}    value={myStats?.countriesVisited ?? 0} label="Countries"  sub="Visited"     color="bg-emerald-50 dark:bg-emerald-950 text-emerald-500" />
                  <ProfileStat icon={Users}    value={myStats?.followersCount   ?? 0} label="Followers"  sub="People"      color="bg-violet-50 dark:bg-violet-950 text-violet-500"    onClick={() => openFollowModal('followers')} />
                  <ProfileStat icon={UserPlus} value={myStats?.followingCount   ?? 0} label="Following"  sub="Travelers"   color="bg-sky-50 dark:bg-sky-950 text-sky-500"             onClick={() => openFollowModal('following')} />
                </div>
              )}
            </div>

            {/* Travel Map */}
            <div className="flex-1 min-h-0">
              <TravelMapCard visitedCountries={visitedCountries} loading={loadingMap} />
            </div>

          </div>

          {/* Sidebar (1/4) */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* Your Journey */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Your Journey</h3>
              </div>
              {loadingStats ? (
                <div className="w-36 h-36 rounded-full bg-slate-100 animate-pulse mx-auto my-2" />
              ) : (
                <JourneyCircle pct={journeyPct} />
              )}
              <div className="mt-3 bg-amber-50 dark:bg-amber-950 rounded-xl px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 text-center leading-relaxed">
                  ⭐ Keep exploring! You've got a whole world to discover.
                </p>
              </div>
            </div>

            {/* Top Countries */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Top Countries</h3>
                </div>
                <button onClick={() => setCountriesOpen(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">View all</button>
              </div>

              {visitedCountries.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-600 p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-500">No countries visited yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Your visited countries will appear here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visitedCountries.slice(0, 5).map(country => (
                    <div key={country} className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{alpha2ToFullName(country)}</span>
                    </div>
                  ))}
                  {visitedCountries.length > 5 && (
                    <p className="text-xs text-slate-400 pl-4.5">+{visitedCountries.length - 5} more</p>
                  )}
                </div>
              )}
            </div>

            {/* Suggested Travelers */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{tr.suggestedTravelers}</h3>
              </div>

              {suggestedUsers.length === 0 ? (
                <div className="text-center py-4">
                  <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">{tr.noTravelersYet}</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {suggestedUsers.slice(0, 5).map(u => (
                    <TravelerRow
                      key={u.id}
                      user={u}
                      onOpen={id => setSelectedId(id)}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {selectedId !== null && (
        <UserProfileModal
          userId={selectedId}
          onClose={() => { setSelectedId(null); refreshStats() }}
        />
      )}

      {followModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setFollowModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {followModal === 'followers'
                  ? <Users className="w-4 h-4 text-violet-500" />
                  : <UserPlus className="w-4 h-4 text-sky-500" />
                }
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {followModal === 'followers' ? tr.followersTitle : tr.followingTitle}
                </h3>
              </div>
              {!followLoading && <span className="text-xs font-semibold text-slate-400">{followList.length} {tr.people}</span>}
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {followLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : followList.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">{followModal === 'followers' ? tr.followersTitle : tr.followingTitle} — 0</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {followList.map(u => (
                    <div key={u.id} className="flex items-center gap-3 cursor-pointer group" onClick={() => { setFollowModal(null); setSelectedId(u.id) }}>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradient(u.id)} flex items-center justify-center shrink-0 shadow-sm`}>
                        <span className="text-sm font-black text-white">
                          {u.firstName[0]}{u.lastName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setFollowModal(null)} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                {tr.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {countriesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCountriesOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">All Visited Countries</h3>
              </div>
              <span className="text-xs font-semibold text-slate-400">{visitedCountries.length} / 195</span>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-3 space-y-2.5">
              {visitedCountries.map((c, i) => (
                <div key={c} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{alpha2ToFullName(c)}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700">
              <button onClick={() => setCountriesOpen(false)} className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <EditProfileModal
          initials={initials}
          initial={profileData}
          onClose={() => setEditOpen(false)}
          onSave={handleProfileSave}
        />
      )}
    </div>
  )
}
