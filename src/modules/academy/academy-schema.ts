import { gql } from 'apollo-server-express';

export const academyTypeDefs = gql`
  # Enum for strict course selection
  enum CourseName {
    DLI_BASIC
    DLI_ADVANCE
    DCA_BASIC
    DCA_ADVANCE
  }

  scalar Upload

  type UploadResponse {
    success: Boolean!
    message: String!
    count: Int
  }

  type AcademyStudent {
    id: ID!
    branchId: ID
    name: String!
    email: String
    courseName: String!
    location: String!
    phone: String!
    date: String!
    status: String!
  }

input StudentInput {
  name: String!
  email: String!
  phone: String!
  courseName: CourseName!
  location: String
  date: String
}

  input EnrollStudentInput {
    name: String!
    email: String
    courseName: CourseName!
    location: String!
    phone: String!
    date: String
  }

  extend type Query {
    getAcademyStudents(branchId: ID, courseName: CourseName, page: Int, limit: Int): [AcademyStudent]
    getAcademyStats(branchId: ID): AcademyStats
  }

  type AcademyStats {
    totalStudents: Int
    courseBreakdown: [CourseCount]
  }

  type CourseCount {
    course: String
    count: Int
  }

  extend type Mutation {
    enrollStudent(input: StudentInput!): AcademyStudent
    adminEnrollStudent(input: EnrollStudentInput!): AcademyStudent
    uploadEnrolledStudent(file: Upload!): UploadResponse!

    updateStudentStatus(id: ID!, status: String!): AcademyStudent
  }
`;