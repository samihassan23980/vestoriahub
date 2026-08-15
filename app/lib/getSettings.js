import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb"; // Use your existing DB connection function
import SiteSettings from "@/app/models/siteSettings";
import { unstable_cache } from "next/cache";

// Yeh function DB se data layega aur 1 ghante tak Next.js ke cache mein save rakhega
export const getGlobalSettings = unstable_cache(
  async () => {
    try {
      await connectDB();

      const settings = await SiteSettings.findOne({
        singletonId: "VestoriaHub-global",
      }).lean();

      if (!settings) return null;

      // THE FIX: Convert MongoDB complex objects to plain strings
      return {
        ...settings,
        _id: settings._id.toString(),
        createdAt: settings.createdAt?.toISOString(),
        updatedAt: settings.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error("Failed to fetch global settings:", error);
      return null;
    }
  },
  ["global-site-settings"], // Cache key
  {
    revalidate: 3600, // 1 Hour Cache
    tags: ["global-site-settings"], // MUST HAVE THIS for instant updates
  },
);
