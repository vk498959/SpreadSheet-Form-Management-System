import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/test";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI in .env.local");
}

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
