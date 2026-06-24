import { useState, useRef } from 'react'
import { Send } from 'lucide-react'

interface Props {
  onSend:      (message: string) => void
  isLoading:   boolean
  placeholder: string
  sendLabel:   string
}

export default function ChatInput({ onSend, isLoading, placeholder, sendLabel }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2 px-3 py-3 border-t border-white/20 dark:border-white/10 bg-white/10 dark:bg-black/10 backdrop-blur-md rounded-b-3xl relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isLoading}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none rounded-2xl border border-white/40 dark:border-white/15 bg-white/50 dark:bg-white/8 backdrop-blur-sm px-3 py-2 text-[13px] text-slate-800 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50 disabled:opacity-50 transition-all leading-relaxed"
        style={{ maxHeight: '96px', overflowY: 'auto' }}
        aria-label={placeholder}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || isLoading}
        aria-label={sendLabel}
        className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}
