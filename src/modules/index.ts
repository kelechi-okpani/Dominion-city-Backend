// src/modules/index.ts
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { commonTypeDefs } from './typeDefs.js';
import { IResolverContext } from '../context.js';

// Module Imports
import { branchCoreTypeDefs } from './branch/branch-schema.js';
import { branchCoreResolvers } from './branch/branch-resolvers.js';

import { departmentTypeDefs } from './department/dept-Schema.js';
import { departmentResolvers } from './department/dept-resolvers.js';

import { attendanceTypeDefs } from './attendance/attendance-schema.js';
import { attendanceResolvers } from './attendance/attendance-resolvers.js';

import { soulWinningTypeDefs } from './soul-winning/soul-schema.js';
import { academyTypeDefs } from './academy/academy-schema.js';

import { academyResolvers } from './academy/academy-resolvers.js';
import { soulWinningResolvers } from './soul-winning/soul-resolvers.js';

import { cellTypeDefs } from './cell-unit/cell-schema.js';
import { cellResolvers } from './cell-unit/cell-resolvers.js';

import { expenseResolvers } from './expense/expense-resolvers.js';
import { expenseTypeDefs } from './expense/expense-schema.js';
import { analyticsTypeDefs } from './Analytics/typeDefs.js';
import { analyticsResolvers } from './Analytics/resolvers.js';
import { InstagramTypeDefs } from './instagram/instagram-typeDefs.js';
import { instagramResolvers } from './instagram/instagram-resolvers.js';

/**
 * Merging Type Definitions
 * mergeTypeDefs handles the 'extend type' logic automatically
 */
export const typeDefs = mergeTypeDefs([
  commonTypeDefs,

  analyticsTypeDefs,
  
  expenseTypeDefs,
  branchCoreTypeDefs,
  departmentTypeDefs,
  attendanceTypeDefs,
  soulWinningTypeDefs,
  academyTypeDefs,
  cellTypeDefs,

  InstagramTypeDefs
]);

/**
 * Merging Resolvers
 * This combines all Query and Mutation objects into one
 */

export const resolvers = mergeResolvers([

  analyticsResolvers,

  expenseResolvers,
  branchCoreResolvers,
  departmentResolvers,
  attendanceResolvers,
  soulWinningResolvers,
  academyResolvers,
  cellResolvers,

  instagramResolvers
]) as any;  
