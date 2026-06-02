import { Plane, LayoutGrid, Wallet } from 'lucide-react'
import type { ElementType } from 'react'

interface Props {
  upcomingCount: number
  totalCount:    number
  totalSpent:    number
}

export default function BookingStatsBar({ upcomingCount, totalCount, totalSpent }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      <StatCard label="Upcoming"     value={String(upcomingCount)}           icon={Plane}      iconCls="text-blue-500"    bg="bg-blue-50"    />
      <StatCard label="Total flights" value={String(totalCount)}              icon={LayoutGrid} iconCls="text-violet-500"  bg="bg-violet-50"  />
      <StatCard label="Total spent"  value={`€${Math.round(totalSpent)}`}    icon={Wallet}     iconCls="text-emerald-600" bg="bg-emerald-50" />
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, iconCls, bg,
}: {
  label: string; value: string; icon: ElementType; iconCls: string; bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex flex-col gap-2">
      <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${iconCls}`} />
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900 leading-none">{value}</div>
        <div className="text-xs text-slate-400 font-medium mt-1">{label}</div>
      </div>
    </div>
  )
}
