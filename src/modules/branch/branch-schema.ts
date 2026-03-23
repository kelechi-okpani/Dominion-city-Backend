import { gql } from 'apollo-server-express';

export const branchCoreTypeDefs = gql`
  enum Role {
    ADMIN
    USER
  }

  # 1. This is the new Branch type representing your MongoDB collection
  type Branch {
    id: ID!
    name: String!
    enumValue: String!
    isActive: Boolean
  }

  type BranchProfile {
    id: ID!
    fullName: String!
    email: String!
    role: Role!
    # 2. IMPORTANT: Change this from 'AbujaBranchName' to 'Branch'
    branch: Branch! 
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  type LoginResponse {
    token: String!
    user: BranchProfile!
  }

  extend type Query {
    me: BranchProfile
    getSatelliteBranches: [BranchProfile]
    # 3. Add this so the frontend can fetch the seeded branches
    getAllBranches: [Branch!]!
  }

  extend type Mutation {
    register(
      fullName: String!, 
      email: String!, 
      password: String!,
      # 4. Change this from 'AbujaBranchName' to 'ID'
      branchId: ID! 
    ): BranchProfile

    login(email: String!, password: String!): LoginResponse
  }
`;