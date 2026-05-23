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
    <div className="border-b border-white/[0.10]" style={{ background: 'rgba(13,28,54,0.98)' }}>
      <div className="max-w-[1280px] mx-auto px-8 py-6 flex items-center justify-between divide-x divide-white/[0.12]">
        {en.guarantees.map((item, i) => (
          <div key={item.title} className="flex items-center gap-3 px-8 first:pl-0 last:pr-0">
            <span className="text-gray-400">{ICONS[i]}</span>
            <div>
              <div className="text-white text-sm font-semibold">{item.title}</div>
              <div className="text-gray-500 text-xs">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
