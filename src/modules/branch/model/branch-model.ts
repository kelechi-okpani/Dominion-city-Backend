import mongoose, { Schema, Document, Model } from 'mongoose';

export enum UserRole {
  ADMIN = "ADMIN", // DC-HQ
  USER = "USER",   // DC-Satellite
}

export interface IBranchUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  branch_location: string;
  isActive: boolean;
}

const BranchUserSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  branch_location:  { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BranchUserModel: Model<IBranchUser> = mongoose.models.BranchUser || mongoose.model<IBranchUser>('BranchUser', BranchUserSchema);