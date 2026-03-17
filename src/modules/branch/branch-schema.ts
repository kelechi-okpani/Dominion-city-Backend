import { gql } from 'apollo-server-express';

export const branchCoreTypeDefs = gql`
  enum Role {
    ADMIN
    USER
  }

enum AbujaBranchName {
    ABUJA_HQ
    WUSE
    JABI
    GWARINPA
    APO
    LUGBE
    KUJE
    KUBWA
    MAITAMA
    ASOKORO
    GARKI
    UTAKO
    NYANYA_MARARABA
    DAWAKI
  }


  type BranchProfile {
    id: ID!
    fullName: String!
    email: String!
    role: Role!
    branchName: AbujaBranchName!
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
  }

  extend type Mutation {
    # Self-registration for branches
    register(
      fullName: String!, 
      email: String!, 
      password: String!,
      branchName: AbujaBranchName!
    ): BranchProfile

    # Login for both ADMIN and USER
    login(email: String!, password: String!): LoginResponse
  }
`;