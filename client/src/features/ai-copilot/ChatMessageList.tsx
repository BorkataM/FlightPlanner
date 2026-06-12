import { useEffect, useRef, useState } from 'react'
import type { ChatTurn } from './types'
import ChatFlightCard from './ChatFlightCard'

function useTypewriter(text: string, animate: boolean) {
  const [displayed, setDisplayed] = useState(animate ? '' : text)
  const [done, setDone] = useState(!animate)

  useEffect(() => {
    if (!animate) {
      setDisplayed(text)
      setDone(true)
      return
    }
    setDisplayed('')
    setDone(false)
    let i = 0
    // Aim for ~2 s total regardless of length; min 1 char per tick
    const charsPerTick = Math.max(1, Math.ceil(text.length / 120))
    const id = setInterval(() => {
      i = Math.min(i + charsPerTick, text.length)
      setDisplayed(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, 16)
    return () => clearInterval(id)
  }, [text, animate])

  return { displayed, done }
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 0.18, 0.36].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
          style={{ animationDelay: `${delay}s`, animationDuration: '0.9s' }}
        />
      ))}
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end px-3 py-1">
      <div
        className="max-w-[80%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13px] text-white leading-relaxed"
        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
      >
        {content}
      </div>
    </div>
  )
}

function AssistantBubble({ turn, animate }: { turn: ChatTurn; animate: boolean }) {
  const { displayed, done } = useTypewriter(turn.content, animate && !turn.isError)

  return (
    <div className="flex justify-start px-3 py-1">
      <div className="max-w-[90%]">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            turn.isError
              ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700'
          }`}
        >
          {displayed}
          {!done && (
            <span className="inline-block w-0.5 h-[1em] bg-slate-500 ml-0.5 align-text-bottom animate-pulse" />
          )}
        </div>
        {done && turn.flights?.map(f => (
          <ChatFlightCard key={f.id} flight={f} />
        ))}
      </div>
    </div>
  )
}

interface Props {
  turns:          ChatTurn[]
  isLoading:      boolean
  emptyStateText: string
}

export default function ChatMessageList({ turns, isLoading, emptyStateText }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isLoading])

  if (turns.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-slate-400 px-6 text-center">
        {emptyStateText}
      </div>
    )
  }

  const lastAssistantIdx = turns.reduce((acc, t, i) => t.role === 'assistant' ? i : acc, -1)

  return (
    <div className="flex-1 overflow-y-auto py-2" aria-live="polite" aria-label="Chat messages">
      {turns.map((turn, i) =>
        turn.role === 'user'
          ? <UserBubble key={i} content={turn.content} />
          : <AssistantBubble key={i} turn={turn} animate={i === lastAssistantIdx} />
      )}
      {isLoading && (
        <div className="flex justify-start px-3 py-1">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm">
            <TypingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
