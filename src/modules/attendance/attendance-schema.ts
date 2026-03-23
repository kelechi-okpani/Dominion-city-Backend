import { gql } from 'apollo-server-express';

export const attendanceTypeDefs = gql`
  type Branch {
    id: ID!
    name: String!
  }

  type Attendance {
    id: ID!
    # Correctly mapped to Branch type for population
    branchId: Branch! 
    date: String!
    event: String!
    description: String
    men: Int!
    women: Int!
    children: Int!
    total: Int!
    markedBy: ID!
    createdAt: String
  }

  input CreateAttendanceInput {
    # Added branchId so Admins can specify which branch they are logging for
    branchId: ID
    date: String!
    event: String!
    description: String
    men: Int!
    women: Int!
    children: Int!
  }

  input UpdateAttendanceInput {
    id: ID!
    branchId: ID
    date: String
    event: String
    description: String
    men: Int
    women: Int
    children: Int
  }

  type AttendanceStats {
    totalAvg: Int
    highestAttendance: Int
    latestAttendance: Attendance
  }

  extend type Query {
    # DC-HQ can see all; Satellites see only theirs
    getBranchAttendance(branchId: ID, startDate: String, endDate: String): [Attendance]
    # Detailed stats for the dashboard
    getAttendanceStats(branchId: ID): AttendanceStats
  }

  extend type Mutation {
    submitAttendance(input: CreateAttendanceInput!): Attendance
    updateAttendance(input: UpdateAttendanceInput!): Attendance
    deleteAttendance(id: ID!): String
  }
`;