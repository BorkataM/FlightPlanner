import { Globe, Heart, ChevronDown } from 'lucide-react'
import SkyWaveLogo from '../../assets/logo/SkyWaveLogo'
import { en } from '../../localization/en'

const t = en.navbar

const NavLink = ({ label, active = false }: { label: string; active?: boolean }) => (
  <a
    href="#"
    className={`text-sm font-medium transition-colors ${
      active ? 'text-slate-900 border-b-2 border-violet-600 pb-0.5' : 'text-slate-500 hover:text-slate-900'
    }`}
  >
    {label}
  </a>
)

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 nav-blur">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between px-8 h-16">
        <div className="flex items-center gap-2.5">
          <SkyWaveLogo />
          <span className="text-slate-900 font-semibold text-[1.15rem] tracking-tight">{t.brand}</span>
        </div>

        <div className="flex items-center gap-7">
          {t.links.map((label) => (
            <NavLink key={label} label={label} active={label === t.activeLink} />
          ))}
        </div>

        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors">
            {t.currency} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 text-slate-600 text-sm font-medium hover:text-slate-900 transition-colors">
            <Globe className="w-4 h-4" /> {t.language} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="text-slate-400 hover:text-slate-700 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="text-slate-700 text-sm font-medium hover:text-slate-900 transition-colors">
            {t.signIn}
          </button>
        </div>
      </div>
    </nav>
  )
}
