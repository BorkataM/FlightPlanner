import { useEffect, useRef } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { useChat } from './ChatContext'
import ChatMessageList from './ChatMessageList'
import ChatInput from './ChatInput'

function GreetingCard({
  greeting,
  firstName,
  suggestions,
  onSuggestion,
}: {
  greeting:     string
  firstName:    string
  suggestions:  readonly string[]
  onSuggestion: (s: string) => void
}) {
  const text = greeting.replace('{name}', firstName)
  return (
    <div className="px-4 pt-4 pb-2">
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 dark:from-slate-800 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-xl p-4">
        <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed mb-3">{text}</p>
        <div className="flex flex-col gap-1.5">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-left text-[12px] text-blue-600 hover:text-blue-800 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 border border-blue-100 dark:border-slate-600 rounded-lg px-3 py-2 transition-colors leading-snug"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { user } = useAuth()
  const { t }    = useLocale()
  const { turns, isLoading, isOpen, setIsOpen, sendMessage } = useChat()
  const panelRef = useRef<HTMLDivElement>(null)
  const ct = t.aiCopilot.chat

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, setIsOpen])

  // Only render for logged-in users
  if (!user) return null

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open SkyWave AI"
          aria-expanded={false}
          className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
        >
          <Sparkles className="w-6 h-6 text-white" />
          {/* Pulse ring */}
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="SkyWave AI chat"
          aria-modal="true"
          className="fixed bottom-6 right-6 z-[9999] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden
                     w-[370px] h-[580px]
                     max-sm:inset-0 max-sm:w-auto max-sm:h-auto max-sm:rounded-none"
        >
          {/* Header */}
          <div
            className="flex items-center gap-2.5 px-4 py-3 shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
          >
            <Sparkles className="w-4 h-4 text-white/90" />
            <span className="text-white font-semibold text-[14px] tracking-wide">{ct.title}</span>
            <span className="ml-1 text-white/60 text-[12px]">· {user.firstName}</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages or greeting */}
          {turns.length === 0 && !isLoading ? (
            <div className="flex-1 overflow-y-auto flex flex-col">
              <GreetingCard
                greeting={ct.greeting}
                firstName={user.firstName}
                suggestions={ct.suggestions}
                onSuggestion={sendMessage}
              />
            </div>
          ) : (
            <ChatMessageList
              turns={turns}
              isLoading={isLoading}
              emptyStateText={ct.emptyState}
            />
          )}

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            isLoading={isLoading}
            placeholder={ct.placeholder}
            sendLabel={ct.send}
          />
        </div>
      )}
    </>
  )
}
