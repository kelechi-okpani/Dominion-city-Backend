import bcrypt from 'bcryptjs';
import { BranchModel } from '../modules/branch/model/branch.js';
import { BranchUserModel } from '../modules/branch/model/branch-model.js';

export const seedAdmin = async () => {
  try {
    // 1. Check if an Admin USER already exists (to avoid duplicates)
    const adminExists = await BranchUserModel.findOne({ role: 'ADMIN' });
    if (adminExists) {
      console.log('ℹ️ [Seeder] Admin user already exists. Skipping...');
      return;
    }

    // 2. Try to find the HQ Branch. If it doesn't exist, CREATE it.
    let hqBranch = await BranchModel.findOne({ role: 'ADMIN' });

    if (!hqBranch) {
      console.log('ℹ️ [Seeder] HQ Branch missing. Creating default HQ branch...');
      hqBranch = await BranchModel.create({
        fullName: "System Administrator",
        name: "Super Admin National",
        role: "ADMIN",
        enumValue: "DC_NATIONAL",
        isActive: true
      });
      console.log('✅ [Seeder] HQ Branch created.');
    }

    // 3. Prepare Admin Credentials
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // 4. Create the Admin User linked to the hqBranch ID
    const newAdmin = new BranchUserModel({
      fullName: "System Administrator",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
      branch: hqBranch._id, // Now guaranteed to have an ID
      isActive: true,
    });

    await newAdmin.save();
    
    console.log('---');
    console.log(`🚀 [Seeder] Admin account successfully initialized.`);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🏢 Branch: ${hqBranch.name}`);
    console.log('---');

  } catch (error) {
    console.error('❌ [Seeder] Critical error during seeding:', error);
  }
};