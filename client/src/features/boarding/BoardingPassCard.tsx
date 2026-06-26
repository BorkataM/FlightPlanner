import { Plane } from 'lucide-react'
import AirlineLogo from '../search/AirlineLogo'
import { type CardProps, genGate, genTerminal } from './boardingPass'

function Barcode({ seed, width = 240 }: { seed: string; width?: number }) {
  const ws: number[] = [2, 1, 1, 1, 2]
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i)
    ws.push((c & 3) + 1, ((c >> 2) & 1) + 1, ((c >> 3) & 3) + 1, ((c >> 5) & 1) + 1, ((c >> 6) & 1) + 1, 1)
  }
  ws.push(2, 1, 1, 1, 2)
  const total = ws.reduce((s, w) => s + w, 0)
  const H = 60
  const u = width / total
  let x = 0
  const rects: string[] = []
  ws.forEach((w, i) => {
    const px = w * u
    if (i % 2 === 0)
      rects.push(`<rect x="${x.toFixed(2)}" y="0" width="${Math.max(0.5, px).toFixed(2)}" height="${H}" fill="#1e293b"/>`)
    x += px
  })
  return (
    <div dangerouslySetInnerHTML={{
      __html: `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${H}" viewBox="0 0 ${width} ${H}">${rects.join('')}</svg>`
    }} />
  )
}

export function BoardingPassCard(p: CardProps) {
  const c        = p.compact
  const gate     = genGate(p.flightNum)
  const terminal = genTerminal(p.depCode)
  const fullName = `${p.passenger.firstName} ${p.passenger.lastName}`.toUpperCase()
  const isReturn = p.direction === 'Return'

  const leftBg = isReturn
    ? 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)'
    : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
  const accent = isReturn ? 'text-violet-600' : 'text-blue-600'

  /* size tokens: compact (side-by-side) vs full (single) */
  const pad      = c ? 'p-7'     : 'p-8'
  const codeFs   = c ? '52px'    : '60px'
  const cityFs   = c ? '12px'    : '14px'
  const timeFs   = c ? '28px'    : '32px'
  const mbBadge  = c ? 'mb-5'    : 'mb-6'
  const mbHero   = c ? 'mb-5'    : 'mb-6'
  const mbDate   = c ? 'mb-5'    : 'mb-7'
  const planeW   = c ? 'w-7 h-7' : 'w-8 h-8'
  const stripLbl = '9px'
  const stripVal = c ? '13px'    : '15px'
  const rPad     = c ? 'p-5'     : 'p-6'
  const rCodeFs  = c ? '18px'    : '20px'
  const rCityFs  = c ? '10px'    : '11px'
  const rTimeFs  = c ? '17px'    : '18px'
  const rPassFs  = c ? '12px'    : '13px'
  const rSeatFs  = c ? '17px'    : '18px'
  const barcodeW = c ? 230       : 260

  return (
    <div className="relative w-full">
      {/* perforated notch cutouts */}
      <div
        className="absolute z-10 w-7 h-4 bg-slate-50 rounded-b-full"
        style={{ top: -1, left: 'calc(62% - 14px)', border: '1px solid #e2e8f0', borderTop: 'none' }}
      />
      <div
        className="absolute z-10 w-7 h-4 bg-slate-50 rounded-t-full"
        style={{ bottom: -1, left: 'calc(62% - 14px)', border: '1px solid #e2e8f0', borderBottom: 'none' }}
      />

      <div className="flex rounded-3xl overflow-hidden" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.13)' }}>

        {/* LEFT */}
        <div
          className={`relative text-white overflow-hidden ${pad}`}
          style={{ flex: '0 0 62%', background: leftBg }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.13) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute top-3 right-6 w-40 h-40 rounded-full border border-white opacity-10" />
          <div className="absolute top-10 right-14 w-28 h-28 rounded-full border border-white opacity-[0.07]" />

          {/* direction badge + airline logo */}
          <div className={`relative flex items-center gap-2 ${mbBadge}`}>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
              <Plane className="w-3 h-3" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">{p.direction}</span>
            </div>
            <AirlineLogo flightNumber={p.flightNum} size={26} className="ring-1 ring-white/40" />
          </div>

          {/* FROM ✈ TO */}
          <div className={`relative flex items-center gap-4 ${mbHero}`}>
            <div className="shrink-0">
              <div className="text-[10px] font-bold tracking-[0.2em] opacity-60 mb-0.5">FROM</div>
              <div className="font-black tracking-tight leading-none" style={{ fontSize: codeFs }}>{p.depCode}</div>
              <div className="font-bold opacity-80 mt-1 tracking-widest uppercase" style={{ fontSize: cityFs }}>{p.depCity}</div>
            </div>
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <div className="flex-1 h-px bg-white/30" />
              <Plane className={`${planeW} opacity-90 shrink-0`} />
              <div className="flex-1 h-px bg-white/30" />
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-bold tracking-[0.2em] opacity-60 mb-0.5">TO</div>
              <div className="font-black tracking-tight leading-none" style={{ fontSize: codeFs }}>{p.arrCode}</div>
              <div className="font-bold opacity-80 mt-1 tracking-widest uppercase" style={{ fontSize: cityFs }}>{p.arrCity}</div>
            </div>
          </div>

          {/* date + times */}
          <div className={`relative ${mbDate}`}>
            <div className="text-[13px] font-bold opacity-70 mb-1">{p.dateStr}</div>
            <div className="flex items-baseline gap-4">
              <span className="font-black tabular-nums" style={{ fontSize: timeFs }}>{p.depTime}</span>
              <span className="opacity-40 text-xl">—</span>
              <span className="font-black tabular-nums" style={{ fontSize: timeFs }}>{p.arrTime}</span>
            </div>
          </div>

          {/* bottom strip */}
          <div className="relative flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-white/20">
            {(
              [
                ['Passenger', fullName],
                ['Flight',    p.flightNum],
                ['Seat',      p.seat],
                ['Gate',      gate],
                ['Terminal',  terminal],
              ] as [string, string][]
            ).map(([lbl, val]) => (
              <div key={lbl}>
                <div className="font-bold tracking-[0.15em] opacity-55 uppercase" style={{ fontSize: stripLbl }}>{lbl}</div>
                <div className="font-black mt-0.5 max-w-[140px] truncate" style={{ fontSize: stripVal }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SEPARATOR */}
        <div className="self-stretch shrink-0" style={{ width: 2, borderLeft: '2px dashed #cbd5e1' }} />

        {/* RIGHT */}
        <div className={`flex-1 bg-white ${rPad} flex flex-col justify-between min-w-0`}>
          <div>
            <div className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase mb-5">
              Boarding Pass
            </div>

            <div className="space-y-3">
              <div className="flex gap-6">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">From</div>
                  <div className={`font-black leading-tight ${accent}`} style={{ fontSize: rCodeFs }}>{p.depCode}</div>
                  <div className="text-slate-500 font-semibold truncate" style={{ fontSize: rCityFs }}>{p.depCity}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">To</div>
                  <div className={`font-black leading-tight ${accent}`} style={{ fontSize: rCodeFs }}>{p.arrCode}</div>
                  <div className="text-slate-500 font-semibold truncate" style={{ fontSize: rCityFs }}>{p.arrCity}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Date</div>
                  <div className="text-[10px] font-bold text-slate-700">{p.dateStr}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Flight</div>
                  <div className="text-[10px] font-bold text-slate-700">{p.flightNum}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Departs</div>
                  <div className="font-black text-slate-800 tabular-nums" style={{ fontSize: rTimeFs }}>{p.depTime}</div>
                </div>
                <div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Arrives</div>
                  <div className="font-black text-slate-800 tabular-nums" style={{ fontSize: rTimeFs }}>{p.arrTime}</div>
                </div>
              </div>

              <div>
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Passenger</div>
                <div className={`font-black truncate ${accent}`} style={{ fontSize: rPassFs }}>{fullName}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                {(
                  [['Seat', p.seat], ['Gate', gate], ['Trm', terminal]] as [string, string][]
                ).map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{lbl}</div>
                    <div className={`font-black ${accent}`} style={{ fontSize: rSeatFs }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <Barcode seed={p.bookingRef + p.flightNum + p.depCode + p.arrCode} width={barcodeW} />
            <div className="mt-2 text-center">
              <div className="text-[8px] font-mono text-slate-400 tracking-[0.06em]">{p.bookingRef}</div>
              <div className={`text-[9px] font-black tracking-tight mt-0.5 ${accent}`}>SkyWave</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
