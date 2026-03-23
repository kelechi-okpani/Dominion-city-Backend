import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBranch extends Document {
  name: string;      
  enumValue: string; 
  isActive: boolean;
}

const BranchSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  enumValue: { type: String, required: true, unique: true }, 
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BranchModel: Model<IBranch> = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);