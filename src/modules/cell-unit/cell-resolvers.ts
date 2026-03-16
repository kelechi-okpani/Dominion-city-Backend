import { GraphQLError } from 'graphql';
import { CellModel } from './model/cell-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';

export const cellResolvers = {
  Query: {

    getBranchCells: async (_: any, { branchId, type }: any, { user }: IResolverContext) => {
            if (!user) throw new GraphQLError('Unauthenticated');

            const isHQ = user.role === UserRole.ADMIN;
            const filter: any = {};

            // Hierarchy security
            if (isHQ) {
                if (branchId) filter.branchId = branchId;
            } else {
                filter.branchId = user.branchId;
            }

            // Optional filter for Zone vs Cell Unit
            if (type) {
                filter.type = type;
            }

            return await CellModel.find(filter).sort({ type: 1, cellName: 1 });
    },

    getCellById: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');
      
      const cell = await CellModel.findOne({ _id: id, branchId: user.branchId });
      if (!cell) throw new GraphQLError('Cell not found');
      
      return cell;
    }

   },

  Mutation: {
    createCell: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const newCell = new CellModel({
          ...input,
          branchId: user.branchId // Automatically link to the logged-in admin's branch
        });
        return await newCell.save();
      } catch (error: any) {
        throw new GraphQLError(error.code === 11000 
          ? 'A cell with this name already exists in your branch.' 
          : 'Failed to create cell unit.');
      }
    },

    updateCell: async (_: any, { id, input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const updated = await CellModel.findOneAndUpdate(
        { _id: id, branchId: user.branchId },
        { $set: input },
        { new: true }
      );

      if (!updated) throw new GraphQLError('Cell not found or access denied.');
      return updated;
    },

    deleteCell: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const result = await CellModel.findOneAndDelete({ _id: id, branchId: user.branchId });
      if (!result) throw new GraphQLError('Cell not found.');

      return "Cell unit deleted successfully.";
    }
  }
};