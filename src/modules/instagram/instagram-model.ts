import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInstagramMedia extends Document {
  branchId?: mongoose.Types.ObjectId; // Optional: Link to a 'General' branch ID
  instagramId: string;
  caption?: string;
  mediaType: 'Image' | 'Video' | 'Sidecar';
  mediaUrl: string;
  permalink: string;
  thumbnailUrl?: string;
  timestamp: Date;
  lastSyncedAt: Date;
}

const InstagramMediaSchema = new Schema<IInstagramMedia>(
  {
    // branchId can be null for 'General Abuja' feed or specific for branch-only posts
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    instagramId: { type: String, required: true, unique: true, index: true },
    caption: { type: String },
    mediaType: { 
      type: String, 
      enum: ['Image', 'Video', 'Sidecar'], 
      required: true 
    },
    mediaUrl: { type: String, required: true },
    permalink: { type: String, required: true },
    thumbnailUrl: { type: String },
    timestamp: { type: Date, required: true },
    lastSyncedAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    // Automatically removes the __v field from JSON responses for a cleaner API
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// High-performance index for the dashboard feed
InstagramMediaSchema.index({ timestamp: -1 });

export const InstagramMediaModel: Model<IInstagramMedia> = 
  mongoose.models.InstagramMedia || mongoose.model<IInstagramMedia>('InstagramMedia', InstagramMediaSchema);