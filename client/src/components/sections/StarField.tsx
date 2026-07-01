import { useEffect, useRef } from 'react'

interface Star {
  x:            number
  y:            number
  radius:       number
  baseOpacity:  number
  twinkleSpeed: number
  twinklePhase: number
}

interface Props {
  active: boolean
}

export default function StarField({ active }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const activeRef  = useRef(active)

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const STAR_COUNT = 220
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
      const skyBias = Math.random() < 0.85
      return {
        x:            Math.random(),
        y:            skyBias ? Math.random() * 0.72 : Math.random(),
        radius:       Math.random() < 0.06 ? Math.random() * 1.4 + 1.0
                    : Math.random() * 0.9  + 0.25,
        baseOpacity:  Math.random() * 0.55 + 0.35,
        twinkleSpeed: Math.random() * 1.4  + 0.4,
        twinklePhase: Math.random() * Math.PI * 2,
      }
    })

    let animId: number
    let t = 0

    const draw = () => {
      animId = requestAnimationFrame(draw)
      if (!activeRef.current) return   // invisible - skip GPU work

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      t += 0.016

      for (const s of stars) {
        const twinkle = Math.sin(t * s.twinkleSpeed + s.twinklePhase) * 0.22
        const alpha   = Math.max(0, Math.min(1, s.baseOpacity + twinkle))

        if (s.radius > 1.0) {
          const glow = ctx.createRadialGradient(
            s.x * canvas.width, s.y * canvas.height, 0,
            s.x * canvas.width, s.y * canvas.height, s.radius * 3,
          )
          glow.addColorStop(0, `rgba(200,220,255,${alpha * 0.5})`)
          glow.addColorStop(1, 'rgba(200,220,255,0)')
          ctx.beginPath()
          ctx.arc(s.x * canvas.width, s.y * canvas.height, s.radius * 3, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220,235,255,${alpha})`
        ctx.fill()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex:     1,
        opacity:    active ? 1 : 0,
        transition: 'opacity 0.7s ease',
      }}
    />
  )
}
