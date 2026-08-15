import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { CalendarDays, AlertCircle } from "lucide-react";

// ─── Font Optimization ───────────────────────────────────────────────────────
// VestoriaHub uses Inter as the primary brand typography
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// ─── Reusable UI Components ──────────────────────────────────────────────────
const SectionTitle = ({ title }) => (
  <h2 className="font-sans text-[28px] font-extrabold text-[#1A1A1A] leading-tight mb-4 border-b-[3px] border-[#065047] pb-2 inline-block tracking-tight">
    {title}
  </h2>
);

// VestoriaHub Guidelines: Highlight Tags/Badges - Background #065047, Text #FFFFFF
const CategoryBadge = ({ category }) => (
  <span className="inline-block bg-[#065047] text-[#FFFFFF] text-[10px] font-sans font-bold tracking-[0.05em] uppercase px-[10px] py-[4px] rounded-md mb-[10px] shadow-sm">
    {category}
  </span>
);

// Large Featured Card
const HeroLargeCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="relative group block h-[400px] rounded-[16px] overflow-hidden bg-[#ECF9F9] shadow-sm transition-shadow hover:shadow-md"
  >
    <Image
      src={post.image || "/fallback-blog.jpg"}
      alt={post.title}
      fill
      priority
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
    {/* Dark gradient overlay using Charcoal Black for high contrast text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/95 via-[#1A1A1A]/40 to-transparent flex flex-col justify-end p-6 z-10">
      <CategoryBadge category={post.categoryName} />
      <h3 className="font-sans text-[32px] font-extrabold text-[#FFFFFF] leading-tight mb-2 tracking-tight">
        {post.title}
      </h3>
      <p className="text-[#ECF9F9]/80 text-[15px] font-medium line-clamp-2">
        {post.excerpt}
      </p>
      {/* Primary Brand Hover Effect */}
      <div className="mt-5 inline-flex items-center text-[#FFFFFF] bg-[#FFFFFF]/20 border border-[#FFFFFF]/30 backdrop-blur-md text-[13px] font-bold px-5 py-2.5 rounded-md group-hover:bg-[#065047] group-hover:border-[#065047] transition-all duration-300 w-max shadow-sm">
        Read Article
      </div>
    </div>
  </Link>
);

// Small Grid Card
const HeroGridCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="relative group block h-[192px] rounded-[16px] overflow-hidden bg-[#ECF9F9] shadow-sm"
  >
    <Image
      src={post.image || "/fallback-blog.jpg"}
      alt={post.title}
      fill
      priority
      sizes="(max-width: 768px) 50vw, 25vw"
      className="object-cover transition-transform duration-700 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/95 to-transparent flex flex-col justify-end p-5 z-10">
      <CategoryBadge category={post.categoryName} />
      <h4 className="font-sans text-[16px] font-bold text-[#FFFFFF] leading-snug line-clamp-2">
        {post.title}
      </h4>
    </div>
  </Link>
);

// Standard Card
const StandardCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex flex-col bg-[#FFFFFF] rounded-[16px] overflow-hidden h-full border border-[#1A1A1A]/5 shadow-[0_4px_16px_rgba(26,26,26,0.03)] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(6,80,71,0.08)] hover:border-[#065047]/30"
  >
    <div className="relative h-[200px] overflow-hidden rounded-t-[16px] bg-[#ECF9F9]">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {/* Subtle Inner Shadow overlay */}
      <div className="absolute inset-0 border-[0.5px] border-[#1A1A1A]/5 pointer-events-none rounded-t-[16px]" />
    </div>
    <div className="flex flex-col flex-grow p-5">
      <h4 className="font-sans text-[18px] font-bold text-[#1A1A1A] leading-tight mb-2.5 group-hover:text-[#065047] transition-colors">
        {post.title}
      </h4>
      <p className="text-[#1A1A1A]/70 text-[14px] font-medium line-clamp-2 mb-3">
        {post.excerpt}
      </p>
    </div>
  </Link>
);

// Sidebar List Card
const SidebarListCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex items-center justify-between gap-4 py-4 border-b border-[#1A1A1A]/10 last:border-0"
  >
    <div className="flex-1">
      <h5 className="font-sans text-[15px] font-bold text-[#1A1A1A] leading-tight mb-1.5 group-hover:text-[#065047] transition-colors line-clamp-2">
        {post.title}
      </h5>
      <div className="flex items-center gap-2 text-[#1A1A1A]/50 text-[12px] font-medium">
        <CalendarDays size={14} />
        {post.date}
      </div>
    </div>
    <div className="relative w-[88px] h-[66px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#ECF9F9] border border-[#1A1A1A]/5">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        loading="lazy"
        sizes="88px"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  </Link>
);

// ─── Data Fetching Logic ─────────────────────────────────────────────────────
async function getLayoutData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Fetching from the NEW specific layout endpoint
    const res = await fetch(`${baseUrl}/api/public/blogs/category-blogs`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Server component fetch failed:", error);
    return null;
  }
}

// ─── Main Async Server Component ─────────────────────────────────────────────
export default async function BlogsPageData() {
  const layoutData = await getLayoutData();

  if (!layoutData || layoutData.error) {
    return (
      <div
        className={`min-h-[400px] flex items-center justify-center bg-[#ECF9F9] ${inter.variable}`}
      >
        <div className="bg-[#FFFFFF] border border-[#1A1A1A]/10 p-8 rounded-[16px] text-center max-w-xl shadow-[0_8px_32px_rgba(26,26,26,0.06)]">
          <AlertCircle size={40} className="text-[#1A1A1A]/40 mx-auto mb-4" />
          <h3 className="text-[20px] font-extrabold text-[#1A1A1A] mb-2">
            Unable to load latest articles.
          </h3>
          <p className="text-[#1A1A1A]/70 text-[14px] font-medium">
            Please verify your database connection or API route.
          </p>
        </div>
      </div>
    );
  }

  return (
    // Base Background #FFFFFF alternating with sections inside
    <section
      className={`bg-[#FFFFFF] py-16 text-[#1A1A1A] ${inter.variable} font-sans`}
    >
      <div className="max-w-[1360px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ─── LEFT COLUMN ─── */}
          <div className="col-span-1 lg:col-span-8">
            <div className="mb-14">
              <SectionTitle title="Major Headlines" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                {layoutData.heroFeatured && (
                  <HeroLargeCard post={layoutData.heroFeatured} />
                )}
                <div className="grid grid-cols-2 grid-rows-2 gap-5">
                  {layoutData.heroGrid?.map((post, idx) => (
                    <HeroGridCard key={idx} post={post} />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <SectionTitle title="Knowledge Hub Feed" />
              <div className="flex flex-col gap-12 mt-4">
                {layoutData.feedCategories?.map((cat, idx) => (
                  <div key={idx}>
                    <h3 className="font-sans text-[24px] font-extrabold text-[#065047] mb-5 tracking-tight">
                      {cat.name}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {cat.posts.map((post, pIdx) => (
                        <StandardCard key={pIdx} post={post} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-12">
            {/* Editor's Picks */}
            <div>
              <SectionTitle title="Editor's Picks" />
              <div className="mt-4 flex flex-col">
                {layoutData.editorsPicks?.map((post, idx) => (
                  <SidebarListCard key={idx} post={post} />
                ))}
              </div>
            </div>

            {/* Trending Now */}
            <div>
              <SectionTitle title="Trending Now" />
              <ol className="mt-4 flex flex-col gap-4">
                {layoutData.trending?.map((post, idx) => (
                  <li key={idx} className="flex items-start gap-4 group">
                    <span className="font-sans text-[18px] font-extrabold text-[#065047] leading-none mt-0.5">
                      0{idx + 1}
                    </span>
                    <Link
                      href={`/blogs/${post.slug}`}
                      className="font-sans text-[15px] font-bold text-[#1A1A1A] group-hover:text-[#065047] transition-colors leading-snug line-clamp-2"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>

            {/* Newsletter Widget - Mint Frost Background */}
            <div className="bg-[#ECF9F9] border border-[#1A1A1A]/5 rounded-[16px] p-8 shadow-sm relative overflow-hidden">
              {/* Subtle background ring for premium feel */}
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#065047]/5 pointer-events-none" />

              <h4 className="font-sans text-[20px] font-extrabold text-[#1A1A1A] mb-2 relative z-10">
                Unlock Daily Savings
              </h4>
              <p className="text-[#1A1A1A]/70 text-[14px] font-medium mb-6 relative z-10">
                Get the latest financial insights and verified deals delivered
                right to your inbox.
              </p>
              <div className="flex flex-col gap-3 relative z-10">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border border-[#1A1A1A]/10 rounded-[8px] px-4 py-3 text-[14px] font-medium text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#065047] focus:ring-[3px] focus:ring-[#065047]/10 transition-all bg-[#FFFFFF]"
                />
                {/* Primary Button Style */}
                <button className="w-full bg-[#065047] hover:bg-[#065047]/90 text-[#FFFFFF] font-sans text-[15px] font-bold px-4 py-3 rounded-[8px] transition-all shadow-sm hover:shadow-md">
                  Subscribe Now
                </button>
              </div>
            </div>

            {/* Dynamic Sidebar Category */}
            {layoutData.sidebarCategory && (
              <div>
                <SectionTitle title={layoutData.sidebarCategory.name} />
                <div className="mt-4 flex flex-col">
                  {layoutData.sidebarCategory.posts.map((post, idx) => (
                    <SidebarListCard key={idx} post={post} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Load More Button - Secondary Button Style */}
        <div className="mt-16 text-center border-t border-[#1A1A1A]/10 pt-12">
          <button className="bg-[#FFFFFF] hover:bg-[#ECF9F9] border-[1.5px] border-[#065047] text-[#065047] font-sans font-bold text-[16px] w-full max-w-[600px] py-4 rounded-[8px] transition-colors shadow-sm">
            Load More Articles
          </button>
        </div>
      </div>
    </section>
  );
}
