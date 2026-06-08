import { Plane } from 'lucide-react'

const R = 180

export default function FlightLoader({ text = 'Loading your flights…' }: { text?: string }) {
  return (
    <div
      className="fixed inset-0 z-[9000] flex flex-col items-center justify-center select-none"
      style={{ background: 'linear-gradient(160deg, #06101e 0%, #0d1e35 60%, #091527 100%)' }}
    >
      {/* Radar dish */}
      <div className="relative flex items-center justify-center" style={{ width: R, height: R }}>

        {/* Static reference rings */}
        {([0.28, 0.52, 0.76, 1] as const).map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-blue-700/20"
            style={{ width: R * s, height: R * s }}
          />
        ))}

        {/* Cross-hair lines */}
        <div className="absolute w-full h-px bg-blue-800/20" />
        <div className="absolute w-px h-full bg-blue-800/20" />

        {/* Rotating sweep arm — conic gradient */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background:
              'conic-gradient(from 0deg, transparent 250deg, rgba(37,99,235,0.06) 290deg, rgba(37,99,235,0.28) 340deg, rgba(96,165,250,0.55) 360deg)',
            animationDuration:       '2s',
            animationTimingFunction: 'linear',
          }}
        />

        {/* Sweep tip dot that "pings" */}
        <div
          className="absolute rounded-full animate-spin"
          style={{
            width: R, height: R,
            animationDuration: '2s',
            animationTimingFunction: 'linear',
          }}
        >
          <div
            className="absolute rounded-full bg-blue-400/80"
            style={{ width: 6, height: 6, top: '50%', right: 0, transform: 'translateY(-50%)' }}
          />
        </div>

        {/* Pulse rings emanating from center */}
        {[0, 0.7, 1.4].map(d => (
          <div
            key={d}
            className="absolute rounded-full border border-blue-400/35 animate-ping"
            style={{ width: 48, height: 48, animationDelay: `${d}s`, animationDuration: '2.1s' }}
          />
        ))}

        {/* Blip dots — simulated radar contacts */}
        <div
          className="absolute rounded-full bg-blue-300/70 animate-pulse"
          style={{ width: 5, height: 5, top: '28%', left: '68%' }}
        />
        <div
          className="absolute rounded-full bg-indigo-300/50 animate-pulse"
          style={{ width: 4, height: 4, top: '62%', left: '35%', animationDelay: '0.4s' }}
        />

        {/* Center plane button */}
        <div
          className="relative z-10 flex items-center justify-center rounded-full shadow-lg"
          style={{
            width: 44, height: 44,
            background:    'linear-gradient(135deg, #2563eb, #6d28d9)',
            boxShadow:     '0 0 20px rgba(37,99,235,0.5)',
          }}
        >
          <Plane className="w-5 h-5 text-white -rotate-45" />
        </div>
      </div>

      {/* Label */}
      <p className="mt-10 text-[10px] font-black text-white/30 uppercase tracking-[0.28em]">
        {text}
      </p>

      {/* Bouncing dots */}
      <div className="flex gap-1.5 mt-4">
        {[0, 0.18, 0.36].map(d => (
          <div
            key={d}
            className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-bounce"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </div>
    </div>
  )
}
