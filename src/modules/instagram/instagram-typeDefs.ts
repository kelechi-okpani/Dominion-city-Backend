import { gql } from 'apollo-server-express';

export const InstagramTypeDefs = gql`

type InstagramMedia {
  id: ID!
  instagramId: String!
  caption: String
  mediaType: String!
  mediaUrl: String!
  permalink: String!
  thumbnailUrl: String
  timestamp: String!
  lastSyncedAt: String!
}

type InstagramFeedResponse {
  posts: [InstagramMedia!]!
  totalCount: Int!
  hasMore: Boolean!
}



type SyncResponse {
  success: Boolean!
  message: String!
}

extend type Mutation {
  # Manually trigger the Instagram scraper
  triggerInstagramSync: SyncResponse!
}

extend type Query {
  # Get all items with optional pagination
  getInstagramFeed(limit: Int, skip: Int): InstagramFeedResponse!
}

`