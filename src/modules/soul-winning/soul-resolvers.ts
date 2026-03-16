import { GraphQLError } from 'graphql';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { SoulWinningModel } from './model/soul-model.js';

export const soulWinningResolvers = {
  Query: {
    getSoulWinningList: async (_: any, { branchId, category, page = 1, limit = 20 }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');

      const isHQ = user.role === UserRole.ADMIN;
      const filter: any = {};

      // Access Control
      if (isHQ) {
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

    getSoulWinningStats: async (_: any, { branchId }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;
      const targetBranch = isHQ ? (branchId || user.branchId) : user.branchId;
      const filter = { branchId: targetBranch };

      const totalFirstTimers = await SoulWinningModel.countDocuments({ ...filter, category: 'First Timer' });
      const totalNewConverts = await SoulWinningModel.countDocuments({ ...filter, category: 'New Convert' });

      return {
        totalFirstTimers,
        totalNewConverts,
        grandTotal: totalFirstTimers + totalNewConverts
      };
    }
  },

  Mutation: {
    addSoul: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const soul = new SoulWinningModel({
          ...input,
          branchId: user.branchId,
          addedBy: user.id
        });
        return await soul.save();
      } catch (error) {
        throw new GraphQLError('Failed to save record. This person might have been registered today already.');
      }
    },

    deleteSoul: async (_: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const record = await SoulWinningModel.findOneAndDelete({ 
        _id: id, 
        branchId: user.branchId 
      });

      if (!record) throw new GraphQLError('Record not found.');
      return "Record deleted successfully.";
    }
  }
};