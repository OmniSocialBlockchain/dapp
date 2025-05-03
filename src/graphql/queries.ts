import { gql } from '@apollo/client';

export const PROFILE_AND_REPUTATION_QUERY = gql`
  query Profile($wallet: ID!, $domain: String!) {
    wallet(id: $wallet) {
      id
      personas {
        id
        username
        image
      }
    }
    reputation(id: $wallet, domain: $domain) {
      score
      lastUpdated
    }
  }
`; 