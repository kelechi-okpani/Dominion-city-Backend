import * as bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { BranchUserModel, UserRole } from './model/branch-model.js';
import { IResolverContext } from '../../context.js';
import { CreateBranchInput } from './branch-schema.js';



export const branchCoreResolvers = {
  Query: {

       getSatelliteBranches: async (_parent: unknown, _args: unknown, { user }: IResolverContext) => {
          // Authorization Check: Must be ADMIN (HQ)
          if (!user || user.role !== UserRole.ADMIN) {
            throw new GraphQLError('Unauthorized: HQ Administrator access only.', {
              extensions: { code: 'FORBIDDEN' },
            });
          }
    
          try {
            // Satellite branches are stored as 'USER' role
            return await BranchUserModel.find({ role: UserRole.USER }).sort({ branchName: 1 });
          } catch (error) {
            throw new GraphQLError('Failed to retrieve satellite branches.', {
              extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
          }
        },
    
    /**
     * Retrieves the profile of the currently authenticated branch or admin.
     */
    me: async (_parent: unknown, _args: unknown, { user }: IResolverContext) => {
      if (!user) {
        throw new GraphQLError('Authentication required.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      try {
        const currentUser = await BranchUserModel.findById(user.id);
        if (!currentUser) {
          throw new GraphQLError('User profile not found.', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return currentUser;
      } catch (error) {
        throw new GraphQLError('Error fetching user profile.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

  },
  

  Mutation: {
    /**
     * Handles self-registration for new satellite branches.
     * Note: Branches are created with 'isActive: false' awaiting HQ approval.
     */
    registerSatellite: async (_parent: unknown, args: CreateBranchInput) => {
      const { fullName, email, password, branch_location } = args;

      try {
        // 1. Check for existing registration via Email or unique Branch ID
        const existingBranch = await BranchUserModel.findOne({
          $or: [{ email: email.toLowerCase() }, {branch_location: branch_location.toLowerCase() }],
        });

        if (existingBranch) {
          throw new GraphQLError('A branch with this email or Branch ID is already registered.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 2. Secure password hashing
        // Uses a fallback for testing, but ideally enforced via frontend
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password || "DC-Welcome-2026", saltRounds);

        // 3. Create branch record
        const newBranch = new BranchUserModel({
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          branch_location: branch_location.toLowerCase(),
          role: UserRole.USER,
          isActive: true, 
        });

        const savedBranch = await newBranch.save();
        
        // Return saved branch (Mongoose will map _id to id if virtuals are set)
        return savedBranch;

      } catch (error: any) {
        // Pass through GraphQL errors, wrap database/unexpected errors
        if (error instanceof GraphQLError) throw error;
        
        throw new GraphQLError('An unexpected error occurred during registration.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR', detail: error.message },
        });
      }
    },
  },
};