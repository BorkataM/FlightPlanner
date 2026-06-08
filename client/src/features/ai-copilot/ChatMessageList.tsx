import { useEffect, useRef } from 'react'
import type { ChatTurn } from './types'
import ChatFlightCard from './ChatFlightCard'

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

function AssistantBubble({ turn }: { turn: ChatTurn }) {
  return (
    <div className="flex justify-start px-3 py-1">
      <div className="max-w-[90%]">
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
            turn.isError
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-slate-50 text-slate-800 border border-slate-100'
          }`}
        >
          {turn.content}
        </div>
        {turn.flights?.map(f => (
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

  return (
    <div className="flex-1 overflow-y-auto py-2" aria-live="polite" aria-label="Chat messages">
      {turns.map((turn, i) =>
        turn.role === 'user'
          ? <UserBubble key={i} content={turn.content} />
          : <AssistantBubble key={i} turn={turn} />
      )}
      {isLoading && (
        <div className="flex justify-start px-3 py-1">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-sm">
            <TypingDots />
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
