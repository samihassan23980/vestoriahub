import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Layers,
  Star,
  Compass,
} from "lucide-react";
import CategoryInfiniteFeed from "@/app/Components/CategoryInfiniteFeed";

// ─── SEO METADATA GENERATION ──────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categoryData = await getCategoryData(slug);

  // Fallback metadata if the category doesn't exist
  if (!categoryData || !categoryData.category) {
    return {
      title: "Category Not Found | VestoriaHub",
      robots: { index: false, follow: true },
    };
  }

  const category = categoryData.category;


  return {
    title: `${category.seo.metaTitle} Guides & Deals`,
    description: category.seo.metaDescription || `Discover strictly verified coupons, curated marketplace discounts & expert shopping guides for ${category.name}.`,
    // 💡 Added canonical alternates tag matching the dynamic blog category path
    alternates: {
      canonical: `/blog-categories/${slug}`, // Adjust this path match if your folder structure dictates otherwise (e.g., `/categories/${slug}`)
    },
  };
}

// ─── DATA FETCHING ────────────────────────────────────────────────────────────
async function getCategoryData(slug) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/blog-categories/${slug}?page=1&limit=12`,
    { 
        next: { 
          revalidate: 3600,
          tags: ["blogs", "categories", `category-${slug}`] // 🔥 Tag base cache added here
        } 
      },
    );
    if (!res.ok) return null;
    const result = await res.json();
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default async function BlogCategoryDetailsPage({ params }) {
  const { slug } = await params;
  const data = await getCategoryData(slug);

  if (!data || !data.category) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-navy-800 px-6 text-center font-sans">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-5">
          <AlertCircle size={36} className="text-red-500" />
        </div>
        <h1 className="text-[36px] font-extrabold text-white mb-3 tracking-tight">
          Category Not Found
        </h1>
        <p className="max-w-md text-lavender-400 font-medium text-[15px] leading-relaxed mb-8">
          The category you are looking for does not exist or an error occurred.
        </p>
        <Link
          href="/categories"
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold text-[14px] px-8 py-4 rounded-full transition-colors shadow-[0_8px_20px_rgba(124,92,252,0.25)]"
        >
          Browse All Categories
        </Link>
      </div>
    );
  }

  const { category, hierarchy, featuredBlogs = [] } = data;
  const rawFeed = data.blogs?.items || [];
  const pagination = data.blogs?.pagination || { hasNextPage: false };
  const rating = category.aggregateRating;

  // Separation Logic
  const featuredIds = new Set(featuredBlogs.map((b) => String(b._id)));
  const uniqueFeed = rawFeed.filter((b) => !featuredIds.has(String(b._id)));
  const hasContent = featuredBlogs.length > 0 || uniqueFeed.length > 0;

  return (
    <main className="min-h-screen bg-navy-800 font-sans pb-24 selection:bg-purple-500/30 selection:text-white">
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-navy-900 border-b border-[var(--indigo-line)]">
        {category.uiConfig?.heroBanner?.url && (
          <Image
            src={category.uiConfig.heroBanner.url}
            alt={category.name}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-10"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-800/50 to-navy-900" />

        <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 text-center">
          {/* Breadcrumb */}
          <nav className="flex items-center justify-center gap-2 text-[11px] font-bold tracking-[0.1em] text-lavender-500 mb-8 uppercase">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>{" "}
            <ChevronRight size={12} />
            <Link
              href="/blogs"
              className="hover:text-purple-400 transition-colors"
            >
              Editorial
            </Link>{" "}
            <ChevronRight size={12} />
            <span className="text-white">{category.name}</span>
          </nav>

          <h1 className="text-[44px] md:text-[64px] lg:text-[72px] font-extrabold text-white leading-[1.05] mb-6 max-w-4xl mx-auto tracking-tight">
            {category.uiConfig?.heroHeadline || category.name}
          </h1>

          {(category.uiConfig?.heroSubtitle || category.shortDescription) && (
            <p className="text-lavender-300 text-[16px] md:text-[18px] leading-relaxed max-w-2xl mx-auto mb-10">
              {category.uiConfig?.heroSubtitle || category.shortDescription}
            </p>
          )}

          {/* Stats Strip */}
          <div className="inline-flex items-center gap-6 bg-navy-700/50 border border-[var(--indigo-line)] rounded-full px-6 py-3 backdrop-blur-sm">
            {pagination.totalItems != null && (
              <div className="flex items-center gap-2 text-lavender-400 text-[12px]">
                <BookOpen size={14} className="text-purple-400" />{" "}
                <strong className="text-white">{pagination.totalItems}</strong>{" "}
                Articles
              </div>
            )}
            {hierarchy?.childCategories?.length > 0 && (
              <>
                <span className="w-px h-4 bg-[var(--indigo-line)]" />
                <div className="flex items-center gap-2 text-lavender-400 text-[12px]">
                  <Layers size={14} className="text-purple-400" />{" "}
                  <strong className="text-white">
                    {hierarchy.childCategories.length}
                  </strong>{" "}
                  Sub-topics
                </div>
              </>
            )}
            {rating?.count > 0 && (
              <>
                <span className="w-px h-4 bg-[var(--indigo-line)]" />
                <div className="flex items-center gap-2 text-lavender-400 text-[12px]">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />{" "}
                  <strong className="text-white">
                    {rating.average?.toFixed(1)}
                  </strong>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── SUBCATEGORY PILLS ── */}
      {hierarchy?.childCategories?.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex flex-wrap justify-center gap-3">
            {hierarchy.childCategories.map((child) => (
              <Link
                key={child._id}
                href={`/categories/${child.slug}`}
                className="flex items-center gap-2 rounded-full border border-[var(--indigo-line)] bg-navy-700 px-5 py-2.5 text-[13px] font-bold text-lavender-300 hover:border-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-300 shadow-sm"
              >
                <Layers size={14} /> {child.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col">
        {!hasContent ? (
          <div className="rounded-[24px] border border-[var(--indigo-line)] bg-navy-600 px-8 py-24 text-center mt-12 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-navy-700 border border-[var(--indigo-line)] flex items-center justify-center mx-auto mb-5">
              <BookOpen size={28} className="text-lavender-400" />
            </div>
            <h3 className="text-[28px] font-extrabold text-white mb-2 tracking-tight">
              No Content Yet
            </h3>
            <p className="text-lavender-400 text-[15px] leading-relaxed max-w-sm mx-auto">
              Our editorial team is crafting amazing articles for this category.
              Check back soon!
            </p>
          </div>
        ) : (
          <CategoryInfiniteFeed
            slug={slug}
            initialBlogs={[...featuredBlogs, ...uniqueFeed]}
            initialHasMore={pagination.hasNextPage}
            featuredIds={[...featuredIds]}
          />
        )}
      </div>

      {/* ── SEO DESCRIPTION ── */}
      {category.description && (
        <section className="mt-24 border-t border-[var(--indigo-line)] bg-navy-900">
          <div className="max-w-[860px] mx-auto px-6 py-20">
            <div className="flex items-center gap-3 mb-8">
              <span className="block w-1.5 h-8 rounded-full bg-purple-500" />
              <h2 className="text-[32px] font-extrabold text-white tracking-tight">
                About {category.name}
              </h2>
            </div>
            <div className="space-y-6 text-[16px] leading-[1.85] text-lavender-400 font-medium">
              {category.description
                .split("\n")
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
