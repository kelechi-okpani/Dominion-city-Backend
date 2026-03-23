import { GraphQLError } from 'graphql';
import { CellModel } from './model/cell-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';

export const cellResolvers = {
  Query: {

      getBranchCells: async (_: any, { branchId }: { branchId?: string; }, { user }: IResolverContext) => {
        if (!user) throw new GraphQLError('Unauthenticated');

        const filter: any = {};
        const isHQ = user.role === UserRole.ADMIN;

        if (isHQ) {
          if (branchId) filter.branchId = branchId;
        } else {
          // Ensure this matches your token/user payload property name
          filter.branchId = user.branchId; 
        }

        const cells = await CellModel.find(filter)
          .sort({ type: 1, cellName: 1 })
          .lean();

        // FIX: Map _id to id for GraphQL compatibility
        return cells.map(cell => ({
          ...cell,
          id: cell._id.toString(),
        }));
},
    // If you have getCellById, it goes here...
  },

  Mutation: {
    createCell: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const branchId = (user.role === UserRole.ADMIN && input.branchId) 
        ? input.branchId 
        : user.branchId;

      try {
        const newCell = new CellModel({
          ...input,
          branchId
        });
        return await newCell.save();
      } catch (error: any) {
        if (error.code === 11000) throw new GraphQLError('This cell / zone name already exists.');
        throw new GraphQLError('Error creating cell / zone unit.');
      }
    },

   updateCell: async (_: any, { id, input }: { id: string; input: any }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');
      const updated = await CellModel.findByIdAndUpdate(id, input, { new: true }).lean();
      if (!updated) throw new Error("Cell not found");
      return { ...updated, id: updated._id.toString() };
    },

    deleteCell: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');
      await CellModel.findByIdAndDelete(id);
      return id;
    }
  } 
}; 