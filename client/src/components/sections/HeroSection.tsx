import SearchBox from '../../features/search/SearchBox'
import { IMAGES } from '../../assets/images'
import { en } from '../../localization/en'

const t = en.hero

const PlaneSVG = () => (
  <svg viewBox="0 0 520 200" fill="white" className="w-full h-full" style={{ filter: 'drop-shadow(0 0 30px rgba(200,160,80,0.25))' }}>
    <ellipse cx="240" cy="100" rx="210" ry="18" opacity="0.9" />
    <path d="M440 100 Q480 96 510 90 Q510 110 480 104 Z" opacity="0.9" />
    <path d="M160 100 L260 22 L300 100 Z" opacity="0.85" />
    <path d="M160 100 L260 178 L300 100 Z" opacity="0.5" />
    <path d="M48 100 L38 48 L78 100 Z" opacity="0.85" />
    <path d="M48 100 L28 130 L75 108 Z" opacity="0.5" />
    <ellipse cx="220" cy="76" rx="36" ry="10" opacity="0.7" />
    <rect x="180" y="87" width="220" height="7" rx="3" opacity="0.15" />
  </svg>
)

export default function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundImage: `url('${IMAGES.hero}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 hero-overlay" />
      <div className="absolute right-[8%] top-[30%] w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(200,100,20,0.18) 0%, transparent 70%)' }} />
      <div className="absolute right-[18%] bottom-[20%] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(160,70,10,0.14) 0%, transparent 70%)' }} />
      <div className="absolute right-[6%] top-[18%] w-[520px] h-[200px] pointer-events-none opacity-0" aria-hidden>
        <PlaneSVG />
      </div>

      <div className="relative z-10 flex flex-col justify-center flex-1 px-8 max-w-[1280px] mx-auto w-full pt-20 pb-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#00E5CC', textShadow: '0 0 10px rgba(0,229,204,0.5)' }}>
            {t.tagline}
          </span>
        </div>

        <h1 className="font-extrabold leading-[1.1] tracking-tight mb-5" style={{ fontSize: 'clamp(2.8rem, 5.5vw, 4.8rem)' }}>
          <span className="block text-white">{t.headline.line1}</span>
          <span className="block">
            <span style={{ background: 'linear-gradient(90deg, #818CF8 0%, #A78BFA 60%, #C084FC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {t.headline.accent}{' '}
            </span>
            <span className="text-white">{t.headline.line2}</span>
          </span>
        </h1>

        <p className="text-gray-400 text-base mb-10 font-light tracking-wide">{t.subtitle}</p>

        <SearchBox />
      </div>

    </section>
  )
}
