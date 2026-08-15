import mongoose from "mongoose";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const username = encodeURIComponent(process.env.myusername || "");
const password = encodeURIComponent(process.env.mypassword || "");
const dbName = process.env.DB_NAME || "takesmeout_db";

if (!username || !password) {
  throw new Error(
    "Missing MongoDB credentials: Set 'myusername' and 'mypassword' in environment variables.",
  );
}

// Updated MongoDB URI using your new cluster string
const MONGODB_URI = `mongodb://${username}:${password}@ac-1n1puzr-shard-00-00.rjezspk.mongodb.net:27017,ac-1n1puzr-shard-00-01.rjezspk.mongodb.net:27017,ac-1n1puzr-shard-00-02.rjezspk.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-1069jg-shard-0&authSource=admin&appName=Cluster0`;

let cached = globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection failed:", error);
    throw new Error(
      "Database connection failed. Please check MongoDB URI, credentials, or network access.",
    );
  }
}
