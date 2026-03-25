import { gql } from 'apollo-server-express';

export const analyticsTypeDefs = gql`  
  type GrowthPoint {
    month: String!
    attendance: Int!
    souls: Int!
  }

  type DistributionItem {
    name: String!
    value: Int!
    color: String!
  }

  type PulseLevel {
    level: String!
    percentage: Int!
  }

  type AnalyticsDashboard {
    totalAttendance: String!
    soulsWon: Int!
    academyGrowth: String!
    globalReach: Int!
    growthData: [GrowthPoint!]!
    distribution: [DistributionItem!]!
    q1TargetProgress: Int!
    leadershipPulse: [PulseLevel!]!
  }

  extend type Query {
    # branchId is optional (ID type matches mongoose ObjectIds)
    getAnalytics(branchId: ID): AnalyticsDashboard!
  }
`;