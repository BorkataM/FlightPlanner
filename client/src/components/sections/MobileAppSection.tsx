import { useState } from 'react'
import { Smartphone, Apple, Play, Bell, CheckCircle2 } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'

export default function MobileAppSection() {
  const { t: locale } = useLocale()
  const t = locale.mobileApp

  const [open,      setOpen]      = useState(false)
  const [email,     setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState('')

  const handleSubmit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.invalidEmail)
      return
    }
    setError('')
    // Remember interest locally — no backend signup endpoint yet for the coming-soon app.
    try {
      const list = JSON.parse(localStorage.getItem('skywave_mobile_waitlist') ?? '[]') as string[]
      if (!list.includes(email.trim().toLowerCase())) list.push(email.trim().toLowerCase())
      localStorage.setItem('skywave_mobile_waitlist', JSON.stringify(list))
    } catch { /* ignore storage errors */ }
    setSubmitted(true)
  }

  return (
    <section className="relative px-4 lg:px-6 xl:px-8 py-10 lg:py-12 bg-[#EFF6FF] dark:bg-slate-900">
      <div className="max-w-[1100px] mx-auto">
        <div className="mobile-cta relative overflow-hidden rounded-3xl px-6 py-8 sm:px-12 sm:py-9 flex flex-col lg:flex-row items-center gap-8">

          {/* Text */}
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 text-white text-xs font-semibold tracking-wide uppercase px-3 py-1 mb-4 backdrop-blur-sm">
              <Smartphone className="w-3.5 h-3.5" /> {t.badge}
            </span>

            <h2 className="text-white font-extrabold text-2xl sm:text-3xl leading-tight tracking-tight mb-3">
              {t.title}
            </h2>

            <p className="text-blue-100/90 text-sm sm:text-base font-light leading-relaxed max-w-xl mx-auto lg:mx-0 mb-6">
              {t.subtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white/80 text-sm font-medium px-4 py-2.5 cursor-not-allowed">
                <Apple className="w-4 h-4" /> App Store
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white/80 text-sm font-medium px-4 py-2.5 cursor-not-allowed">
                <Play className="w-4 h-4" /> Google Play
              </span>
              {!open && !submitted && (
                <button
                  onClick={() => setOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold px-4 py-2.5 transition-transform hover:scale-[1.03] active:scale-95"
                >
                  <Bell className="w-4 h-4" /> {t.comingSoon}
                </button>
              )}
            </div>

            {open && !submitted && (
              <div className="mt-4 max-w-md mx-auto lg:mx-0">
                <div className="flex gap-2">
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (error) setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder={t.emailPlaceholder}
                    className="flex-1 min-w-0 rounded-xl bg-white/95 text-slate-900 text-sm font-medium px-4 py-2.5 outline-none placeholder-slate-400 focus:ring-2 focus:ring-white/60"
                  />
                  <button
                    onClick={handleSubmit}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-white text-indigo-700 text-sm font-semibold px-4 py-2.5 transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    <Bell className="w-4 h-4" /> {t.comingSoon}
                  </button>
                </div>
                {error && <p className="text-red-100 text-xs mt-2 font-medium">{error}</p>}
              </div>
            )}

            {submitted && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/15 text-white text-sm font-medium px-4 py-2.5 backdrop-blur-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {t.thanks}
              </div>
            )}
          </div>

          {/* Phone mockup */}
          <div className="shrink-0">
            <div className="mobile-phone relative w-[130px] h-[240px] rounded-[1.8rem] border-[5px] border-white/20 bg-slate-900/40 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center gap-2">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-white/30" />
              <Smartphone className="w-9 h-9 text-white/80" strokeWidth={1.5} />
              <span className="text-white font-bold text-base tracking-tight">SkyWave</span>
              <span className="text-blue-100/70 text-[11px]">{t.badge}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
