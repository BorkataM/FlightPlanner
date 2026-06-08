import { createContext, useContext, useReducer, useCallback, useState } from 'react'
import { aiApi, flightsApi } from '../../services/api'
import type { AiChatHistoryMessage } from '../../services/api'
import type { ChatTurn } from './types'
import type { FlightDto } from '../search/types'

interface ChatState {
  turns:     ChatTurn[]
  isLoading: boolean
}

type Action =
  | { type: 'ADD_TURN';   turn:  ChatTurn }
  | { type: 'SET_LOADING'; value: boolean }

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case 'ADD_TURN':    return { ...state, turns: [...state.turns, action.turn] }
    case 'SET_LOADING': return { ...state, isLoading: action.value }
  }
}

interface ChatContextValue {
  turns:       ChatTurn[]
  isLoading:   boolean
  isOpen:      boolean
  setIsOpen:   (open: boolean) => void
  sendMessage: (message: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

const MAX_HISTORY = 12

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { turns: [], isLoading: false })
  const [isOpen, setIsOpen] = useState(false)

  const sendMessage = useCallback(async (message: string) => {
    dispatch({ type: 'ADD_TURN', turn: { role: 'user', content: message } })
    dispatch({ type: 'SET_LOADING', value: true })

    const history: AiChatHistoryMessage[] = state.turns
      .slice(-MAX_HISTORY)
      .map(t => ({ role: t.role, content: t.content }))

    try {
      const res = await aiApi.chat(message, history)

      let flights: FlightDto[] | undefined
      if (res.flightIdsMentioned?.length) {
        const settled = await Promise.allSettled(
          res.flightIdsMentioned.map(id => flightsApi.getById(id))
        )
        flights = settled
          .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof flightsApi.getById>>> =>
            r.status === 'fulfilled'
          )
          .map(r => r.value)
      }

      dispatch({
        type: 'ADD_TURN',
        turn: {
          role:      'assistant',
          content:   res.message,
          flights:   flights?.length ? flights : undefined,
          toolsUsed: res.toolCallsMade,
        },
      })
    } catch (err) {
      dispatch({
        type: 'ADD_TURN',
        turn: {
          role:    'assistant',
          content: err instanceof Error ? err.message : 'Something went wrong.',
          isError: true,
        },
      })
    } finally {
      dispatch({ type: 'SET_LOADING', value: false })
    }
  }, [state.turns])

  return (
    <ChatContext.Provider value={{ turns: state.turns, isLoading: state.isLoading, isOpen, setIsOpen, sendMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
