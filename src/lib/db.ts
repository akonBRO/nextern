// src/lib/db.ts
import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

function getMongoUri() {
  const uri = process.env.MONGODB_URI ?? process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('MONGODB_URI or DATABASE_URL is not set in environment variables.');
  }
  return uri;
}

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), { bufferCommands: false }).catch((error) => {
      cached.promise = null;
      throw error;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
