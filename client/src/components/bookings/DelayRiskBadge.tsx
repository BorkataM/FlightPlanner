import { useEffect, useState } from 'react'
import { weatherApi, type DelayRisk } from '../../services/api'

const COLORS = {
  Low:    'bg-emerald-50 text-emerald-600 border-emerald-100',
  Medium: 'bg-amber-50  text-amber-600  border-amber-100',
  High:   'bg-red-50    text-red-600    border-red-100',
} as const

interface Props { flightId: number }

export default function DelayRiskBadge({ flightId }: Props) {
  const [data,  setData]  = useState<DelayRisk | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    weatherApi.getDelayRisk(flightId)
      .then(setData)
      .catch(() => setError(true))
  }, [flightId])

  if (error || !data) return null

  const cls = COLORS[data.risk] ?? COLORS.Low

  return (
    <div
      title={data.reason}
      className={`text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full border cursor-default ${cls}`}
    >
      {data.risk} delay risk
    </div>
  )
}
