import { GraphQLError } from 'graphql';
import { AcademyModel } from './model/academy-model.js';
import { UserRole } from '../branch/model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { parse } from 'csv-parse';
import { GraphQLUpload } from 'graphql-upload-ts';

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

        uploadEnrolledStudent: async (_: any, { file }: any, { user }: IResolverContext) => {
        // 1. Check Auth
        if (!user) throw new GraphQLError('Unauthorized');

        // 2. Resolve the file promise
        const upload = await file;
        
        // Validation check for the stream function
        if (!upload || typeof upload.createReadStream !== 'function') {
          throw new GraphQLError('Invalid file upload: createReadStream is missing.');
        }

        const stream = upload.createReadStream();
        const results: any[] = [];

        // 3. Parse the stream
        const parser = stream.pipe(
          parse({
            columns: true, // Uses CSV headers as keys
            skip_empty_lines: true,
            trim: true,
          })
        );

        for await (const record of parser) {
          // Define valid courses with underscores
          const validCourses = ['DLI_BASIC', 'DLI_ADVANCE', 'DCA_BASIC', 'DCA_ADVANCE'];
          
          // Normalize input: uppercase and convert spaces to underscores
          const course = record.CourseName?.toUpperCase().trim().replace(/\s+/g, '_');

          if (validCourses.includes(course)) {
            // Phone Number Formatting: Add leading '0' if 10 digits
            let formattedPhone = record.Phone?.toString().trim() || '';
            if (formattedPhone.length === 10) {
              formattedPhone = `0${formattedPhone}`;
            }

            results.push({
              name: record.Name,
              email: record.Email?.toLowerCase(),
              courseName: course,
              location: record.Location || 'DC ABUJA GUDU HQ',
              phone: formattedPhone,
              date: record.Date ? new Date(record.Date) : new Date(),
              branchId: user.branchId,
              addedBy: user.id,      
              status: 'Enrolled'
            });
          }
        }

        // 4. Database Insertion
        try {
          // ordered: false ensures that if one row fails (e.g. duplicate email), 
          // the others still succeed.
          const docs = await AcademyModel.insertMany(results, { ordered: false });
          
          return {
            success: true,
            message: `Successfully imported ${docs.length} students to your branch.`,
            count: docs.length
          };
        } catch (err: any) {
          // Mongoose insertMany returns successfully inserted docs in err.insertedDocs 
          // when ordered is false and a bulk write error occurs.
          const insertedCount = err.insertedDocs?.length || 0;
          
          return {
            success: true,
            message: `Import complete. Added ${insertedCount} records (skipped duplicates or invalid data).`,
            count: insertedCount
          };
        }
          }
  }
};