import { GraphQLError } from 'graphql';
import { IResolverContext } from "../../context.js";
import { InstagramMediaModel } from "./instagram-model.js";
import { syncInstagramFeed } from '../../jobs/instagram-sync.js';


export const instagramResolvers = {

   Mutation: {
    triggerInstagramSync: async (_parent: any, _args: any, { user }: IResolverContext) => {
      // 1. Security: Only allow Authenticated Admins
      if (!user || user.role !== 'ADMIN') {
        throw new GraphQLError('Unauthorized: Administrative access required.', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        // 2. Trigger the sync function (we don't 'await' if we want it to run in background, 
        // but for a manual button, it's better to await so the user knows when it's done)
        await syncInstagramFeed();

        return {
          success: true,
          message: "Instagram feed sync completed successfully."
        };
      } catch (error) {
        console.error("Manual Sync Error:", error);
        return {
          success: false,
          message: "Failed to trigger sync. Check server logs."
        };
      }
    }
  },
  
 Query: {
  getInstagramFeed: async (
    _parent: any, 
    { limit = 20, skip = 0 }: { limit?: number; skip?: number }, 
    { user }: IResolverContext
  ) => {
    // 1. Auth Check
    if (!user) {
      throw new GraphQLError('You must be logged in to view the social feed.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    try {
      // DEBUG: Let's see what Mongoose is actually looking at
      const collectionName = InstagramMediaModel.collection.name;
      const dbName = InstagramMediaModel.db.name;
      console.log(`🔍 Querying DB: ${dbName} | Collection: ${collectionName}`);

      // 2. Execute parallel queries
      const [posts, totalCount] = await Promise.all([
        InstagramMediaModel.find({})
          .sort({ timestamp: -1 })
          .skip(Number(skip)) // Ensure these are numbers
          .limit(Number(limit))
          .lean(),
        InstagramMediaModel.countDocuments({})
      ]);

      console.log(`📊 Found ${posts.length} posts. Total in DB: ${totalCount}`);

      return {
        posts: posts.map(post => ({
          ...post,
          id: post._id.toString(), // Ensure _id is mapped to id for GraphQL
        })),
        totalCount,
        hasMore: skip + posts.length < totalCount
      };
    } catch (error) {
      console.error("❌ Error fetching Instagram feed:", error);
      throw new GraphQLError('Failed to retrieve Instagram media.');
    }
  }
}

};