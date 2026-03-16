import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISoulWinning extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  phone: string;
  category: 'First Timer' | 'New Convert';
  service:   "Sunday Service" | "Mid-Week Service" | "Outreach" | "Special Event / Church Service";
  serviceDesc?: string;
  address?: string;
  date: Date;
  addedBy: mongoose.Types.ObjectId;
}

const SoulWinningSchema = new Schema<ISoulWinning>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      enum: ['First Timer', 'New Convert'], 
      required: true 
    },
    service: { 
      type: String, 
      required: true 
    },
    serviceDesc: { type: String },
    address: { type: String },
    date: { type: Date, default: Date.now, index: true },
    addedBy: { type: Schema.Types.ObjectId, ref: 'BranchUser', required: true }
  },
  { timestamps: true }
);

// Index to prevent duplicate entries for the same person on the same day
SoulWinningSchema.index({ phone: 1, date: 1, branchId: 1 }, { unique: true });

export const SoulWinningModel: Model<ISoulWinning> = 
  mongoose.models.SoulWinning || mongoose.model<ISoulWinning>('SoulWinning', SoulWinningSchema);