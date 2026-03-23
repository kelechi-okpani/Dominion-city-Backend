import mongoose, { Schema, Document, Model } from 'mongoose';

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface IBranchUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  // CHANGE: Reference the Branch by ID instead of the static Enum name
  branch: mongoose.Types.ObjectId | any; 
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchUserSchema: Schema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: Object.values(UserRole), 
    default: UserRole.USER 
  },
  branch: { 
    type: Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true,
    unique: true
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BranchUserModel: Model<IBranchUser> = mongoose.models.BranchUser || mongoose.model<IBranchUser>('BranchUser', BranchUserSchema);