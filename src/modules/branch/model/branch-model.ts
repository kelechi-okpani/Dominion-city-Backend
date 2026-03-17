import mongoose, { Schema, Document, Model } from 'mongoose';

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

// Enum for Abuja Branches
export enum AbujaBranchName {
  // Major Regional / HQ
  ABUJA_HQ = "ABUJA_HQ",           // Durumi / Gudu area (Oladipo Diya St)
  WUSE = "WUSE",                   // Wuse Zone 5 / Accra St
  JABI = "JABI",                   // Jabi / Kado area
  GWARINPA = "GWARINPA",           // Gwarinpa Estate
  
  // Satellite & Growing Branches
  APO = "APO",                     // Apo / Gudu District
  LUGBE = "LUGBE",                 // Lugbe / Airport Road
  KUJE = "KUJE",                   // Kuje Area Council
  KUBWA = "KUBWA",                 // Kubwa / PW area
  MAITAMA = "MAITAMA",             // Maitama District
  ASOKORO = "ASOKORO",             // Asokoro District
  GARKI = "GARKI",                 // Garki Area
  UTAKO = "UTAKO",                 // Utako District
  NYANYA_MARARABA = "NYANYA_MARARABA", // Greater Abuja boundary
  DAWAKI = "DAWAKI"                // Dawaki / Katampe extension
}

export interface IBranchUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  branchName: AbujaBranchName; // Using the Enum
  isActive: boolean;
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
  branchName: { 
    type: String, 
    enum: Object.values(AbujaBranchName), 
    required: true, 
    unique: true // One user/account per branch
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const BranchUserModel: Model<IBranchUser> = mongoose.models.BranchUser || mongoose.model<IBranchUser>('BranchUser', BranchUserSchema);