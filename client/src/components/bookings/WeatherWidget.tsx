import { useEffect, useState } from 'react'
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog,
  Wind, Droplets, CloudOff,
} from 'lucide-react'
import { weatherApi, type WeatherForecast, type DelayRisk } from '../../services/api'

const FORECAST_WINDOW_DAYS = 5

function WeatherIcon({ condition, className }: { condition: string; className?: string }) {
  const cls = className ?? 'w-5 h-5'
  switch (condition) {
    case 'Clear':        return <Sun            className={`${cls} text-amber-400`}   />
    case 'Clouds':       return <Cloud          className={`${cls} text-slate-400`}   />
    case 'Rain':         return <CloudRain      className={`${cls} text-blue-400`}    />
    case 'Drizzle':      return <CloudRain      className={`${cls} text-blue-300`}    />
    case 'Snow':         return <CloudSnow      className={`${cls} text-sky-400`}     />
    case 'Thunderstorm': return <CloudLightning className={`${cls} text-violet-500`}  />
    case 'Fog':
    case 'Mist':
    case 'Haze':         return <CloudFog       className={`${cls} text-slate-400`}   />
    default:             return <Cloud          className={`${cls} text-slate-300`}   />
  }
}

const RISK_STYLE = {
  Low:    { dot: 'bg-emerald-400', text: 'text-emerald-600', badge: 'bg-emerald-50 border-emerald-100' },
  Medium: { dot: 'bg-amber-400',   text: 'text-amber-600',   badge: 'bg-amber-50  border-amber-100'  },
  High:   { dot: 'bg-red-400',     text: 'text-red-600',     badge: 'bg-red-50    border-red-100'    },
} as const

interface Props { flightId: number }

export default function WeatherWidget({ flightId }: Props) {
  const [risk,    setRisk]    = useState<DelayRisk | null>(null)
  const [dest,    setDest]    = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [tooFar,  setTooFar]  = useState(false)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    weatherApi.getDelayRisk(flightId)
      .then(r => {
        const daysOut = (new Date(r.departureWeather.forecastTimeUtc).getTime() - Date.now()) / 86_400_000
        if (daysOut > FORECAST_WINDOW_DAYS) setTooFar(true)
        else setRisk(r)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [flightId])

  useEffect(() => {
    weatherApi.getDestinationForecast(flightId).then(setDest).catch(() => {})
  }, [flightId])

  const riskKey = (risk?.risk ?? 'Low') as keyof typeof RISK_STYLE
  const riskStyle = RISK_STYLE[riskKey] ?? RISK_STYLE.Low

  if (loading) return <WeatherSkeleton />

  if (tooFar) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-sky-50 rounded-xl border border-sky-100">
        <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
        <span className="text-xs text-sky-600 font-medium">Weather forecast available closer to departure</span>
      </div>
    )
  }

  if (error && !dest) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
        <CloudOff className="w-4 h-4 text-slate-300 shrink-0" />
        <span className="text-xs text-slate-400">Weather data unavailable</span>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* Delay risk row */}
      {risk && (
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${riskStyle.badge}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${riskStyle.dot}`} />
          <span className={`text-xs font-bold ${riskStyle.text}`}>
            {risk.risk} delay risk
          </span>
          <span className="text-xs text-slate-400 ml-1">- {risk.reason}</span>
        </div>
      )}

      {/* Weather cards */}
      {(risk?.departureWeather || dest) && (
        <div className="grid grid-cols-2 gap-3">
          {risk?.departureWeather && (
            <WeatherCard label="Departure" weather={risk.departureWeather} />
          )}
          {dest && (
            <WeatherCard label="Destination" weather={dest} />
          )}
        </div>
      )}
    </div>
  )
}

function WeatherCard({ label, weather }: { label: string; weather: WeatherForecast }) {
  return (
    <div className="bg-gradient-to-br from-sky-50 to-slate-50 rounded-xl border border-slate-100 px-5 py-4">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{label}</div>
      <div className="flex items-center gap-3 mb-3">
        <WeatherIcon condition={weather.condition} className="w-8 h-8" />
        <div>
          <div className="text-2xl font-black text-slate-900 leading-none">{Math.round(weather.temperatureC)}°C</div>
          <div className="text-xs text-slate-500 capitalize mt-1">{weather.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Wind className="w-3.5 h-3.5" />{weather.windSpeedKmh} km/h
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="w-3.5 h-3.5" />{weather.humidity}%
        </span>
        <span className="ml-auto font-semibold text-slate-500">{weather.city}</span>
      </div>
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {[0, 1].map(i => (
        <div key={i} className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 space-y-2 animate-pulse">
          <div className="h-2.5 w-16 bg-slate-200 rounded" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-200 rounded-full" />
            <div className="space-y-1.5">
              <div className="h-4 w-10 bg-slate-200 rounded" />
              <div className="h-2 w-14 bg-slate-200 rounded" />
            </div>
          </div>
          <div className="h-2 w-24 bg-slate-200 rounded" />
        </div>
      ))}
    </div>
  )
}
