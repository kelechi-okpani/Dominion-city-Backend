import bcrypt from 'bcryptjs';
import { BranchModel } from '../modules/branch/model/branch.js';
import { BranchUserModel } from '../modules/branch/model/branch-model.js';

export const seedAdmin = async () => {
  try {
    // 1. Find the National Team/HQ branch to link the admin to
    const hqBranch = await BranchModel.findOne({ enumValue: 'ABUJA_HQ' });

    if (!hqBranch) {
      console.warn('⚠️ [Seeder] HQ Branch (ABUJA_HQ) not found. Seed branches first!');
      return;
    }

    // 2. Check if an admin for this branch or email already exists
    const adminExists = await BranchUserModel.findOne({
      $or: [
        { email: (process.env.ADMIN_EMAIL || "admin@yourdomain.com").toLowerCase() },
        { branch: hqBranch._id }
      ]
    });

    if (adminExists) {
      console.log('ℹ️ [Seeder] Admin or HQ Branch user already exists. Skipping...');
      return;
    }

    // 3. Hash password and create admin
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'DefaultAdmin123!', 12);

    const admin = new BranchUserModel({
      fullName: "System Administrator",
      email: (process.env.ADMIN_EMAIL || "admin@yourdomain.com").toLowerCase(),
      password: hashedPassword,
      role: UserRole.ADMIN, // Explicitly set as ADMIN
      branch: hqBranch._id,
      isActive: true,
    });

    await admin.save();
    console.log(`✅ [Seeder] Admin account created and linked to ${hqBranch.name}.`);
  } catch (error) {
    console.error('❌ [Seeder] Error seeding admin:', error);
  }
};