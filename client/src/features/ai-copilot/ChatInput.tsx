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
    <div className="flex items-end gap-2 px-3 py-3 border-t border-slate-100 bg-white rounded-b-2xl">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={isLoading}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 disabled:opacity-50 transition-colors leading-relaxed"
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
