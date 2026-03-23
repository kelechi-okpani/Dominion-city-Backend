import { gql } from 'apollo-server-express';

export const soulWinningTypeDefs = gql`
  type SoulWinning {
    id: ID!
    branchId: ID!
    name: String!
    phone: String!
    category: String!
    service: String!
    serviceDesc: String
    address: String
    addedBy: ID
    date: String
    createdAt: String
  }

  type SoulWinningStats {
    totalFirstTimers: Int
    totalNewConverts: Int
    grandTotal: Int
  }

  input SoulWinningInput {
    name: String!
    phone: String!
    category: String!
    service: String!
    serviceDesc: String
    address: String
    branchId: ID # Optional: Used by HQ to assign souls to branches
  }

  extend type Query {
    getSoulWinningList(branchId: ID, category: String, page: Int, limit: Int): [SoulWinning]
    getSoulWinningStats(branchId: ID): SoulWinningStats
  }

  extend type Mutation {
    addSoul(input: SoulWinningInput!): SoulWinning
    updateSoul(id: ID!, input: SoulWinningInput!): SoulWinning
    deleteSoul(id: ID!): String
  }
`;