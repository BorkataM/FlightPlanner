import { createContext, useContext, useReducer, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { aiApi, flightsApi, getStoredToken } from '../../services/api'
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
  const navigate = useNavigate()

  const sendMessage = useCallback(async (message: string) => {
    dispatch({ type: 'ADD_TURN', turn: { role: 'user', content: message } })
    dispatch({ type: 'SET_LOADING', value: true })

    const history: AiChatHistoryMessage[] = state.turns
      .slice(-MAX_HISTORY)
      .map(t => ({ role: t.role, content: t.rawContent ?? t.content }))

    try {
      const res = await aiApi.chat(message, history)

      const checkoutData = res.checkoutData
      const isBookingRequest = /\b(book|reserve|purchase|buy)\b/i.test(message)

      let flights: FlightDto[] | undefined
      if (isBookingRequest && res.flightIdsMentioned?.length) {
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
          role:       'assistant',
          content:    res.message.replace(/\[flight_id:\s*\d+\]/g, '').trim(),
          rawContent: res.message,
          flights:    flights?.length ? flights : undefined,
          toolsUsed:  res.toolCallsMade,
        },
      })

      const bookingInitiated = res.toolCallsMade?.includes('initiate_booking')

      if (bookingInitiated && checkoutData?.flightId) {
        const flightId = checkoutData.flightId
        try {
          setIsOpen(false)
          const flight =
            flights?.find(f => f.id === flightId) ??
            await flightsApi.getById(flightId)
          const tok = getStoredToken()
          navigate('/booking', {
            state: {
              outbound:    flight,
              ret:         null,
              totalPrice:  flight.price,
              isRoundTrip: false,
              fromCity:    checkoutData.departureCity ?? flight.departureCity ?? '',
              toCity:      checkoutData.arrivalCity   ?? flight.arrivalCity   ?? '',
              token:       tok,
              passenger:   checkoutData.passenger,
            },
          })
        } catch (navErr) {
          console.error('[ChatContext] Navigation to booking failed:', navErr)
          dispatch({
            type: 'ADD_TURN',
            turn: {
              role:    'assistant',
              content: 'I prepared your checkout but had trouble opening the payment page. Please try booking again.',
              isError: true,
            },
          })
        }
      } else if (bookingInitiated && !checkoutData?.flightId) {
        console.warn('[ChatContext] initiate_booking called but checkoutData.flightId is missing:', checkoutData)
      }
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
