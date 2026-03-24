import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { IResolverContext } from '../../context.js';
import { DepartmentModel, IDepartment, MemberModel } from './model/dept-model.js';

export const departmentResolvers = {
  Query: {
    getBranchDepartments: async (
      _: any, 
      { page = 1, limit = 20 }: { page?: number; limit?: number }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const filter: any = {};
      // HQ/Admin sees all, others see their own branch units
      if (user.role !== 'ADMIN') {
        filter.branchId = user.branchId;
      }

      return await DepartmentModel.find(filter)
        .sort({ name: 1 }) // Alphabetical by unit name
        .limit(limit)
        .skip((page - 1) * limit);
    },

    getDepartmentById: async (
      _: any, 
      { id }: { id: string }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');
      
      const dept = await DepartmentModel.findById(id);
      if (!dept) throw new GraphQLError('Department not found');
      
      return dept;
    }
  },

  // Field Resolvers for nested data in your TypeDefs
  Department: {
    memberCount: async (parent: IDepartment) => {
      return await MemberModel.countDocuments({ deptId: parent._id });
    },
    members: async (
      parent: IDepartment, 
      { page = 1, limit = 20 }: { page?: number; limit?: number }
    ) => {
      return await MemberModel.find({ deptId: parent._id })
        .sort({ name: 1 })
        .limit(limit)
        .skip((page - 1) * limit);
    }
  },

  Mutation: {
    createDepartment: async (
      _: any, 
      { input }: { input: any }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');

      return await DepartmentModel.create({
        ...input,
        branchId: user.branchId // Automatically tethered to creator's branch
      });
    },

    addMemberToDepartment: async (
      _: any, 
      { input }: { input: any }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');

      // 1. Verify dept exists
      const dept = await DepartmentModel.findById(input.deptId);
      if (!dept) throw new GraphQLError('Target department does not exist');

      // 2. Create the member
      return await MemberModel.create({
        ...input,
        deptId: input.deptId,
        joined: new Date()
      });
    },

    updateDepartment: async (
      _: any, 
      { id, ...updates }: any, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');
      
      return await DepartmentModel.findByIdAndUpdate(
        id, 
        { $set: updates }, 
        { new: true }
      );
    }
  }
};