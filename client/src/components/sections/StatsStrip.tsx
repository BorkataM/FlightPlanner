import { en } from '../../localization/en'

const t = en.stats

const COLORS = ['#7C3AED', '#0284C7', '#059669']

const Stat = ({ value, unit, label, sub, color }: { value: string; unit?: string; label: string; sub?: string; color: string }) => (
  <div className="flex flex-col items-center px-12">
    <div className="flex items-baseline gap-1">
      <span className="text-5xl font-extrabold" style={{ color }}>{value}</span>
      {unit && <span className="text-lg font-semibold text-slate-400">{unit}</span>}
      {sub  && <span className="text-sm font-semibold ml-1" style={{ color, opacity: 0.8 }}>{sub}</span>}
    </div>
    <div className="text-xs text-slate-400 font-semibold mt-1.5 uppercase tracking-widest">{label}</div>
  </div>
)

const Divider = () => <div className="w-px h-14 bg-blue-100" />

export default function StatsStrip() {
  const stats = [t.countries, t.co2, t.ecoRating]
  return (
    <div className="border-b border-blue-100" style={{ background: '#FFFFFF' }}>
      <div className="max-w-[1280px] mx-auto px-8 py-10 flex items-center justify-center">
        <div className="flex items-center">
          {stats.map((s, i) => (
            <div key={s.label} className="flex items-center">
              {i > 0 && <Divider />}
              <Stat {...s} color={COLORS[i]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
