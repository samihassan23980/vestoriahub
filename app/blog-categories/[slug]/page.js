import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Layers,
  Star,
  Compass,
  FolderOpen,
} from "lucide-react";
import CategoryInfiniteFeed from "@/app/Components/CategoryInfiniteFeed";

// ─── SEO METADATA GENERATION ──────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categoryData = await getCategoryData(slug);

  if (!categoryData || !categoryData.category) {
    return {
      title: "Category Not Found | VestoriaHub.com",
      robots: { index: false, follow: true },
    };
  }

  const category = categoryData.category;

  return {
    title: `${category.seo?.metaTitle || category.name} Guides & Deals | VestoriaHub`,
    description:
      category.seo?.metaDescription ||
      `Discover strictly verified coupons, curated marketplace discounts & expert shopping guides for ${category.name}.`,
    alternates: {
      canonical: `/blog-categories/${slug}`,
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
          tags: ["blogs", "categories", `category-${slug}`],
        },
      }
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

  // ── ERROR / NOT FOUND STATE ──
  if (!data || !data.category) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#F8F0E5] px-4 text-center font-sans">
        <div className="w-16 h-16 rounded-full bg-[#FFFFFF] flex items-center justify-center mb-4 border border-[#E2D9CC] shadow-xs">
          <AlertCircle size={32} className="text-[#C1432F]" />
        </div>
        <h1 className="text-[26px] md:text-[32px] font-heading font-extrabold text-[#10201B] mb-2 tracking-tight">
          Category Not Found
        </h1>
        <p className="max-w-md text-[#6B7280] font-medium text-[14.5px] mb-6">
          The editorial category you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/categories"
          className="bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] font-heading font-bold text-[13.5px] px-7 py-3 rounded-full transition-all shadow-xs"
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

  const featuredIds = new Set(featuredBlogs.map((b) => String(b._id)));
  const uniqueFeed = rawFeed.filter((b) => !featuredIds.has(String(b._id)));
  const hasContent = featuredBlogs.length > 0 || uniqueFeed.length > 0;

  return (
    <main className="min-h-screen bg-[#F8F0E5] font-sans pb-20 text-[#16241F]">
      
      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-3">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[11.5px] font-mono text-[#8A8F8C]">
          <Link href="/" className="hover:text-[#1C352D] transition-colors">Home</Link>
          <ChevronRight size={12} className="text-[#BDD6C4]" />
          <Link href="/blogs" className="hover:text-[#1C352D] transition-colors">Editorial</Link>
          <ChevronRight size={12} className="text-[#BDD6C4]" />
          <span className="text-[#1C352D] font-bold truncate">{category.name}</span>
        </div>
      </nav>

      {/* ── MINIMAL FOCUSED HERO SECTION ── */}
      <section className="w-full bg-[#FFFFFF] border-b border-[#E2D9CC] py-10 sm:py-12">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            {/* Title & Description */}
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] text-[10.5px] font-heading font-extrabold uppercase tracking-widest text-[#1C352D] mb-3">
                <FolderOpen size={12} className="text-[#D9A441]" />
                <span>Editorial Category</span>
              </div>

              <h1 className="text-[32px] sm:text-[42px] lg:text-[46px] font-heading font-extrabold text-[#10201B] tracking-tight leading-[1.1] mb-3">
                {category.uiConfig?.heroHeadline || category.name}
              </h1>

              {(category.uiConfig?.heroSubtitle || category.shortDescription) && (
                <p className="text-[#6B7280] text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
                  {category.uiConfig?.heroSubtitle || category.shortDescription}
                </p>
              )}
            </div>

            {/* Compact Metric Badges */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {pagination.totalItems != null && (
                <div className="flex items-center gap-1.5 bg-[#F8F0E5] border border-[#E2D9CC] px-3.5 py-1.5 rounded-xl text-[#1C352D] text-[12px] font-mono font-semibold shadow-2xs">
                  <BookOpen size={14} className="text-[#D9A441]" />
                  <span><strong>{pagination.totalItems}</strong> Articles</span>
                </div>
              )}

              {hierarchy?.childCategories?.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F8F0E5] border border-[#E2D9CC] px-3.5 py-1.5 rounded-xl text-[#1C352D] text-[12px] font-mono font-semibold shadow-2xs">
                  <Layers size={14} className="text-[#D9A441]" />
                  <span><strong>{hierarchy.childCategories.length}</strong> Topics</span>
                </div>
              )}

              {rating?.count > 0 && (
                <div className="flex items-center gap-1.5 bg-[#F8F0E5] border border-[#E2D9CC] px-3.5 py-1.5 rounded-xl text-[#1C352D] text-[12px] font-mono font-semibold shadow-2xs">
                  <Star size={14} className="text-[#D9A441] fill-[#D9A441]" />
                  <span><strong>{rating.average?.toFixed(1)}</strong> Rating</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── SUBCATEGORY PILLS (OPTIONAL TOPICS BAR) ── */}
      {hierarchy?.childCategories?.length > 0 && (
        <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 mb-2.5 text-[11px] font-mono font-bold uppercase text-[#8A8F8C] tracking-wider">
            <Compass size={13} className="text-[#D9A441]" />
            <span>Explore Sub-Topics</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hierarchy.childCategories.map((child) => (
              <Link
                key={child._id}
                href={`/categories/${child.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-[#E2D9CC] bg-[#FFFFFF] px-4 py-1.5 text-[12px] font-heading font-semibold text-[#1C352D] hover:border-[#1C352D] hover:bg-[#EBF3EE] transition-all shadow-2xs"
              >
                <Layers size={12} className="text-[#D9A441]" />
                <span>{child.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── MAIN CONTENT INFINITE FEED ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col pt-8">
        {!hasContent ? (
          <div className="rounded-2xl border border-[#E2D9CC] bg-[#FFFFFF] px-6 py-16 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F0E5] border border-[#E2D9CC] flex items-center justify-center mx-auto mb-3 text-[#1C352D]">
              <BookOpen size={22} />
            </div>
            <h3 className="text-[18px] font-heading font-bold text-[#10201B] mb-1">
              No Content Yet
            </h3>
            <p className="text-[#6B7280] text-[13.5px] font-normal max-w-sm mx-auto leading-relaxed">
              Our editorial team is crafting verified buying guides for this category. Check back shortly.
            </p>
          </div>
        ) : (
          <div>
            <CategoryInfiniteFeed
              slug={slug}
              initialBlogs={[...featuredBlogs, ...uniqueFeed]}
              initialHasMore={pagination.hasNextPage}
              featuredIds={[...featuredIds]}
            />
          </div>
        )}
      </div>

      {/* ── SEO DESCRIPTIVE FOOTER BLOCK ── */}
      {category.description && (
        <section className="mt-16 border-t border-[#E2D9CC] bg-[#FFFFFF]">
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="block w-1.5 h-6 rounded-full bg-[#D9A441]" />
              <h2 className="text-[20px] md:text-[22px] font-heading font-bold text-[#10201B]">
                About {category.name} Guides
              </h2>
            </div>
            <div className="space-y-3.5 text-[14px] leading-relaxed text-[#6B7280] font-normal prose max-w-none">
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