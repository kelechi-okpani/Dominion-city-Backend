import { gql } from 'apollo-server-express';

export const cellTypeDefs = gql`
  # 1. Define the Enum for strict validation
  enum CellType {
    CELL
    ZONE
  }

  type Cell {
    id: ID!
    branchId: ID!
    cellName: String!
    leader: String!
    locality: String!
    meetingDay: String!
    type: CellType!   # Uses the Enum
    memberCount: Int
    status: String
    createdAt: String
  }

  input CreateCellInput {
    branchId: ID!     # Usually required for creation
    cellName: String!    
    leader: String!      
    locality: String!    
    meetingDay: String!  
    memberCount: Int     
    type: CellType!   # REQUIRED when creating: Must be CELL or ZONE
  }

  input UpdateCellInput {
    branchId: ID
    cellName: String
    leader: String
    locality: String
    meetingDay: String
    memberCount: Int
    type: CellType    # Optional for updates
    status: String
  }

  extend type Query {
    getBranchCells(branchId: ID!): [Cell]
    getCellById(id: ID!): Cell
  }

  extend type Mutation {
    createCell(input: CreateCellInput!): Cell
    updateCell(id: ID!, input: UpdateCellInput!): Cell
    deleteCell(id: ID!): String
  }
`;