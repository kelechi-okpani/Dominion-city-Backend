import { gql } from 'apollo-server-express';

export const attendanceTypeDefs = gql`
  type Attendance {
    id: ID!
    branchId: ID!
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
    date: String!
    event: String!
    description: String
    men: Int!
    women: Int!
    children: Int!
  }

  extend type Query {
    # DC-HQ can see all; Satellites see only theirs
    getBranchAttendance(branchId: ID, startDate: String, endDate: String): [Attendance]
    # Detailed stats for the dashboard
    getAttendanceStats(branchId: ID): AttendanceStats
  }

  type AttendanceStats {
    totalAvg: Int
    highestAttendance: Int
    latestAttendance: Attendance
  }

  extend type Mutation {
    submitAttendance(input: CreateAttendanceInput!): Attendance
    deleteAttendance(id: ID!): String
  }
`;