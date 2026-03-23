import { GraphQLError } from 'graphql';
import { SoulWinningModel } from './model/soul-model.js';

// --- TYPES & INTERFACES ---

interface IUser {
  id: string;
  role: string;
  branchId: string;
}

interface IResolverContext {
  user?: IUser;
}

interface SoulFilter {
  _id: string;
  branchId?: string;
}

// --- RESOLVERS ---

export const soulWinningResolvers = {
  Query: {
    getSoulWinningList: async (
      _: any, 
      { branchId, category, page = 1, limit = 20 }: { branchId?: string; category?: string; page?: number; limit?: number; }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthenticated');

      // Use Record<string, any> or a specific interface for the mongo filter
      const filter: any = {};
      
      if (user.role === 'ADMIN') {
        if (branchId) filter.branchId = branchId;
      } else {
        filter.branchId = user.branchId;
      }

      if (category) filter.category = category;

      const skip = (page - 1) * limit;
      return await SoulWinningModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    },

    getSoulWinningStats: async (
      _: any, 
      { branchId }: { branchId?: string }, 
      { user }: IResolverContext
    ) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const targetBranch = user.role === 'ADMIN' ? (branchId || user.branchId) : user.branchId;
      const filter = { branchId: targetBranch };

      const [firstTimers, newConverts] = await Promise.all([
        SoulWinningModel.countDocuments({ ...filter, category: 'First Timer' }),
        SoulWinningModel.countDocuments({ ...filter, category: 'New Convert' })
      ]);

      return {
        totalFirstTimers: firstTimers,
        totalNewConverts: newConverts,
        grandTotal: firstTimers + newConverts
      };
    }
  },

  Mutation: {
    addSoul: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const soul = new SoulWinningModel({
          ...input,
          branchId: input.branchId || user.branchId,
          addedBy: user.id
        });
        return await soul.save();
      } catch (error) {
        console.error("Add Soul Error:", error);
        throw new GraphQLError('Failed to save record.');
      }
    },

    updateSoul: async (_: any, { id, input }: { id: string; input: any }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      // Explicitly typing 'query' as SoulFilter to allow 'branchId' property
      const query: SoulFilter = { _id: id };

      if (user.role !== 'ADMIN') {
        query.branchId = user.branchId;
      }

      try {
        const updatedRecord = await SoulWinningModel.findOneAndUpdate(
          query,
          { $set: { ...input } },
          { new: true, runValidators: true }
        );

        if (!updatedRecord) {
          throw new GraphQLError('Record not found or permission denied.');
        }

        return updatedRecord;
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Update failed.');
      }
    },

    deleteSoul: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const query: SoulFilter = { _id: id };
      
      if (user.role !== 'ADMIN') {
        query.branchId = user.branchId;
      }

      try {
        const record = await SoulWinningModel.findOneAndDelete(query);
        if (!record) throw new GraphQLError('Record not found or access denied.');
        
        return "Record deleted successfully.";
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Delete failed.');
      }
    }
  }
};