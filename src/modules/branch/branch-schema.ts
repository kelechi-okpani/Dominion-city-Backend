import { gql } from 'apollo-server-express';
import { UserRole } from "./model/branch-model.js";

export interface BranchProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  branch_location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface CreateBranchInput {
  fullName: string;
  email: string;
  password: string;
  branch_location: string;
}


export const branchCoreTypeDefs = gql`
  enum Role {
    ADMIN
    USER
  }

  type BranchProfile {
    id: ID!
    branchName: String!
    branchId: String!
    email: String!
    role: Role!
    location: String
    isActive: Boolean
    createdAt: String
    updatedAt: String
  }

  extend type Query {
    # Returns the currently logged-in account (HQ or Satellite)
    me: BranchProfile
    
    # ADMIN ONLY: Returns all registered satellite branches
    getSatelliteBranches: [BranchProfile]
  }

  extend type Mutation {
    # Public/Self-Service: Create a new satellite branch account
    # Note: Returns the profile, but isActive will be false by default
    registerSatellite(
      branchName: String!, 
      branchId: String!, 
      email: String!, 
      password: String,
      location: String
    ): BranchProfile
  }
`;