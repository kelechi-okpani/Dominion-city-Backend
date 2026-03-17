import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { BranchUserModel, UserRole } from './model/branch-model.js';
import { IResolverContext } from '../../context.js';

export const branchCoreResolvers = {
  Query: {
    getSatelliteBranches: async (_parent: any, _args: any, { user }: IResolverContext) => {
      if (!user || user.role !== UserRole.ADMIN) {
        throw new GraphQLError('Unauthorized: HQ Administrator access only.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return await BranchUserModel.find({ role: UserRole.USER }).sort({ branchName: 1 });
    },

    me: async (_parent: any, _args: any, { user }: IResolverContext) => {
      if (!user) throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
      return await BranchUserModel.findById(user.id);
    },
  },

  Mutation: {
    login: async (_parent: any, { email, password }: any) => {
      const user = await BranchUserModel.findOne({ email: email.toLowerCase() });
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

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, role: user.role, branchName: user.branchName },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '1d' }
      );

      return { token, user };
    },

    register: async (_parent: any, { fullName, email, password, branchName }: any) => {
      try {
        // 1. Check if email or branch is already taken
        const existing = await BranchUserModel.findOne({
          $or: [{ email: email.toLowerCase() }, { branchName }]
        });

        if (existing) {
          throw new GraphQLError('Email or Branch Name is already registered.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // 2. Determine Role based on Branch Name
        // If they select ABUJA_HQ, they get ADMIN privileges
        const assignedRole = branchName === 'ABUJA_HQ' ? UserRole.ADMIN : UserRole.USER;

        const hashedPassword = await bcrypt.hash(password, 12);

        // 3. Create the new record
        const newBranch = new BranchUserModel({
          fullName,
          email: email.toLowerCase(),
          password: hashedPassword,
          branchName,
          role: assignedRole, // Dynamically assigned role
          isActive: true, 
        });

        return await newBranch.save();
      } catch (error: any) {
        if (error instanceof GraphQLError) throw error;
        throw new GraphQLError(error.message, { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
},
  },
};