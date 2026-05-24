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
    <div className="border-b border-blue-100" style={{ background: '#EFF6FF' }}>
      <div className="max-w-[1280px] mx-auto px-8 py-7 flex items-center justify-between gap-4">
        {en.guarantees.map((item, i) => (
          <div key={item.title} className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#EDE9FE,#DBEAFE)' }}>
              <span className="text-indigo-600">{ICONS[i]}</span>
            </div>
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
