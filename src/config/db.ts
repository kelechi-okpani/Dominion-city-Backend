
import mongoose from 'mongoose';
import dns from 'node:dns';

// STEP 1: Force Node to use Google DNS to bypass local ISP resolution failures
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MAX_RETRIES = 5;
let retryCount = 0;

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || "";

  const options = {
    serverSelectionTimeoutMS: 5000, // Stop hanging, fail fast if network is down
    socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    family: 4                       // Force IPv4 (many Nigerian ISPs struggle with IPv6)
  };

  try {
    await mongoose.connect(mongoURI, options);
    console.log("🚀 MongoDB Connected: Dominion City Cluster");
    retryCount = 0; // Reset on success
  } catch (err) {
    console.error(`❌ DB Connection Error: ${err}`);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff (2s, 4s, 8s...)
      console.log(`🔄 Retrying connection in ${delay/1000}s... (Attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectDB, delay);
    } else {
      console.error("💀 Critical: Max retries reached. Check your network or Whitelist IP.");
      process.exit(1);
    }
  }
};

// Handle mid-session disconnections
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});



// import mongoose from 'mongoose';
// import dotenv from 'dotenv';

// dotenv.config();

// // src/config/db.ts
// export const connectDB = async () => {
//   const uri = process.env.MONGO_URI;

//   if (!uri) {
//     console.error('❌ Error: MONGO_URI is missing.');
//     process.exit(1);
//   }

//   try {
//     // Add the 'family: 4' option here
//     const conn = await mongoose.connect(uri, {
//       family: 4 
//     });
//     console.log(`✨ MongoDB Connected: ${conn.connection.host}`);
//   } catch (error) {
//     console.error(`❌ DB Connection Error: ${error}`);
//     process.exit(1);
//   }
// };

