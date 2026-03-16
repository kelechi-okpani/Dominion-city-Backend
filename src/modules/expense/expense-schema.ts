import { gql } from 'apollo-server-express';

export const expenseTypeDefs = gql`
  type Expense {
    id: ID!
    branchId: ID!
    title: String!
    description: String
    amount: Float!
    category: String!
    department: String
    date: String!
    status: String!
    recordedBy: ID!
    createdAt: String
  }

  input CreateExpenseInput {
    title: String!
    description: String
    amount: Float!
    category: String!
    department: String
    date: String
    status: String
  }

  extend type Query {
    # HQ can view all expenses or filter by branch; Satellites see only theirs
    getBranchExpenses(branchId: ID, category: String, status: String, startDate: String, endDate: String): [Expense]
    getExpenseStats(branchId: ID): ExpenseStats
  }

  type ExpenseStats {
    totalSpent: Float
    pendingAmount: Float
    categoryBreakdown: [CategorySummary]
  }

  type CategorySummary {
    category: String
    total: Float
  }

  extend type Mutation {
    createExpense(input: CreateExpenseInput!): Expense
    updateExpenseStatus(id: ID!, status: String!): Expense
    deleteExpense(id: ID!): String
  }
`;