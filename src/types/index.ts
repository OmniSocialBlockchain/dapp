export interface Persona {
  id: string
  name: string
  image?: string
  description?: string
}

export interface Activity {
  id: string
  type: string
  user: {
    address: string
    name: string
  }
  content: string
  timestamp: string
}

export interface Token {
  id: string
  name: string
  symbol: string
  balance: string
  value: string
}

export interface NFT {
  id: string
  name: string
  image: string
  description?: string
} 