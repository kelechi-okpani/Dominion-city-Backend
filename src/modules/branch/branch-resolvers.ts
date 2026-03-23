import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { BranchUserModel, UserRole } from './model/branch-model.js'; // Your User Model
import { IResolverContext } from '../../context.js';
import bcrypt from 'bcryptjs';
import { BranchModel } from './model/branch.js';


export const branchCoreResolvers = {
  Query: {
    // 1. New Resolver to fetch the seeded branches from MongoDB
    getAllBranches: async () => {
      try {
        return await BranchModel.find({ isActive: true }).sort({ name: 1 });
      } catch (error: any) {
        throw new GraphQLError('Error fetching branches', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    getSatelliteBranches: async (_parent: any, _args: any, { user }: IResolverContext) => {
      if (!user || user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Unauthorized: HQ Administrator access only.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Populate 'branch' to get the full Branch object instead of just the ID
      return await BranchUserModel.find({ role: UserRole.USER })
        .populate('branch') 
        .sort({ fullName: 1 });
    },

    me: async (_parent: any, _args: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      return await BranchUserModel.findById(user.id).populate('branch');
    },
  },


  Mutation: {
    login: async (_parent: any, { email, password }: any) => {
      const user = await BranchUserModel.findOne({ email: email.toLowerCase() }).populate('branch');
      if (!user) {
        throw new GraphQLError('Invalid credentials.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const isValid = await bcrypt.compare(password, user.password!);
      if (!isValid) {
        throw new GraphQLError('Invalid credentials.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      if (!user.isActive) {
        throw new GraphQLError('Account is inactive. Please contact HQ.', { extensions: { code: 'FORBIDDEN' } });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, branchId: user.branch },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '1d' }
      );

      return { token, user };
    },

    
    register: async (_parent: any, { fullName, email, password, branchId }: any) => {
      try {
        // 1. Verify the branch exists in our seeded collection
        const selectedBranch = await BranchModel.findById(branchId);
        if (!selectedBranch) {
          throw new GraphQLError('Selected branch does not exist.', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        // 2. Check if email is taken or if this branch already has an account
        const existing = await BranchUserModel.findOne({
          $or: [{ email: email.toLowerCase() }, { branch: branchId }]
        });

        if (existing) {
          throw new GraphQLError('Email or Branch is already registered.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }


        // 3. Assign ADMIN if it's the HQ branch, otherwise USER
        const assignedRole = selectedBranch.enumValue === 'ABUJA_HQ' ? UserRole.ADMIN : UserRole.USER;
        const hashedPassword = await bcrypt.hash(password, 12);

        const newBranchUser = new BranchUserModel({
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          branch: branchId, // Save the Reference ID
          role: assignedRole,
          isActive: true, 
        });

        const savedUser = await newBranchUser.save();
        // Return with populated branch data
        return await savedUser.populate('branch');
        
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
  },
};