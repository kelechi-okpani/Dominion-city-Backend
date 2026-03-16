import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// src/config/db.ts
export const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ Error: MONGO_URI is missing.');
    process.exit(1);
  }

  try {
    // Add the 'family: 4' option here
    const conn = await mongoose.connect(uri, {
      family: 4 
    });
    console.log(`✨ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ DB Connection Error: ${error}`);
    process.exit(1);
  }
};

