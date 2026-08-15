import mongoose from "mongoose";
import dns from "dns";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const username = encodeURIComponent(process.env.myusername || "");
const password = encodeURIComponent(process.env.mypassword || "");
const dbName = process.env.DB_NAME || "yoursavingstart_db";

if (!username || !password) {
  console.error("❌ Environment variables 'myusername' ya 'mypassword' nahi mile!");
  process.exit(1);
}

const MONGODB_URI = `mongodb://${username}:${password}@ac-kdc6oty-shard-00-00.0qb00tn.mongodb.net:27017,ac-kdc6oty-shard-00-01.0qb00tn.mongodb.net:27017,ac-kdc6oty-shard-00-02.0qb00tn.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-weum7z-shard-0&authSource=admin&appName=Cluster0`;

async function migrate() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log("Connected successfully!");

    const collection = mongoose.connection.collection("categories");

    // 1. Puraane conflicting index ko drop (delete) karein
    console.log("Checking and dropping old 'slug_1' index if it exists...");
    try {
      await collection.dropIndex("slug_1");
      console.log("✅ Old 'slug_1' index dropped successfully.");
    } catch (err) {
      console.log("ℹ️ Old index not found or already dropped, moving forward...");
    }

    // 2. Naya index create karein
    console.log("Creating/Rebuilding naya index with updated settings...");
    await collection.createIndex({ slug: 1 }, { unique: true, sparse: true });

    console.log("✅ Category indexes migration successfully complete!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

migrate();