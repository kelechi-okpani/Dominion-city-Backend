import { GraphQLError } from 'graphql';
import { DepartmentModel } from "./model/dept-model.js";
import { DeptMemberModel } from "./model/dept-member-model.js"; 
import { IResolverContext } from '../../context.js';

export const departmentResolvers = {
  Query: {
 

    getBranchDepartments: async (_parent: unknown, { page = 1, limit = 10 }: any, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const skip = (page - 1) * limit;

        return await DepartmentModel.find({ branchId: user.branchId })
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit);
      } catch (error) {
        throw new GraphQLError('Failed to fetch departments.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },


    getDepartmentById: async (_parent: unknown, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const department = await DepartmentModel.findOne({ _id: id, branchId: user.branchId });

      if (!department) {
        throw new GraphQLError('Department not found or access denied.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return department;
    }
  },

  Mutation: {

    createDepartment: async (_parent: unknown, { input }: any, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Unauthorized: Branch access required.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        const newDept = new DepartmentModel({
          ...input,
          branchId: user.branchId,
          status: input.status || 'Active'
        });

        return await newDept.save();
      } catch (error) {
        throw new GraphQLError('Error creating department.', {
          extensions: { code: 'BAD_USER_INPUT', detail: error },
        });
      }
    },

 
    addMemberToDepartment: async (_parent: unknown, { input }: any, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Unauthorized.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // Generate initials for the avatar UI
        const initials = input.name
          .split(' ')
          .filter(Boolean)
          .map((n: string) => n[0])
          .join('')
          .toUpperCase();

        const newMember = new DeptMemberModel({
          ...input,
          branchId: user.branchId, // Link to branch for master workforce lists
          initials,
          joined: new Date(), 
        });

        return await newMember.save();
      } catch (error) {
        throw new GraphQLError('Error adding member to department.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

   
    updateDepartment: async (_parent: unknown, { id, ...updates }: any, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Unauthorized.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const updatedDept = await DepartmentModel.findOneAndUpdate(
        { _id: id, branchId: user.branchId },
        { $set: updates },
        { new: true }
      );

      if (!updatedDept) {
        throw new GraphQLError('Department not found or unauthorized.', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return updatedDept;
    }
  },


    Department: {
      members: async (parent: any, { page = 1, limit = 20 }: any) => {
        const skip = (page - 1) * limit;

        return await DeptMemberModel.find({ deptId: parent.id })
          .sort({ name: 1 })
          .skip(skip)
          .limit(limit);
      },
      
      memberCount: async (parent: any) => {
        return await DeptMemberModel.countDocuments({ deptId: parent.id });
      }
    }
};