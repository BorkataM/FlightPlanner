export type SmartTag = 'bestValue' | 'eco' | null

export interface Destination {
  name: string
  country: string
  price: string
  image: string
  gradient: string
  smartScore: number
  tag: SmartTag
  liked: boolean
}
