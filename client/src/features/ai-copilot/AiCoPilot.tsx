import { en } from '../../localization/en'

const t = en.aiCopilot

export default function AiCoPilot() {
  return (
    <div className="flex items-center gap-4 mt-4 w-full max-w-[900px]">
      <div
        className="relative flex items-center justify-center w-12 h-12 rounded-full animate-glow-pulse shrink-0"
        style={{ background: 'radial-gradient(circle, rgba(0,229,204,0.2) 0%, rgba(0,229,204,0.05) 100%)', border: '1.5px solid rgba(0,229,204,0.6)', boxShadow: '0 0 20px rgba(0,229,204,0.4), 0 0 40px rgba(0,229,204,0.15)' }}
      >
        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-glow opacity-80" />
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-teal-glow opacity-80" />
        <span className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1 h-1 rounded-full bg-teal-glow opacity-80" />
        <span className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1 h-1 rounded-full bg-teal-glow opacity-80" />
        <span className="text-xs font-bold tracking-widest" style={{ color: '#00E5CC', textShadow: '0 0 12px rgba(0,229,204,0.8)' }}>AI</span>
      </div>
      <div className="h-px flex-shrink-0 w-6 opacity-40" style={{ background: 'linear-gradient(to right, #00E5CC, transparent)' }} />
      <div>
        <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#00E5CC', textShadow: '0 0 10px rgba(0,229,204,0.6)' }}>{t.label}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">{t.subtitle}</div>
      </div>
      <div className="ml-auto flex items-center gap-2 text-[11px] text-gray-400">
        {[0, 0.3, 0.6].map((delay) => (
          <span key={delay} className="inline-block w-1.5 h-1.5 rounded-full animate-shimmer" style={{ background: '#00E5CC', animationDelay: `${delay}s` }} />
        ))}
        <span className="ml-1">{t.status}</span>
      </div>
    </div>
  )
}
