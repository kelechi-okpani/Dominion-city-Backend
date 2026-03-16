import { GraphQLError } from 'graphql';
import { finished } from 'stream/promises';
import { parse } from 'csv-parse';
import { IResolverContext } from '../context.js';
import { AcademyModel } from '../modules/academy/model/academy-model.js';



export const academyUploadResolvers = {
  Mutation: {
    uploadAcademyCSV: async (_: any, { file }: any, { user }: IResolverContext) => {
      // 1. Check Auth
      if (!user) throw new GraphQLError('Unauthorized');

      const { createReadStream } = await file;
      const stream = createReadStream();
      const results: any[] = [];

      // 2. Parse the stream
      const parser = stream.pipe(
        parse({
          columns: true, // Uses CSV headers as keys
          skip_empty_lines: true,
          trim: true,
        })
      );

      for await (const record of parser) {
        // Validation: Ensure course names match your Enum strictly
        const validCourses = ['DLI BASIC', 'DLI ADVANCE', 'DCA BASIC', 'DCA ADVANCE'];
        const course = record.CourseName?.toUpperCase().replace('_', ' '); // Flexible formatting

        if (validCourses.includes(course)) {
          results.push({
            name: record.Name,
            email: record.Email?.toLowerCase(),
            courseName: course,
            location: record.Location || 'Main Campus',
            phone: record.Phone,
            date: record.Date ? new Date(record.Date) : new Date(),
            branchId: user.branchId,
            addedBy: user.id,      
            status: 'Enrolled'
          });
        }
      }

      // 3. Database Insertion
      try {
        // ordered: false ensures that if one row (like a duplicate email) fails, 
        // the rest still upload.
        const docs = await AcademyModel.insertMany(results, { ordered: false });
        
        return {
          success: true,
          message: `Successfully imported ${docs.length} students to your branch.`,
          count: docs.length
        };
      } catch (err: any) {
        // If some were duplicates, insertMany throws an error but still inserts the others
        const insertedCount = err.insertedDocs?.length || 0;
        return {
          success: true,
          message: `Import complete. Added ${insertedCount} records (skipped duplicates).`,
          count: insertedCount
        };
      }
    }
  }
};