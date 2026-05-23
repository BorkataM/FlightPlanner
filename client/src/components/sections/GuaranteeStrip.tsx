import { MapPin, Calendar, Headphones, Users } from 'lucide-react'
import { en } from '../../localization/en'

const ICONS = [
  <MapPin className="w-5 h-5" />,
  <Calendar className="w-5 h-5" />,
  <Headphones className="w-5 h-5" />,
  <Users className="w-5 h-5" />,
]

export default function GuaranteeStrip() {
  return (
    <div className="border-b border-slate-100" style={{ background: '#F8FAFC' }}>
      <div className="max-w-[1280px] mx-auto px-8 py-6 flex items-center justify-between divide-x divide-slate-100">
        {en.guarantees.map((item, i) => (
          <div key={item.title} className="flex items-center gap-3 px-8 first:pl-0 last:pr-0">
            <span className="text-violet-500">{ICONS[i]}</span>
            <div>
              <div className="text-slate-800 text-sm font-semibold">{item.title}</div>
              <div className="text-slate-400 text-xs">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
