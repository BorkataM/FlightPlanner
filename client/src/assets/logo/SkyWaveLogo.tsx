interface Props {
  className?: string
  idSuffix?:  string
}

export default function SkyWaveLogo({ className = 'w-8 h-8', idSuffix = '' }: Props) {
  const clipId = `skywave-clip${idSuffix}`
  const gradId = `skywave-grad${idSuffix}`

  return (
    <svg className={className} viewBox="0 0 40 40" fill="none">
      <defs>
        <clipPath id={clipId}>
          <circle cx="20" cy="20" r="16.5" />
        </clipPath>
        <linearGradient id={gradId} x1="20" y1="3" x2="20" y2="37" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#5EEAD4" />
          <stop offset="100%" stopColor="#0E7490" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="16.5" stroke={`url(#${gradId})`} strokeWidth="2" />
      <g clipPath={`url(#${clipId})`}>
        <path d="M3 24 C4 13 14 12 16 22 C18 29 24 31 29 25 C33 20 36 22 37 25 L37 40 L3 40 Z" fill={`url(#${gradId})`} />
      </g>
      <g transform="rotate(40, 20, 16)" fill="#B2F5EA">
        <ellipse cx="20" cy="16" rx="2" ry="8.5" />
        <path d="M18 14 L7 20 L10 21.5 L18 17.5 L22 17.5 L30 21.5 L33 20 L22 14Z" />
        <path d="M18 22 L13 25 L16 26 L18 24 L22 24 L24 26 L27 25 L22 22Z" />
      </g>
    </svg>
  )
}
