import { en } from '../../localization/en'

const t = en.stats

const Stat = ({ value, unit, label, sub }: { value: string; unit?: string; label: string; sub?: string }) => (
  <div className="flex flex-col items-center px-10">
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-extrabold teal-text-glow" style={{ color: '#00E5CC' }}>{value}</span>
      {unit && <span className="text-base font-semibold text-gray-400">{unit}</span>}
      {sub  && <span className="text-sm font-semibold ml-1" style={{ color: '#00E5CC', opacity: 0.8 }}>{sub}</span>}
    </div>
    <div className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">{label}</div>
  </div>
)

const Divider = () => <div className="w-px h-12 bg-white/[0.15]" />

export default function StatsStrip() {
  return (
    <div className="border-b border-white/[0.10]" style={{ background: 'rgba(11,24,46,0.97)' }}>
      <div className="max-w-[1280px] mx-auto px-8 py-8 flex items-center justify-center">
        <div className="flex items-center">
          <Stat {...t.countries} />
          <Divider />
          <Stat {...t.co2} />
          <Divider />
          <Stat {...t.ecoRating} />
        </div>
      </div>
    </div>
  )
}
