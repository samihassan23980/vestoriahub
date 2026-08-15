import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  CalendarDays,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// ─── Reusable UI Components ──────────────────────────────────────────────

const FeaturedCard = ({ post, categoryName }) => {
  const publishDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col bg-white rounded-[12px] border border-neutral-iris shadow-card-base hover:shadow-card-hover hover:border-brand-violet transition-all duration-200 overflow-hidden h-full hover:-translate-y-1"
    >
      <div className="relative aspect-[16/9] flex-shrink-0 bg-neutral-lavender overflow-hidden rounded-t-[12px]">
        <img
          src={post.featuredImage?.url || "/fallback-blog.jpg"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Subtle text legibility gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-midnight/70 via-transparent to-transparent opacity-90" />

        {/* Featured Badge */}
        <div className="absolute top-4 left-4 bg-brand-gold text-brand-midnight text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-[6px] shadow-sm">
          Featured
        </div>

        {/* Read Time */}
        <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-white/90 text-xs font-medium bg-brand-midnight/60 backdrop-blur-sm px-2.5 py-1 rounded-[6px]">
          <Clock size={13} />
          {post.readTimeMinutes || 3} min read
        </div>
      </div>

      <div className="flex flex-col flex-grow p-6 md:p-8">
        <span className="inline-block bg-neutral-lilac text-brand-royal text-[11px] font-bold tracking-[0.06em] uppercase px-2.5 py-1 rounded-[6px] mb-4 w-fit">
          {categoryName}
        </span>
        <h4 className="text-[24px] md:text-[28px] font-bold text-brand-midnight leading-[1.2] mb-3">
          {post.title}
        </h4>
        <p className="text-neutral-slate text-[15px] leading-[1.7] flex-grow mb-6 line-clamp-2">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-5 border-t border-neutral-iris">
          <div className="flex items-center gap-1.5 text-neutral-slate text-xs">
            <CalendarDays size={14} />
            {publishDate}
          </div>
          <div className="flex items-center gap-1 text-brand-royal text-[14px] font-semibold group-hover:text-brand-violet transition-colors">
            Read Article
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

const CompactCard = ({ post }) => {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-row bg-white rounded-[12px] border border-neutral-iris shadow-sm hover:shadow-card-hover hover:border-brand-violet transition-all duration-200 overflow-hidden h-[130px] hover:-translate-y-1"
    >
      <div className="w-[130px] min-w-[130px] relative bg-neutral-lavender overflow-hidden">
        <img
          src={post.featuredImage?.url || "/fallback-blog.jpg"}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col justify-between flex-grow p-4 min-w-0">
        <div>
          <h4 className="text-[15px] font-bold text-brand-midnight leading-[1.3] mb-1.5 line-clamp-2 group-hover:text-brand-royal transition-colors">
            {post.title}
          </h4>
          <p className="text-neutral-slate text-[13px] leading-[1.6] line-clamp-2">
            {post.excerpt}
          </p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-neutral-slate text-[11px]">
            <Clock size={12} />
            {post.readTimeMinutes || 3} min
          </div>
          <div className="flex items-center gap-1 text-brand-royal text-[12px] font-bold">
            Read{" "}
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>
    </Link>
  );
};

// ─── Data Fetching (ISR Hybrid Approach) ──────────────────────────────────

async function getCategoryBlogs() {
  try {
    // Fallback to localhost if env var is missing during dev.
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/public/home-blogs?catLimit=3&blogLimit=4`,
      {
        next: { revalidate: 60 }, // ISR: Revalidates every 60 seconds
      },
    );

    if (!res.ok) throw new Error("Failed to fetch home blogs");
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Home Blogs Fetch Error:", error);
    return [];
  }
}

// ─── Main Server Component ───────────────────────────────────────────────

export default async function HomeBlogs() {
  const groupedCategories = await getCategoryBlogs();

  // Error State Handling - Graceful UI fallback without crashing the page
  if (!groupedCategories || groupedCategories.length === 0) {
    return (
      <section className="py-20 px-6 bg-neutral-lavender flex justify-center">
        <div className="bg-white border-2 border-semantic-alert/20 p-8 rounded-[16px] text-center max-w-lg shadow-card-base">
          <AlertCircle
            size={48}
            className="text-semantic-alert mx-auto mb-4 opacity-80"
          />
          <h3 className="text-[20px] font-bold text-brand-midnight mb-2">
            Content Unavailable
          </h3>
          <p className="text-neutral-slate text-[14px]">
            We couldn't load the latest insights right now. Please check back
            later.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative bg-neutral-lavender py-20 md:py-28 font-sans">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 relative">
        {/* Section Global Header */}
        <div className="text-center max-w-[680px] mx-auto mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 mb-4 bg-brand-midnight text-brand-gold px-4 py-1.5 rounded-[50px] shadow-sm">
            <TrendingUp size={16} />
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase">
              Latest Insights
            </span>
          </div>
          <h2 className="text-[36px] md:text-[48px] font-bold text-brand-midnight leading-[1.2] mb-4">
            Expert Savings & Guides
          </h2>
          <p className="text-[16px] text-neutral-slate leading-[1.7]">
            Master the art of smart shopping. From stacking coupons to finding
            flash deals, our expert guides teach you how to maximize your
            savings.
          </p>
        </div>

        {/* Dynamic Category Loops */}
        <div className="flex flex-col gap-20 md:gap-28">
          {groupedCategories.map((category, idx) => {
            const featuredPost = category.blogs[0];
            const sidePosts = category.blogs.slice(1, 4); // Take up to 3 posts for the right side

            if (!featuredPost) return null; // Failsafe

            return (
              <div key={category._id} className="relative">
                {/* Category Row Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="flex items-start gap-4 md:gap-6">
                    <span className="text-[56px] md:text-[72px] font-bold leading-none text-brand-royal/10 tracking-tighter select-none flex-shrink-0 mt-[-8px]">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[28px] md:text-[32px] font-bold text-brand-midnight leading-[1.2] mb-2">
                        {category.name}
                      </h3>
                      <p className="text-[14px] md:text-[15px] text-neutral-slate leading-[1.6] max-w-xl">
                        {category.shortDescription ||
                          `Discover top verified tips and exclusive deals in ${category.name}.`}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/blog/category/${category.slug}`}
                    className="inline-flex items-center justify-center gap-2 text-[14px] font-bold text-brand-royal px-6 py-2.5 border-[1.5px] border-neutral-iris rounded-[50px] bg-white hover:border-brand-violet hover:bg-neutral-lilac hover:text-brand-midnight transition-all w-full md:w-auto shadow-sm"
                  >
                    View all {category.name} <ArrowRight size={16} />
                  </Link>
                </div>

                {/* Grid Layout Layout - 12 Column */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                  {/* Left: Large Featured Post (Takes 7/12 columns on large screens) */}
                  <div className="lg:col-span-7">
                    <FeaturedCard
                      post={featuredPost}
                      categoryName={category.name}
                    />
                  </div>

                  {/* Right: Stacked Smaller Posts (Takes 5/12 columns on large screens) */}
                  <div className="lg:col-span-5 flex flex-col gap-5">
                    {sidePosts.map((post) => (
                      <CompactCard key={post._id} post={post} />
                    ))}

                    {/* View All CTA Block if there are enough posts */}
                    {sidePosts.length > 0 && (
                      <Link
                        href={`/blog/category/${category.slug}`}
                        className="flex-grow flex items-center justify-between p-6 bg-gradient-to-br from-brand-midnight to-brand-royal rounded-[12px] shadow-card-base hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group min-h-[80px] mt-1"
                      >
                        <div className="flex flex-col">
                          <span className="text-white/60 text-[11px] font-bold uppercase tracking-[0.06em] mb-1">
                            More in {category.name}
                          </span>
                          <span className="text-brand-gold font-bold text-[15px]">
                            Explore {category.blogs.length}+ articles
                          </span>
                        </div>
                        <div className="bg-white/10 p-3 rounded-[50px] text-white group-hover:bg-brand-coral group-hover:text-white transition-colors">
                          <ArrowRight
                            size={18}
                            className="group-hover:translate-x-1 transition-transform"
                          />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Section Divider between categories (Hidden on last category) */}
                {idx < groupedCategories.length - 1 && (
                  <div className="flex items-center justify-center gap-4 mt-20 md:mt-24 opacity-50">
                    <div className="w-[60px] h-[1.5px] bg-neutral-iris" />
                    <div className="w-[6px] h-[6px] rounded-full bg-brand-gold" />
                    <div className="w-[60px] h-[1.5px] bg-neutral-iris" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
