import { gql } from 'apollo-server-express';

export const departmentTypeDefs = gql`
# --- CORE TYPES ---

type Department {
  id: ID!
  name: String!
  lead: String!        # The H.O.D / Unit Lead
  description: String
  status: String       # Active, Onboarding, Inactive
  branchId: ID!
  createdAt: String
  updatedAt: String
  
  memberCount: Int
  members(page: Int, limit: Int): [DepartmentMember]
}

type DepartmentMember {
  id: ID!
  deptId: ID!
  name: String!
  phone: String!
  email: String
  initials: String     # Automatically generated (e.g., "JD")
  joined: String       # ISO Date string
  createdAt: String
}

# --- INPUTS ---

input CreateDepartmentInput {
  name: String!
  lead: String!
  description: String
  status: String
}

input UpdateDepartmentInput {
  name: String
  lead: String
  description: String
  status: String
}

input AddMemberToDeptInput {
  deptId: ID!
  name: String!
  phone: String!
  email: String
}

# --- QUERIES & MUTATIONS ---

extend type Query {
  getBranchDepartments(page: Int, limit: Int): [Department]
  getDepartmentById(id: ID!): Department
}

extend type Mutation {
  createDepartment(input: CreateDepartmentInput!): Department
  addMemberToDepartment(input: AddMemberToDeptInput!): DepartmentMember
  updateDepartment(id: ID!, input: UpdateDepartmentInput!): Department
  removeMemberFromDepartment(memberId: ID!): String
}


`;