import { GraphQLError } from 'graphql';
import { CellModel } from './model/cell-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { ExpenseModel } from '../expense/model/expense-model.js';

export const cellResolvers = {
  Query: {

  getBranchCells: async (
      _: any, 
      { branchId, type }: { branchId: string; type?: string }, 
      { user }: IResolverContext
    ) => {
      // 1. Authentication Check
      if (!user) throw new GraphQLError('Unauthenticated');

      const filter: any = {};
      const isHQ = user.role === UserRole.ADMIN;

      // 2. Branch Hierarchy Logic
      // If the user is HQ/Admin, they can view any branchId they pass.
      // If they are a satellite branch, they are locked to their own branchId.
      if (isHQ) {
        if (branchId && branchId !== "all") {
          filter.branchId = branchId;
        }
      } else {
        // SECURITY: Satellite users cannot query other branches even if they pass a different branchId
        filter.branchId = user.branchId; 
      }

      // 3. Type Filtering (Filter by 'ZONE' or 'CELL' if provided)
      if (type && type !== 'ALL') {
        filter.type = type.toUpperCase();
      }

      try {
        const cells = await CellModel.find(filter)
          .sort({ cellName: 1 }) // Alphabetical sorting is usually better for lists
          .populate('branchId', 'name') // Optional: if you want branch details
          .lean();

        // 4. Data Mapping
        // This handles the MongoDB _id -> GraphQL id conversion 
        // and ensures memberCount defaults to 0
        return cells.map(cell => ({
          ...cell,
          id: cell._id.toString(),
          branchId: cell.branchId?._id?.toString() || cell.branchId.toString(),
          memberCount: cell.memberCount || 0,
          status: cell.status || 'ACTIVE'
        }));
        
      } catch (error: any) {
        console.error("GET_BRANCH_CELLS_ERROR:", error.message);
        throw new GraphQLError('Failed to retrieve cell records');
      }
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