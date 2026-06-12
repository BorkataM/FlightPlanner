import type { FlightDto } from '../search/types'

export type ChatRole = 'user' | 'assistant'

export interface ChatTurn {
  role:       ChatRole
  content:    string       // displayed to user (tags stripped)
  rawContent?: string      // sent to AI in history (tags preserved)
  flights?:   FlightDto[]
  toolsUsed?: string[]
  isError?:   boolean
}
