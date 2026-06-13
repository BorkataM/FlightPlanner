import { useState, useEffect, useRef } from 'react'
import { Globe, ChevronDown, LogOut, Check, Sun, Moon, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SkyWaveLogo from '../../assets/logo/SkyWaveLogo'
import { useAuth } from '../../context/AuthContext'
import { useLocale, LANGUAGES } from '../../context/LocaleContext'
import type { LocaleCode } from '../../context/LocaleContext'
import { useTheme } from '../../context/ThemeContext'

const MY_BOOKINGS_LABELS = new Set(['My Bookings', 'Моите резервации'])
const TRAVELERS_LABELS   = new Set(['Travelers', 'Пътешественици'])
const HOTELS_LABELS      = new Set(['Hotels', 'Хотели'])

interface NavLinkProps {
  label:    string
  active?:  boolean
  onClick?: () => void
}

function NavLink({ label, active = false, onClick }: NavLinkProps) {
  return (
    <a
      href="#"
      onClick={e => { e.preventDefault(); onClick?.() }}
      className={`text-sm font-medium transition-colors ${
        active
          ? 'text-indigo-700 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 pb-0.5'
          : 'text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-400'
      }`}
    >
      {label}
    </a>
  )
}

interface LanguageDropdownProps {
  locale:    LocaleCode
  label:     string
  setLocale: (code: LocaleCode) => void
}

function LanguageDropdown({ locale, label, setLocale }: LanguageDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-sm font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <Globe className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50 w-40">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                locale === lang.code ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {lang.label}
              {locale === lang.code && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface NavbarProps {
  onSignIn: () => void
  onLogout: () => void
}

export default function Navbar({ onSignIn, onLogout }: NavbarProps) {
  const { user }                    = useAuth()
  const { t: locale, locale: code, setLocale } = useLocale()
  const { theme, toggleTheme }      = useTheme()
  const t        = locale.navbar
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navClick = (label: string) => {
    setMobileOpen(false)
    if (MY_BOOKINGS_LABELS.has(label)) navigate('/my-bookings')
    else if (TRAVELERS_LABELS.has(label)) navigate('/travelers')
    else if (HOTELS_LABELS.has(label)) window.open('https://www.booking.bg', '_blank')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-4 lg:px-6 xl:px-8 h-14 lg:h-16">

        <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <SkyWaveLogo />
          <span className="text-slate-900 dark:text-slate-100 font-semibold text-base lg:text-[1.15rem] tracking-tight">{t.brand}</span>
        </button>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-4 lg:gap-5 xl:gap-7">
          {t.links.map(label => (
            <NavLink
              key={label}
              label={label}
              active={label === t.activeLink}
              onClick={() => navClick(label)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 xl:gap-5">
          <span className="hidden xl:block text-slate-600 dark:text-slate-400 text-sm font-medium">€ EUR</span>

          <LanguageDropdown locale={code} label={t.language} setLocale={setLocale} />

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden sm:block text-slate-700 dark:text-slate-300 text-sm font-semibold">
                Hi, {user.firstName}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} className="text-slate-700 dark:text-slate-300 text-sm font-medium hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              {t.signIn}
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-lg">
          {t.links.map(label => (
            <button
              key={label}
              onClick={() => navClick(label)}
              className="block w-full text-left px-5 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  )
}
