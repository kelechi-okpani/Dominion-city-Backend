import { gql } from 'apollo-server-express';

export const cellTypeDefs = gql`
  type Cell {
    id: ID!
    branchId: ID!
    cellName: String!
    leader: String!
    locality: String!
    meetingDay: String!
    type: String!
    memberCount: Int
    status: String
  }

  input CreateCellInput {
    cellName: String!
    leader: String!
    locality: String!
    type: String!
    meetingDay: String
    memberCount: Int
  }

  extend type Query {
    # HQ can see all cells; Satellites see only theirs
    getBranchCells(branchId: ID, type: String): [Cell]
    getCellById(id: ID!): Cell
  }

  extend type Mutation {
    createCell(input: CreateCellInput!): Cell
    updateCell(id: ID!, input: CreateCellInput): Cell
    deleteCell(id: ID!): String
  }
`;