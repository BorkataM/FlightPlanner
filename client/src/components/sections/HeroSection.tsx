import SearchBox from '../../features/search/SearchBox'
import { IMAGES } from '../../assets/images'
import { en } from '../../localization/en'

const t = en.hero

export default function HeroSection() {
  return (
    <section
      className="relative h-full flex flex-col overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url('${IMAGES.hero}')` }}
    >
      <div className="absolute inset-0 hero-overlay" />

      <div className="hero-blob-orange absolute right-[8%]  top-[30%] w-96 h-96 rounded-full pointer-events-none" />
      <div className="hero-blob-amber  absolute right-[18%] bottom-[20%] w-64 h-64 rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-center flex-1 px-8 max-w-[1280px] mx-auto w-full pt-20 pb-10">

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
