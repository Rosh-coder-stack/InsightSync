import dns from 'node:dns';
import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose.
 * Configures public DNS servers beforehand as a fallback to prevent
 * querySrv ECONNREFUSED errors on restricted networks and cloud hosts.
 */
export async function connectDB() {
  dns.setServers(['8.8.8.8', '1.1.1.1']);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MongoDB connection error: MONGODB_URI is not defined.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
}

export default connectDB;
