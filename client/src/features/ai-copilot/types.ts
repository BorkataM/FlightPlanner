import type { FlightDto } from '../search/types'

export type ChatRole = 'user' | 'assistant'

export interface ChatTurn {
  role:      ChatRole
  content:   string
  flights?:  FlightDto[]
  toolsUsed?: string[]
  isError?:  boolean
}
