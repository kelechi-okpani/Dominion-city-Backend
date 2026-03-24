import { gql } from 'apollo-server-express';

export const expenseTypeDefs = gql`
  type Expense {
    id: ID!
    branchId: ID!
    title: String!
    fullName: String!
    amount: Float!
    department: String!
    date: String!
    status: String!
    recordedBy: BranchProfile
    createdAt: String
    updatedAt: String
  }

  input CreateExpenseInput {
    title: String!
    fullName: String!
    amount: Float!
    department: String!
    date: String
    # Note: Status usually defaults to 'Pending' in the resolver
  }

  type CategorySummary {
    department: String!
    total: Float!
    percentage: Float!
  }

  type ExpenseStats {
    totalRecorded: Float! 
    primarySector: String!     
    categoryBreakdown: [CategorySummary]!
  }

  extend type Query {
    getBranchExpenses(branchId: ID): [Expense]
    getExpenseStats(branchId: ID): ExpenseStats
  }

  extend type Mutation {
    # Standard CRUD operations for tracking
    createExpense(input: CreateExpenseInput!, branchId: ID!): Expense
    updateExpenseStatus(id: ID!, status: String!): Expense
    deleteExpense(id: ID!): Boolean
  }
`;