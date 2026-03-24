import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { ExpenseModel } from './model/expense-model.js';
import { IResolverContext } from '../../context.js'; // Ensure path is correct
import { UserRole } from '../branch/model/branch-model.js';

export const expenseResolvers = {
  Query: {
    getBranchExpenses: async (_: any, { branchId }: { branchId?: string }, { user }: IResolverContext) => {
        if (!user) throw new GraphQLError('Unauthenticated');

        const filter: any = {};
        // Use user.role from your context - ensure it matches your UserRole enum
        const isHQ = user.role === 'ADMIN'; 

        if (isHQ) {
            if (branchId && branchId !== "all") filter.branchId = branchId;
        } else {
            filter.branchId = user.branchId;
        }

        try {
            const expenses = await ExpenseModel.find(filter)
            .sort({ date: -1 })
            .populate({
                path: 'recordedBy',
                populate: { path: 'branch' } // This populates the Branch inside the BranchUser
            })
            .lean();

            return expenses.map((expense: any) => ({
            ...expense,
            id: expense._id.toString(),
            recordedBy: expense.recordedBy ? {
                ...expense.recordedBy,
                id: expense.recordedBy._id?.toString(),
                // Map nested branch ID if it exists
                branch: expense.recordedBy.branch ? {
                ...expense.recordedBy.branch,
                id: expense.recordedBy.branch._id?.toString()
                } : null
            } : null
            }));
        } catch (error: any) {
            console.error("EXPENSE_ERROR:", error.message);
            throw new GraphQLError('Failed to fetch expenses');
        }
        },
  
getExpenseStats: async (_: any, { branchId }: { branchId?: string }, { user }: IResolverContext) => {
  if (!user) throw new GraphQLError('Unauthorized');

  const isHQ = user.role === 'ADMIN';
  const filter: any = {};

  // 1. Unified Filter Construction
  if (isHQ) {
    if (branchId && branchId !== "all") {
      filter.branchId = new mongoose.Types.ObjectId(branchId);
    }
  } else {
    filter.branchId = new mongoose.Types.ObjectId(user.branchId);
  }

  try {
    // 2. Single Aggregation (More efficient & prevents mismatched totals)
    const stats = await ExpenseModel.aggregate([
      { 
        $match: { 
          ...filter,
        //   status: 'Approved' // Ensure we ONLY count money that is actually out the door
        } 
      },
      { 
        $group: { 
          _id: '$department', 
          total: { $sum: '$amount' } 
        } 
      },
      { $sort: { total: -1 } }
    ]);

    // 3. Calculate Grand Total from the results
    const grandTotal = stats.reduce((acc, curr) => acc + curr.total, 0);

    return {
      // This will now match the sum of your categories perfectly
      totalRecorded: grandTotal,
      
      primarySector: stats[0]?._id || "None",
      
      categoryBreakdown: stats.map(cat => ({
        department: cat._id,
        total: cat.total,
        // Using grandTotal here ensures percentages always add up to 100%
        percentage: grandTotal > 0 ? (cat.total / grandTotal) * 100 : 0
      }))
    };

  } catch (error: any) {
    console.error("STATS_RESOLVER_ERROR:", error.message);
    throw new GraphQLError('Failed to calculate stats');
  }
}

  },

  Mutation: {
  createExpense: async (_: any, { input, branchId }: { input: any; branchId: string }, { user }: IResolverContext) => {
  if (!user) throw new GraphQLError('Unauthorized');

  try {
    // 1. Ensure we have a valid branchId
    const targetBranch = branchId || user.branchId;
    if (!targetBranch) throw new Error("Branch ID is required.");

    // 2. Map input to model fields strictly 
    const expense = new ExpenseModel({
      title: input.title,
      fullName: input.fullName,
      amount: input.amount,
      department: input.department,
      date: input.date || new Date(),
      branchId: targetBranch,
      recordedBy: user.id,
      status: 'Approved'
    });
    
    const savedExpense = await expense.save();
    
    // 3. Return the populated result
    return await ExpenseModel.findById(savedExpense._id)
      .populate('recordedBy', 'fullName email');
      
  } catch (error: any) {
    console.error("Full Backend Error:", error); 
    // This will now show up in your Apollo Sandbox/Frontend errors
    throw new GraphQLError(error.message || 'Failed to create expense record.');
  }
},

    updateExpenseStatus: async (
      _: any, 
      { id, status }: { id: string; status: string }, 
      { user }: IResolverContext // Added typed context
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        return await ExpenseModel.findByIdAndUpdate(
          id,
          { $set: { status } },
          { new: true }
        ).populate('recordedBy', 'fullName email');
      } catch (error) {
        throw new GraphQLError('Update failed');
      }
    },

  // expense-resolvers.ts
    deleteExpense: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      // Security: Build the query to ensure users only delete their own branch data
      const query: any = { _id: id, isDeleted: false };
      
      if (user.role !== 'ADMIN') {
        query.branchId = user.branchId;
      }

      // UPDATE instead of DELETE
      const deleted = await ExpenseModel.findOneAndUpdate(
        query, 
        { isDeleted: true }, 
        { new: true }
      );

      return deleted 
        ? "Record removed from view successfully" 
        : "Record not found or unauthorized";
    }
  }
};