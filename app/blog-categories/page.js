import React from "react";
import CategoriesClient from "../Components/CategoriesClient";

// 🔥 ISR: Cache this page for 60 seconds for ultra-fast performance
export const revalidate = 60;
export const dynamic = "force-dynamic";
// Professional SEO Metadata
export const metadata = {
  title: "Explore All Categories | Directory",
  description:
    "Browse our comprehensive directory to find the best deals, verified coupons, and expert buying guides for every category.",
};

// Bulletproof URL Helper
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function getCategoriesTree() {
  try {
    const baseUrl = getBaseUrl();
    // Using the ?tree=true parameter we built in the API
    const res = await fetch(`${baseUrl}/api/public/categories?tree=true`,   { 
        next: { 
          revalidate: 3600,
          tags: ["blogs", "categories"] // 🔥 Tag base cache added here
        } 
      },);

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching categories tree:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  // Fetch data instantly on the server
  const categories = await getCategoriesTree();

  return (
    <main>
      <CategoriesClient initialCategories={categories} />
    </main>
  );
}
