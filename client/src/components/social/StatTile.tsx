interface Props {
  icon:  React.ElementType
  value: number | string
  label: string
  color: string
}

export default function StatTile({ icon: Icon, value, label, color }: Props) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-3 flex-1">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">{value}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">{label}</span>
    </div>
  )
}
