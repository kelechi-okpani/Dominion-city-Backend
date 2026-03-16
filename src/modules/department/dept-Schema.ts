import { gql } from 'apollo-server-express';

export const departmentTypeDefs = gql`
  type Department {
    id: ID!
    name: String!
    lead: String
    description: String
    status: String
    branchId: ID!
    memberCount: Int 
    # This was causing the error because DepartmentMember wasn't defined below
    members(page: Int, limit: Int): [DepartmentMember]
  }

  # Define the missing type here
  type DepartmentMember {
    id: ID!
    deptId: ID!
    name: String!
    phone: String
    email: String
    initials: String
    joined: String
  }

  input CreateDepartmentInput {
    name: String!
    lead: String
    description: String
    status: String
  }

  # Input for the addMember mutation we built in the resolver
  input AddMemberToDeptInput {
    deptId: ID!
    name: String!
    phone: String
    email: String
  }

  extend type Query {
    getBranchDepartments(page: Int, limit: Int): [Department]
    getDepartmentById(id: ID!): Department
  }

  extend type Mutation {
    createDepartment(input: CreateDepartmentInput!): Department
    addMemberToDepartment(input: AddMemberToDeptInput!): DepartmentMember
    updateDepartment(id: ID!, name: String, lead: String, status: String, description: String): Department
  }
`;