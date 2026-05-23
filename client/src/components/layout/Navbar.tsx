import { Globe, Heart, ChevronDown } from 'lucide-react'
import SkyWaveLogo from '../../assets/logo/SkyWaveLogo'
import { en } from '../../localization/en'

const t = en.navbar

const NavLink = ({ label, active = false }: { label: string; active?: boolean }) => (
  <a
    href="#"
    className={`text-sm font-medium transition-colors ${
      active ? 'text-white border-b-2 border-white pb-0.5' : 'text-gray-400 hover:text-white'
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
          <span className="text-white font-semibold text-[1.15rem] tracking-tight">{t.brand}</span>
        </div>

        <div className="flex items-center gap-7">
          {t.links.map((label) => (
            <NavLink key={label} label={label} active={label === t.activeLink} />
          ))}
        </div>

        <div className="flex items-center gap-5">
          <button className="flex items-center gap-1 text-white text-sm font-medium hover:text-gray-300 transition-colors">
            {t.currency} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="flex items-center gap-1.5 text-white text-sm font-medium hover:text-gray-300 transition-colors">
            <Globe className="w-4 h-4" /> {t.language} <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Heart className="w-5 h-5" />
          </button>
          <button className="text-white text-sm font-medium hover:text-gray-300 transition-colors">
            {t.signIn}
          </button>
        </div>
      </div>
    </nav>
  )
}
