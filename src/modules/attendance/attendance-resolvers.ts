import { GraphQLError } from 'graphql';
import { AttendanceModel } from './model/attendance-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';

export const attendanceResolvers = {
  Query: {
     getBranchAttendance: async (_parent: any, { branchId, startDate, endDate }: any, { user }: IResolverContext) => {
          if (!user) throw new GraphQLError('Authentication required.');
    
          const isHQ = user.role === UserRole.ADMIN;
          const filter: any = {};
    
          // Access Control
          if (isHQ) {
            if (branchId) filter.branchId = branchId;
          } else {
            filter.branchId = user.branchId;
          }
    
          // Date Filtering
          if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
          }
    
          try {
            return await AttendanceModel.find(filter).sort({ date: -1 });
          } catch (error) {
            throw new GraphQLError('Error fetching attendance records.');
          }
     },
    
     
    getAttendanceStats: async (_parent: any, { branchId }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;
      const targetBranch = isHQ ? (branchId || user.branchId) : user.branchId;

      const records = await AttendanceModel.find({ branchId: targetBranch });
      
      if (records.length === 0) return null;

      const totalSum = records.reduce((acc, curr) => acc + curr.total, 0);
      const highest = Math.max(...records.map(r => r.total));

      return {
        totalAvg: Math.round(totalSum / records.length),
        highestAttendance: highest,
        latestAttendance: records[0]
      };
    }
  },

  Mutation: {
    /**
     * Submits a new attendance headcount. 
     * The 'total' is automatically calculated by the Mongoose pre-save hook.
     */
    submitAttendance: async (_parent: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const attendanceRecord = new AttendanceModel({
          ...input,
          branchId: user.branchId, // Secured to the user's branch
          markedBy: user.id
        });

        return await attendanceRecord.save();
      } catch (error) {
        throw new GraphQLError('Failed to submit attendance. Check your inputs.', {
          extensions: { code: 'BAD_USER_INPUT' }
        });
      }
    },

    /**
     * Allows deleting a record (Admin only or record creator).
     */
    deleteAttendance: async (_parent: any, { id }: { id: string }, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const record = await AttendanceModel.findOneAndDelete({ 
        _id: id, 
        branchId: user.branchId // Safety: Can only delete within own branch
      });

      if (!record) throw new GraphQLError('Record not found or access denied.');

      return "Attendance record deleted successfully.";
    }
  }
};