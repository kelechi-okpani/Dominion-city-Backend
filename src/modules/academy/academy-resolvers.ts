import { GraphQLError } from 'graphql';
import { AcademyModel } from './model/academy-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';

export const academyResolvers = {
  Query: {
    getAcademyStudents: async (_: any, { branchId, courseName, page = 1, limit = 20 }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');

      const isHQ = user.role === UserRole.ADMIN;
      const filter: any = {};

      if (isHQ) {
        if (branchId) filter.branchId = branchId;
      } else {
        filter.branchId = user.branchId;
      }

      if (courseName) filter.courseName = courseName;

      const skip = (page - 1) * limit;
      return await AcademyModel.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
    },

    getAcademyStats: async (_: any, { branchId }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;
      const targetBranch = isHQ ? (branchId || user.branchId) : user.branchId;

      const totalStudents = await AcademyModel.countDocuments({ branchId: targetBranch });
      
      const breakdown = await AcademyModel.aggregate([
        { $match: { branchId: targetBranch } },
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $project: { course: "$_id", count: 1, _id: 0 } }
      ]);

      return { totalStudents, courseBreakdown: breakdown };
    }
  },

  Mutation: {
    adminEnrollStudent: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const student = new AcademyModel({
          ...input,
          branchId: user.branchId,
          addedBy: user.id
        });
        return await student.save();
      } catch (error: any) {
        // Handle Mongoose validation errors (like wrong course name) or duplicate index
        throw new GraphQLError(error.code === 11000 
          ? 'Student already enrolled in this course.' 
          : 'Failed to enroll student. Ensure the course name is correct.');
      }
    },
    enrollStudent: async (_: any, { input }: any, { user }: IResolverContext) => {
      try {
        const studentData = {
          ...input,
          // branchId: user?.branchId || input.branchId || null,
          addedBy: user?.id || "PUBLIC_WEBSITE",
          date: input.date && input.date.trim() !== "" ? input.date : new Date().toISOString(),
        };
        const student = new AcademyModel(studentData);
        const result = await student.save();
        return result;
      } catch (error: any) {
        console.error("Enrollment Error:", error);
        if (error.code === 11000) {
          throw new GraphQLError('This email is already registered for this course.');
        }
        throw new GraphQLError('We could not complete your registration. Please try again later.');
      }
    },
  }
};