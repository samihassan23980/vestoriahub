import React from "react";
import NavbarClient from "./NavbarClient"; // Upper banayi gayi file ka path

// Server-side data fetching
async function getNavCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Aggressive caching for the Navbar (Revalidates every 1 hour)
    const res = await fetch(
      `${baseUrl}/api/public/categories/module/blog?level=0&limit=8`,
      { 
        next: { 
          revalidate: 3600,
          tags: ["categories"] // 🔥 Tag base cache added here
        } 
      },
    );

    if (!res.ok) return [];

    const json = await res.json();

    if (json.success && json.data.length > 0) {
      return json.data.map((cat) => ({
        name: cat.name,
        slug: `/blog-categories/${cat.slug}`,
        // The 'isHot' flag can trigger the Premium Gold (#F0C040) accent in the client
        isHot: cat.isFeatured || false,
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch nav categories on server:", error);
    return []; // Graceful fallback prevents the Navbar from crashing
  }
}

export default async function Navbar() {
  // Fetch data instantly on the server
  const categoryItems = await getNavCategories();

  // Pass it to the interactive client component
  return <NavbarClient categoryItems={categoryItems} />;
}
