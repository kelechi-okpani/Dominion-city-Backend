// src/modules/typeDefs.ts
import { gql } from 'apollo-server-express';

export const commonTypeDefs = gql`
  scalar Date

  enum Role {
    ADMIN        # DC-HQ
    USER         # DC-Satellite Branch
  }

  # AuthPayload is common across login/register mutations
  type AuthPayload {
    token: String!
    user: BranchProfile! 
  }

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;