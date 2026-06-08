import { useState, useEffect, useRef } from 'react'
import { Globe, ChevronDown, LogOut, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SkyWaveLogo from '../../assets/logo/SkyWaveLogo'
import { useAuth } from '../../context/AuthContext'
import { useLocale, LANGUAGES } from '../../context/LocaleContext'
import type { LocaleCode } from '../../context/LocaleContext'

const MY_BOOKINGS_LABELS = new Set(['My Bookings', 'Моите резервации'])
const TRAVELERS_LABELS   = new Set(['Travelers', 'Пътешественици'])

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
          ? 'text-indigo-700 border-b-2 border-indigo-600 pb-0.5'
          : 'text-slate-500 hover:text-indigo-700'
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
        className="flex items-center gap-1.5 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors"
      >
        <Globe className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 w-40">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${
                locale === lang.code ? 'text-indigo-600 font-semibold' : 'text-slate-700'
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
  const t        = locale.navbar
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-8 h-16">

        <div className="flex items-center gap-2.5">
          <SkyWaveLogo />
          <span className="text-slate-900 font-semibold text-[1.15rem] tracking-tight">{t.brand}</span>
        </div>

        <div className="flex items-center gap-7">
          {t.links.map(label => (
            <NavLink
              key={label}
              label={label}
              active={label === t.activeLink}
              onClick={
                MY_BOOKINGS_LABELS.has(label) ? () => navigate('/my-bookings') :
                TRAVELERS_LABELS.has(label)   ? () => navigate('/travelers')   :
                undefined
              }
            />
          ))}
        </div>

        <div className="flex items-center gap-5">
          <span className="text-slate-600 text-sm font-medium">€ EUR</span>

          <LanguageDropdown locale={code} label={t.language} setLocale={setLocale} />

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-slate-700 text-sm font-semibold">
                Hi, {user.firstName}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} className="text-slate-700 text-sm font-medium hover:text-slate-900 transition-colors">
              {t.signIn}
            </button>
          )}
        </div>

      </div>
    </nav>
  )
}
