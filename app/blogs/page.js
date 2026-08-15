import React from "react";
import Link from "next/link";

import { AlertCircle, Compass } from "lucide-react";
import AllBlogsInfiniteFeed from "@/app/Components/AllBlogsInfiniteFeed";

// ─── DATA FETCHING ────────────────────────────────────────────────────────────
async function getAllBlogs() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    // Fetches initial 12 blogs based on your specific GET /public/blogs structure
    const res = await fetch(`${baseUrl}/api/public/blogs?page=1&limit=12`, {
    next: { 
        revalidate: 3600,
        tags: ["blogs"] // 🔥 Tag base cache added here
      },
    });
    if (!res.ok) return null;
    const result = await res.json();
    return result;
  } catch (error) {
    return null;
  }
}
export const metadata = {
  title: "Shopping Guides & Deal Blog ",
  description:
    "Read expert buying guides, product comparisons & deal-hunting tips. Real reviews to help you shop smarter and save more on every purchase.",
  alternates: { canonical: "/blogs" },
};
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default async function BlogsIndexPage() {
  const data = await getAllBlogs();

  // MAPPED EXACTLY TO YOUR API
  const initialBlogs = data?.blogs || [];
  const hasNextPage = data ? data.page < data.totalPages : false;

  if (!data || initialBlogs.length === 0) {
    return (
      <div
        className={`flex min-h-[70vh] flex-col items-center justify-center bg-[var(--color-background)] px-6 text-center`}
      >
        <div className="w-24 h-24 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center mb-6 border border-[var(--color-danger)]/20 shadow-[0_4px_16px_rgba(248,113,113,0.15)]">
          <AlertCircle size={40} className="text-[var(--color-danger)]" />
        </div>
        <h1 className="text-[40px] font-extrabold text-[var(--color-text-primary)] mb-4 tracking-tight">
          No Articles Found
        </h1>
        <p className="max-w-md text-[var(--color-text-secondary)] font-medium text-[16px] leading-relaxed mb-8">
          It seems we couldn't load the articles right now. Please try again
          later.
        </p>
        <Link
          href="/"
          className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-[15px] px-10 py-4 rounded-full transition-colors shadow-[0_4px_16px_rgba(124,92,252,0.25)]"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[var(--color-background)] pb-24`}>
      {/* ── GRAND PAGE HERO ── */}
      <section className="relative overflow-hidden bg-[var(--color-navy-900)] border-b border-[var(--color-border)] py-28 md:py-40 text-center px-4">
        {/* Ambient Dark-Mode Glows */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--color-primary)] via-transparent to-transparent blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--color-primary)]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-secondary)]/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 max-w-[800px] mx-auto">
          <div className="inline-flex items-center gap-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-secondary)] text-[11px] font-extrabold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8 backdrop-blur-sm shadow-[0_4px_12px_rgba(3,4,10,0.5)]">
            <Compass size={14} /> The Ultimate Guide
          </div>

          <h1 className="text-[48px] md:text-[64px] lg:text-[80px] font-extrabold text-[var(--color-text-primary)] leading-[1.05] mb-6 tracking-tight">
            Discover. Learn. <br className="hidden md:block" /> Shop Smarter.
          </h1>

          <p className="text-[var(--color-text-secondary)] text-[18px] md:text-[20px] font-medium leading-relaxed max-w-2xl mx-auto">
            Explore our entire archive of expert financial insights, verified
            deal strategies, and in-depth product reviews.
          </p>
        </div>
      </section>

      {/* ── THE INFINITE ENGINE ── */}
      <div className="max-w-[1360px] mx-auto">
        <AllBlogsInfiniteFeed
          initialBlogs={initialBlogs}
          initialHasMore={hasNextPage}
        />
      </div>
    </main>
  );
}
