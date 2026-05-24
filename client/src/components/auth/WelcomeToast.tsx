import { useEffect } from 'react'
import SkyWaveLogo from '../../assets/logo/SkyWaveLogo'
import type { AuthUser } from '../../context/AuthContext'

type ToastType = 'login' | 'register' | 'logout'

interface Props {
  type:   ToastType
  user?:  AuthUser
  onDone: () => void
}

const DISMISS_MS = 2800

const CONTENT: Record<ToastType, { heading: (name?: string) => string; subtitle: string }> = {
  login:    { heading: name => `Welcome back, ${name}!`,  subtitle: 'You have just signed in'        },
  register: { heading: name => `Welcome, ${name}!`,       subtitle: 'Your account has been created'  },
  logout:   { heading: ()   => 'Logged out successfully!', subtitle: 'See you next time!'             },
}

export default function WelcomeToast({ type, user, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, DISMISS_MS)
    return () => clearTimeout(t)
  }, [onDone])

  const { heading, subtitle } = CONTENT[type]

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center pointer-events-none">
      <div className="welcome-toast bg-white rounded-3xl shadow-2xl px-10 py-9 flex flex-col items-center text-center w-72">
        <SkyWaveLogo className="w-16 h-16 mb-5" idSuffix="-toast" />
        <h2 className="text-xl font-bold text-slate-900">
          {heading(user?.firstName)}
        </h2>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-2">
          {subtitle}
        </p>
      </div>
    </div>
  )
}
