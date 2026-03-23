import mongoose from 'mongoose';
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const options = {
  serverSelectionTimeoutMS: 10000, 
  socketTimeoutMS: 45000,         
  family: 4,                      
  // This is key: tell Mongoose not to buffer if the connection is down
  bufferCommands: false, 
};

export const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.error('❌ Error: MONGO_URI is missing from .env');
    process.exit(1);
  }

  try {
    const connect = await mongoose.connect(mongoURI, options);
    console.log(`🚀 MongoDB Connected: ${connect.connection.host}`);
    return connect; 
  } catch (err) {
    // DO NOT catch the error here on the first try. 
    // Let it bubble up to startServer so the server doesn't start without a DB.
    throw err; 
  }
};

// Handle mid-session disconnections (Reconnection Logic)
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ MongoDB Runtime Error: ${err}`);
});