import { GraphQLError } from 'graphql';
import { AcademyModel } from './model/academy-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { parse } from 'csv-parse';
import { GraphQLUpload } from 'graphql-upload-ts';


interface IStudentCSVRow {
  name: string;
  email: string;
  courseName: string;
  location: string;
  phone: string;
  date: Date;
  branchId: string;
  addedBy: string;
  status: string;
}


export const academyResolvers = {
  Upload: GraphQLUpload,
  Query: {
    getAcademyStudents: async (_: any, { branchId, courseName, page = 1, limit = 20 }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthenticated');

      const isHQ = user.role === UserRole.ADMIN;
      const filter: any = {};

      if (isHQ) {
        if (branchId) filter.branchId = branchId;
      } else {
        filter.branchId = user.branchId;
      }

      if (courseName) filter.courseName = courseName;

      const skip = (page - 1) * limit;
      return await AcademyModel.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit);
    },

    getAcademyStats: async (_: any, { branchId }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      const isHQ = user.role === UserRole.ADMIN;
      const targetBranch = isHQ ? (branchId || user.branchId) : user.branchId;

      const totalStudents = await AcademyModel.countDocuments({ branchId: targetBranch });
      
      const breakdown = await AcademyModel.aggregate([
        { $match: { branchId: targetBranch } },
        { $group: { _id: "$courseName", count: { $sum: 1 } } },
        { $project: { course: "$_id", count: 1, _id: 0 } }
      ]);

      return { totalStudents, courseBreakdown: breakdown };
    }
  },

  Mutation: {
    adminEnrollStudent: async (_: any, { input }: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Unauthorized');

      try {
        const student = new AcademyModel({
          ...input,
          branchId: user.branchId,
          addedBy: user.id
        });
        return await student.save();
      } catch (error: any) {
        // Handle Mongoose validation errors (like wrong course name) or duplicate index
        throw new GraphQLError(error.code === 11000 
          ? 'Student already enrolled in this course.' 
          : 'Failed to enroll student. Ensure the course name is correct.');
      }
    },

    enrollStudent: async (_: any, { input }: any, { user }: IResolverContext) => {
      try {
        const studentData = {
          ...input,
          // branchId: user?.branchId || input.branchId || null,
          addedBy: user?.id || null, 
          date: input.date || new Date().toISOString(),
        };
        const student = new AcademyModel(studentData);
        const result = await student.save();
        return result;
      } catch (error: any) {
          console.error("Enrollment Error:", error);

            if (error.code === 11000) {
              throw new GraphQLError('This email is already registered for this course.');
            }

            // Handle Mongoose-specific validation errors gracefully
            if (error.name === 'ValidationError') {
              throw new GraphQLError('Please check your input fields and try again.');
            }

            throw new GraphQLError('We could not complete your registration at this time.');
          }
    },

    uploadEnrolledStudent: async (_, { file }, { user }:IResolverContext) => {
        // 1. Auth Check
        if (!user) throw new GraphQLError('Unauthorized');

           // 2. Prepare Stream
           const uploadedFile = await file;
          // const { createReadStream } = await file;

          if (!uploadedFile) {
            throw new GraphQLError('File missing in the request. Check middleware ordering.');
          }

          const { createReadStream, filename } = uploadedFile;

          const stream = createReadStream();
          const results: IStudentCSVRow[] = [];
          const skippedRows: string[] = [];
          const validCourses = ['DLI_BASIC', 'DLI_ADVANCE', 'DCA_BASIC', 'DCA_ADVANCE'];

        const parser = stream.pipe(
          parse({
            // Turns "Course Name" into "coursename" key
            columns: (header) => header.map(h => h.toLowerCase().trim().replace(/\s+/g, '')),
            skip_empty_lines: true,
            trim: true,
          })
      );

      for await (const record of parser) {
        // --- COURSE NORMALIZATION ---
        // Converts "DLI ADVANCE" -> "DLI_ADVANCE"
        const rawCourse = record.coursename || "";
        const normalizedCourse = rawCourse.trim().toUpperCase().replace(/\s+/g, '_');

        if (normalizedCourse && validCourses.includes(normalizedCourse)) {
          
          // --- PHONE FORMATTING ---
          // Cleans spaces/dashes and ensures leading zero for 10-digit numbers
          let rawPhone = record.phone?.toString().replace(/\s+|-|\(|\)/g, '').trim() || '';
          if (rawPhone.length === 10 && !rawPhone.startsWith('0')) {
            rawPhone = `0${rawPhone}`;
          }

          // --- DATE PARSING ---
          // Handles "21/11/2025" or Excel Serial Numbers
          let studentDate = new Date();
          if (record.date) {
            const dateStr = String(record.date).trim();
            if (dateStr.includes('/')) {
              const [d, m, y] = dateStr.split('/');
              studentDate = new Date(Number(y), Number(m) - 1, Number(d));
            } else if (!isNaN(Number(dateStr))) {
              // Convert Excel Serial to JS Date
              studentDate = new Date(new Date(1899, 11, 30).getTime() + Number(dateStr) * 86400000);
            }
          }

          results.push({
            name: record.name?.trim(),
            email: record.email?.toLowerCase().trim(),
            courseName: normalizedCourse,
            location: record.location || 'DC ABUJA GUDU HQ',
            phone: rawPhone,
            date: studentDate,
            branchId: user.branchId,
            addedBy: user.id,
            status: 'Enrolled'
          });
        } else {
          skippedRows.push(record.name || 'Unknown');
          console.log(`Skipped: ${record.name} - Invalid Course: ${rawCourse}`);
        }
      }

      // 3. Database Operation
      if (results.length === 0) {
        throw new GraphQLError('No valid rows found. Please check Course Name values.');
      }

      try {
        // ordered: false ensures duplicates don't stop the whole import
        const docs = await AcademyModel.insertMany(results, { ordered: false });

        return {
          success: true,
          message: `Successfully imported ${docs.length} students. ${skippedRows.length} rows skipped.`,
          count: docs.length
        };
      } catch (err:any) {
        // If a bulk write error occurs (like duplicates), get successfully inserted docs
        const insertedCount = err.insertedDocs?.length || 0;
        return {
          success: true,
          message: `Import complete. Added ${insertedCount} students. Duplicates were skipped.`,
          count: insertedCount
        };
      }
    },
  }
};