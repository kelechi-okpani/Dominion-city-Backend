import { GraphQLError } from 'graphql';
import { CellModel } from './model/cell-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { ExpenseModel } from '../expense/model/expense-model.js';

export const cellResolvers = {
  Query: {

    getBranchExpenses: async (_: any, { branchId, category }: { branchId?: string; category?: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');

      const filter: any = {};
      const isHQ = user.role === UserRole.ADMIN;

      // 1. Branch Filtering Logic (Matching your Cell approach)
      if (isHQ) {
        // Only apply filter if a specific branch is selected and it's not "all"
        if (branchId && branchId !== "all") {
          filter.branchId = branchId;
        }
      } else {
        // Satellite branches can only see their own data
        filter.branchId = user.branchId; 
      }

      // 2. Category Filtering Logic
      if (category && category !== 'All') {
        filter.category = category;
      }

      try {
        const expenses = await ExpenseModel.find(filter)
          .sort({ date: -1 })
          .populate('recordedBy', 'fullName email') // Ensure User model has these fields
          .lean();

        // 3. Map _id to id (The "Cell Resolver" Fix)
        return expenses.map(expense => ({
          ...expense,
          id: expense._id.toString(),
          // Ensure recordedBy is handled if populate fails or is empty
          recordedBy: expense.recordedBy || null 
        }));
        
      } catch (error: any) {
        console.error("EXPENSE_RESOLVER_ERROR:", error.message);
        throw new GraphQLError('Failed to fetch expenses');
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