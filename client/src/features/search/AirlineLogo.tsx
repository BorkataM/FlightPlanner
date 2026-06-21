import { useState } from 'react'
import { airlineLogoUrl } from './airlineLogos'

interface Props {
  flightNumber: string
  airlineName?: string
  size?:        number
  className?:   string
}

/** Airline logo from the Kiwi.com CDN, with an initials fallback. */
export default function AirlineLogo({ flightNumber, airlineName, size = 28, className = '' }: Props) {
  const url = airlineLogoUrl(flightNumber)
  const [failed, setFailed] = useState(false)
  const label = airlineName || flightNumber

  if (!url || failed) {
    const initials = airlineName
      ? airlineName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
      : (flightNumber.match(/^[A-Za-z]+/)?.[0] ?? '??').slice(0, 2).toUpperCase()
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        title={label}
        aria-label={label}
      >
        {initials}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={label}
      title={label}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-md object-contain bg-white shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
