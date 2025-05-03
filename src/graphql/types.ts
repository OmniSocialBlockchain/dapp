export interface Persona {
  id: string;
  username: string;
  image: string;
}

export interface Wallet {
  id: string;
  personas: Persona[];
}

export interface Reputation {
  score: number;
  lastUpdated: string;
}

export interface ProfileQueryVariables {
  wallet: string;
  domain: string;
}

export interface ProfileQueryResponse {
  wallet: Wallet;
  reputation: Reputation;
} 