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
    date: String
    createdAt: String
  }

  input CreateSoulWinningInput {
    name: String!
    phone: String!
    category: String!
    service: String!
    serviceDesc: String
    address: String
  }

  extend type Query {
    # HQ sees all souls won across branches; Satellites see their list
    getSoulWinningList(branchId: ID, category: String, page: Int, limit: Int): [SoulWinning]
    getSoulWinningStats(branchId: ID): SoulWinningStats
  }

  type SoulWinningStats {
    totalFirstTimers: Int
    totalNewConverts: Int
    grandTotal: Int
  }

  extend type Mutation {
    addSoul(input: CreateSoulWinningInput!): SoulWinning
    deleteSoul(id: ID!): String
  }
`;