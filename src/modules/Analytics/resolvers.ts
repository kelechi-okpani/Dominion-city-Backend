import { GraphQLError } from 'graphql';
import mongoose from 'mongoose';
import { AttendanceModel } from '../attendance/model/attendance-model.js';
import { AcademyModel } from '../academy/model/academy-model.js';
import { BranchUserModel } from '../branch/model/branch-model.js';
import { SoulWinningModel } from '../soul-winning/model/soul-model.js';
import { CellModel } from '../cell-unit/model/cell-model.js';
import { DepartmentModel } from '../department/model/dept-model.js';

export const analyticsResolvers = {
  Query: {
    getAnalytics: async (_parent: any, { branchId }: { branchId?: string }, { user }: any) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.branch?.enumValue === 'ABUJA_HQ';
      const effectiveBranchId = isHQ 
        ? (branchId === 'all' ? undefined : branchId) 
        : user.branch?.id;

      const filter: any = {};
      if (effectiveBranchId) {
        filter.branchId = new mongoose.Types.ObjectId(effectiveBranchId);
      }

      try {
        const [
          attendanceStats, 
          soulStats, 
          academyCount, 
          cellCount,
          rawDistribution, 
          monthlyAttendance,
          monthlySouls,
          roles
        ] = await Promise.all([
          // A. Total Attendance - defaults to 0 via stats object below
          AttendanceModel.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$total" } } }
          ]),

          // B. Total Souls Won - returns 0 if none
          SoulWinningModel.countDocuments(filter),

          // C. Academy Growth - returns 0 if none
          AcademyModel.countDocuments({ ...filter, status: { $ne: 'Dropped' } }),

          // D. Global Reach - returns 0 if none
          CellModel.countDocuments({ ...filter, status: 'ACTIVE' }),

          // E. Distribution - returns empty array if none
          effectiveBranchId 
            ? DepartmentModel.aggregate([
                { $match: filter },
                { $group: { _id: "$name", count: { $sum: 1 } } }
              ])
            : BranchUserModel.aggregate([
                { $match: { isActive: true } },
                { $group: { _id: "$branchName", count: { $sum: 1 } } }
              ]),

          // F. Monthly Attendance
          AttendanceModel.aggregate([
            { $match: filter },
            { $group: { _id: { $month: "$date" }, count: { $sum: "$total" } } }
          ]),

          // G. Monthly Souls
          SoulWinningModel.aggregate([
            { $match: filter },
            { $group: { _id: { $month: "$date" }, count: { $sum: 1 } } }
          ]),

          // H. Leadership Pulse
          BranchUserModel.aggregate([
            { $match: effectiveBranchId ? { branchId: filter.branchId } : {} },
            { $group: { _id: "$role", count: { $sum: 1 } } }
          ])
        ]);

        // Fallback for null aggregation result
        const stats = attendanceStats[0] || { total: 0 };
        const totalMembers = await BranchUserModel.countDocuments(effectiveBranchId ? { branchId: filter.branchId } : {});

        // Combine monthly results: Loop through last 6 months
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const growthData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const monthNum = d.getMonth() + 1;
          
          return {
            month: months[d.getMonth()],
            attendance: monthlyAttendance.find(m => m._id === monthNum)?.count || 0,
            souls: monthlySouls.find(s => s._id === monthNum)?.count || 0
          };
        });

        const colors = ['#4B0082', '#8B5CF6', '#D4AF37', '#10B981', '#3B82F6'];
        
        // Ensure distribution never returns an empty chart if data exists
        const distribution = rawDistribution.map((item, index) => ({
          name: item._id || "General",
          value: totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0,
          color: colors[index % colors.length]
        }));

        const leadershipPulse = roles.map(r => ({
          level: r._id ? r._id.replace(/_/g, ' ') : 'MEMBER',
          percentage: totalMembers > 0 ? Math.round((r.count / totalMembers) * 100) : 0
        }));

        return {
          totalAttendance: stats.total >= 1000 ? `${(stats.total / 1000).toFixed(1)}k` : (stats.total || 0).toString(),
          soulsWon: soulStats || 0,
          academyGrowth: (academyCount || 0).toLocaleString(),
          globalReach: (isHQ && !effectiveBranchId ? cellCount : 1) || 0,
          growthData,
          distribution: distribution.length > 0 ? distribution : [{name: 'No Data', value: 0, color: '#CBD5E1'}],
          q1TargetProgress: 0, // Set to 0 if you don't have a targets collection yet
          leadershipPulse: leadershipPulse.length > 0 ? leadershipPulse : [{ level: 'N/A', percentage: 0 }]
        };

      } catch (error) {
        console.error("Aggregation Error:", error);
        throw new GraphQLError('Database aggregation failed');
      }
    }
  }
};