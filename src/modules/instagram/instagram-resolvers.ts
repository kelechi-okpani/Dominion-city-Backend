import { IResolverContext } from "../../context.js";
import { InstagramMediaModel } from "./instagram-model.js";



export const instagramResolvers = {
  Query: {
    getAbujaFeed: async (_: any, __: any, { user }: IResolverContext) => {
      // Security: Just ensure they are logged in
      if (!user) throw new Error('Unauthorized');

      // Return the latest 20 posts for everyone to see
      return await InstagramMediaModel.find()
        .sort({ timestamp: -1 })
        .limit(20);
    }
  }
};