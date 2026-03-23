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

      // 1. Access Control: Admins can filter by any branch; Users are locked to theirs
      if (isHQ) {
        if (branchId && branchId !== 'all') filter.branchId = branchId;
      } else {
        filter.branchId = user.branchId;
      }

      // 2. Date Range Filtering
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }

      try {
        return await AttendanceModel.find(filter)
          .sort({ date: -1 })
          .populate('branchId'); 
      } catch (error) {
        throw new GraphQLError('Error fetching attendance records.');
      }
    },

    getAttendanceStats: async (_parent: any, { branchId }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;
      const filter: any = {};
      
      if (isHQ) {
        if (branchId && branchId !== 'all') filter.branchId = branchId;
      } else {
        filter.branchId = user.branchId;
      }

      try {
        const records = await AttendanceModel.find(filter).sort({ date: -1 });
        
        if (records.length === 0) return null;

        const totalSum = records.reduce((acc, curr) => acc + (curr.total || 0), 0);
        const highest = Math.max(...records.map(r => r.total || 0));

        return {
          totalAvg: Math.round(totalSum / records.length),
          highestAttendance: highest,
          latestAttendance: records[0] 
        };
      } catch (error) {
        throw new GraphQLError('Error generating attendance statistics.');
      }
    }
  },

  Mutation: {
    submitAttendance: async (_parent: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;

      try {
        /**
         * SECURITY LOGIC:
         * If the user is an Admin, we accept the branchId from the form (input).
         * If the user is a Branch staff, we ignore the input and use their session branchId.
         */
        const finalBranchId = isHQ ? input.branchId : user.branchId;

        if (!finalBranchId) {
          throw new GraphQLError('A valid Branch ID is required to save attendance.');
        }

        const attendanceRecord = new AttendanceModel({
          ...input,
          branchId: finalBranchId, 
          markedBy: user.id,
          // Server-side calculation to prevent data tampering or UI mismatches
          total: Number(input.men || 0) + Number(input.women || 0) + Number(input.children || 0)
        });

        const savedRecord = await attendanceRecord.save();
        
        // Populate branch details so the frontend receives the full object as per Schema
        return await savedRecord.populate('branchId');
      } catch (error: any) {
        console.error("Submission Error:", error);
        throw new GraphQLError(error.message || 'Failed to submit attendance.', {
          extensions: { 
            code: 'BAD_USER_INPUT',
            invalidArgs: Object.keys(error.errors || {}) 
          }
        });
      }
    },

    updateAttendance: async (_parent: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const { id, ...updateData } = input;
      const isAdmin = user.role === UserRole.ADMIN;
      
      try {
        const existing = await AttendanceModel.findById(id);
        if (!existing) throw new GraphQLError('Record not found.');

        // OWNERSHIP CHECK: Must be the person who marked it OR an Admin
        const isOwner = existing.markedBy?.toString() === user.id.toString();
        
        if (!isOwner && !isAdmin) {
          throw new GraphQLError('Access denied. You can only edit records you created.');
        }

        // Server-side recalculation of total
        const men = updateData.men !== undefined ? updateData.men : existing.men;
        const women = updateData.women !== undefined ? updateData.women : existing.women;
        const children = updateData.children !== undefined ? updateData.children : existing.children;
        const newTotal = Number(men) + Number(women) + Number(children);

        const updatedRecord = await AttendanceModel.findByIdAndUpdate(
          id,
          { 
            ...updateData, 
            total: newTotal,
            // Only Admins can re-assign a record to a different branch
            branchId: isAdmin && updateData.branchId ? updateData.branchId : existing.branchId 
          },
          { new: true }
        ).populate('branchId');

        return updatedRecord;
      } catch (error: any) {
        throw new GraphQLError(error.message || 'Failed to update record.');
      }
    },

    deleteAttendance: async (_parent: any, { id }: { id: string }, { user }: IResolverContext) => {
    if (!user) throw new GraphQLError('Unauthorized');
    
    const isAdmin = user.role === UserRole.ADMIN;

    try {
      const existing = await AttendanceModel.findById(id);
      if (!existing) throw new GraphQLError('Record not found.');

      // OWNERSHIP CHECK
      const isOwner = existing.markedBy?.toString() === user.id.toString();

      if (!isOwner && !isAdmin) {
        throw new GraphQLError('Access denied. You can only delete records you created.');
      }

      await AttendanceModel.findByIdAndDelete(id);
      return "Attendance record deleted successfully.";
    } catch (error) {
      throw new GraphQLError('Failed to delete attendance record.');
    }
     }
  }
};
