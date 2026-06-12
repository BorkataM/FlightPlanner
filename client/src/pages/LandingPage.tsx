import { useState } from 'react'
import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/sections/HeroSection'
import AuthModal from '../components/auth/AuthModal'
import WelcomeToast from '../components/auth/WelcomeToast'
import { useAuth } from '../context/AuthContext'

type ToastType = 'login' | 'register' | 'logout'

export default function LandingPage() {
  const { user, logout } = useAuth()
  const [showAuth,    setShowAuth]    = useState(false)
  const [toastType,   setToastType]   = useState<ToastType | null>(null)

  const handleAuthSuccess = (type: 'login' | 'register') => {
    setShowAuth(false)
    setToastType(type)
  }

  const handleLogout = () => {
    logout()
    setToastType('logout')
  }

  return (
    <div className="h-screen overflow-hidden bg-[#EFF6FF] dark:bg-slate-900">
      <Navbar onSignIn={() => setShowAuth(true)} onLogout={handleLogout} />
      <HeroSection />

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {toastType && (
        <WelcomeToast
          type={toastType}
          user={user ?? undefined}
          onDone={() => setToastType(null)}
        />
      )}
    </div>
  )
}
