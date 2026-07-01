import SearchBox from '../../features/search/SearchBox'
import StarField from './StarField'
import { IMAGES } from '../../assets/images'
import { useLocale } from '../../context/LocaleContext'
import { useTheme } from '../../context/ThemeContext'

export default function HeroSection() {
  const { t: locale } = useLocale()
  const t = locale.hero
  const { theme } = useTheme()
  return (
    <section
      className="relative z-20 min-h-screen flex flex-col"
    >
      <div
        className="absolute inset-0 hero-bg-image"
        style={{ backgroundImage: `url('${IMAGES.hero}')` }}
      />
      <StarField active={theme === 'dark'} />

      {/* day overlay - fades out when dark */}
      <div className="absolute inset-0 hero-overlay-day pointer-events-none"
        style={{ zIndex: 2, opacity: theme === 'dark' ? 0 : 1, transition: 'opacity 0.7s ease' }} />

      {/* night overlay - fades in when dark */}
      <div className="absolute inset-0 hero-overlay-night pointer-events-none"
        style={{ zIndex: 2, opacity: theme === 'dark' ? 1 : 0, transition: 'opacity 0.7s ease' }} />

      <div className="hero-blob-orange absolute right-[8%]  top-[30%] w-96 h-96 rounded-full pointer-events-none"
        style={{ zIndex: 3, opacity: theme === 'dark' ? 0 : 1, transition: 'opacity 0.7s ease' }} />
      <div className="hero-blob-amber  absolute right-[18%] bottom-[20%] w-64 h-64 rounded-full pointer-events-none"
        style={{ zIndex: 3, opacity: theme === 'dark' ? 0 : 1, transition: 'opacity 0.7s ease' }} />

      <div className="relative z-10 flex flex-col justify-center flex-1 px-4 lg:px-6 xl:px-8 max-w-[1280px] mx-auto w-full pt-14 lg:pt-20 pb-6 lg:pb-10">

        <div className="flex items-center gap-2 mb-6">
          <span className="hero-tagline text-xs font-semibold tracking-widest uppercase">
            {t.tagline}
          </span>
        </div>

        <h1 className="hero-headline font-extrabold leading-[1.08] tracking-tight mb-5">
          <span className="block text-white">{t.headline.line1}</span>
          <span className="block">
            <span className="hero-accent">{t.headline.accent}</span>
            <span className="text-white"> {t.headline.line2}</span>
          </span>
        </h1>

        <p className="text-blue-100 text-base mb-10 font-light tracking-wide opacity-85">
          {t.subtitle}
        </p>

        <SearchBox />
      </div>
    </section>
  )
}
