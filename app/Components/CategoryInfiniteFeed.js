"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  Loader2,
  Sparkles,
  BookOpen,
  Clock,
  CalendarDays,
  ArrowUpRight,
  Tag,
  CheckCircle2,
} from "lucide-react";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function formatDate(dateString) {
  if (!dateString) return "OCT 2026";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? "OCT 2026"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

// ─── VESTORIAHUB BRANDED EDITORIAL BLOG CARD ──────────────────────────────────
const BlogCard = ({ blog, layout = "grid", priority = false }) => {
  const title = blog?.title || "Curated Shopping Guide & Verified Savings";
  const excerpt =
    blog?.excerpt ||
    blog?.summary ||
    blog?.shortDescription ||
    "Discover verified checkout promo codes and expert merchant shopping strategies.";
  const slug = blog?.slug || "#";
  const categoryName =
    blog?.category?.name || blog?.categoryName || "SHOPPING GUIDE";
  const authorName =
    blog?.author?.name || blog?.authorName || "VestoriaHub Editorial";
  const readTime = blog?.readTimeMinutes || blog?.readTime || "4";
  const dateVal = blog?.publishedAt || blog?.createdAt || blog?.date;
  const imageUrl =
    blog?.featuredImage?.url || blog?.image || "/fallback-blog.jpg";

  const isFeatured = layout === "featured";
  const isCompact = layout === "compact";

  return (
    <article className="group relative flex flex-col justify-between w-full h-full rounded-[24px] bg-[#FFFFFF] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] p-5 shadow-xs hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div
        className={`flex w-full gap-5 ${
          isFeatured
            ? "flex-col lg:flex-row items-center"
            : isCompact
            ? "flex-col sm:flex-row items-center"
            : "flex-col"
        }`}
      >
        {/* Thumbnail Image Wrapper */}
        <Link
          href={`/blogs/${slug}`}
          className={`relative block overflow-hidden rounded-[18px] bg-[#F1E7D8] border border-[#E2D9CC] shrink-0 ${
            isFeatured
              ? "w-full lg:w-1/2 aspect-[16/10]"
              : isCompact
              ? "w-full sm:w-[42%] aspect-[16/10]"
              : "w-full aspect-[16/10]"
          }`}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={blog?.featuredImage?.alt || title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#8A8F8C]">
              <BookOpen size={36} />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#10201B]/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Floating Category Tag */}
          <span className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#10201B]/90 backdrop-blur-md px-3 py-1 text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#D9A441] border border-[#25473C] shadow-sm">
            <Tag size={10} />
            {categoryName}
          </span>

          {/* Floating Action Button */}
          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#D9A441] text-[#16241F] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 shadow-md">
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </div>
        </Link>

        {/* Content Details Area */}
        <div className="flex flex-1 flex-col justify-between w-full">
          <div>
            {/* Metadata Bar */}
            <div className="mb-2.5 flex items-center gap-3 text-[11px] font-mono font-semibold text-[#8A8F8C] flex-wrap">
              <span className="flex items-center gap-1 text-[#427867]">
                <CalendarDays size={13} className="text-[#D9A441]" />
                {formatDate(dateVal)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {readTime} min read
              </span>
            </div>

            {/* Title */}
            <Link href={`/blogs/${slug}`}>
              <h3
                className={`font-heading font-bold text-[#10201B] transition-colors group-hover:text-[#D9A441] leading-[1.25] mb-2.5 tracking-tight line-clamp-2 ${
                  isFeatured
                    ? "text-[22px] sm:text-[26px]"
                    : "text-[17px] sm:text-[18px]"
                }`}
              >
                {title}
              </h3>
            </Link>

            {/* Excerpt */}
            <p className="mb-4 text-[13px] leading-relaxed text-[#6B7280] line-clamp-2 sm:line-clamp-3 font-normal">
              {excerpt}
            </p>
          </div>

          {/* Footer Author & Action */}
          <div className="flex items-center justify-between border-t border-[#E2D9CC] pt-3 mt-auto">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EBF3EE] border border-[#BDD6C4] text-[#1C352D] text-[11px] font-heading font-black">
                {authorName[0]?.toUpperCase() || "V"}
              </div>
              <span className="text-[12px] font-heading font-bold text-[#1C352D] truncate max-w-[180px]">
                {authorName}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-full border border-[#BDD6C4] bg-[#EBF3EE] px-3 py-1 text-[11px] font-heading font-extrabold uppercase text-[#1C352D] group-hover:bg-[#1C352D] group-hover:text-[#FDFBF7] group-hover:border-[#1C352D] transition-all">
              <span>Read</span>
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── DYNAMIC LAYOUT PATTERNS ──────────────────────────────────────────────────

// Layout 0: Classic Grid (4 Items)
const EditorialGrid = ({ items }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {items.map((blog) => (
      <div key={blog._id || blog.slug} className="h-full">
        <BlogCard blog={blog} layout="grid" />
      </div>
    ))}
  </div>
);

// Layout 1: The Triad (1 Featured + 2 Stacked Compact)
const EditorialTriad = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    <div className="lg:col-span-7 xl:col-span-8 h-full">
      {items[0] && <BlogCard blog={items[0]} layout="featured" />}
    </div>
    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 justify-between">
      {items.slice(1, 3).map((blog) => (
        <div key={blog._id || blog.slug} className="flex-1">
          <BlogCard blog={blog} layout="compact" />
        </div>
      ))}
    </div>
  </div>
);

// Layout 2: The Showcase (1 Full Featured Hero + 4 Grid)
const EditorialShowcase = ({ items }) => (
  <div className="flex flex-col gap-6 mb-8">
    <div className="w-full">
      {items[0] && <BlogCard blog={items[0]} layout="featured" priority />}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.slice(1, 5).map((blog) => (
        <div key={blog._id || blog.slug} className="h-full">
          <BlogCard blog={blog} layout="grid" />
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN INFINITE FEED COMPONENT ─────────────────────────────────────────────
export default function CategoryInfiniteFeed({
  slug,
  initialBlogs,
  initialHasMore,
  featuredIds = [],
}) {
  const [blogs, setBlogs] = useState(initialBlogs || []);
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/public/blog-categories/${slug}?page=${page}&limit=12`
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error);

      const fetchedBlogs = result.data.blogs.items || [];
      const existingIds = new Set(blogs.map((b) => b._id));
      const uniqueNew = fetchedBlogs.filter(
        (b) => !featuredIds.includes(b._id) && !existingIds.has(b._id)
      );

      setBlogs((prev) => [...prev, ...uniqueNew]);
      setHasMore(result.data.blogs.pagination.hasNextPage);
      setPage((prev) => prev + 1);
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: "Connection Error",
        text: "Could not load more articles.",
        showConfirmButton: false,
        timer: 3000,
        background: "#FFFFFF",
        color: "#16241F",
        iconColor: "#C1432F",
        customClass: {
          popup: "rounded-xl border border-[#E2D9CC]",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [slug, page, hasMore, isLoading, featuredIds, blogs]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) loadMore();
      },
      { threshold: 0.1, rootMargin: "600px" }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Dynamic Chunking Pattern: Grid(4) -> Triad(3) -> Showcase(5)
  const chunkedLayouts = useMemo(() => {
    const pattern = [4, 3, 5];
    const chunks = [];
    let index = 0;
    let patternIdx = 0;
    while (index < blogs.length) {
      const size = pattern[patternIdx % pattern.length];
      const chunkItems = blogs.slice(index, index + size);
      if (chunkItems.length > 0)
        chunks.push({
          type: patternIdx % pattern.length,
          items: chunkItems,
          id: `chunk-${index}`,
        });
      index += size;
      patternIdx++;
    }
    return chunks;
  }, [blogs]);

  if (blogs.length === 0) return null;

  return (
    <section className="font-sans w-full">
      {/* Feed Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-[#E2D9CC] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[#1C352D] font-heading font-extrabold text-[11px] uppercase tracking-widest mb-1">
            <Sparkles size={13} className="text-[#D9A441]" />
            <span>The Editorial Feed</span>
          </div>
          <h2 className="text-[24px] sm:text-[28px] font-heading font-extrabold text-[#10201B] tracking-tight leading-none">
            Curated Insights & Guides
          </h2>
        </div>
      </div>

      {/* Render Chunked Layouts */}
      <div className="flex flex-col">
        {chunkedLayouts.map((chunk) => {
          const expectedSize = [4, 3, 5][chunk.type];

          if (chunk.items.length !== expectedSize || chunk.type === 0)
            return <EditorialGrid key={chunk.id} items={chunk.items} />;
          if (chunk.type === 1)
            return <EditorialTriad key={chunk.id} items={chunk.items} />;
          if (chunk.type === 2)
            return <EditorialShowcase key={chunk.id} items={chunk.items} />;

          return null;
        })}
      </div>

      {/* Infinite Scroll Trigger & State */}
      <div
        ref={observerTarget}
        className="flex flex-col items-center justify-center py-10 w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-2.5 bg-[#1C352D] text-[#FDFBF7] px-7 py-3 rounded-full shadow-sm border border-[#25473C]">
            <Loader2 className="animate-spin text-[#D9A441]" size={16} />
            <span className="text-[12px] font-heading font-bold tracking-wider uppercase">
              Curating Articles...
            </span>
          </div>
        ) : hasMore ? (
          <div className="h-16" />
        ) : (
          <div className="text-center mt-2">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center mx-auto mb-2.5 text-[#1C352D]">
              <CheckCircle2 size={22} className="text-[#34D399]" />
            </div>
            <h4 className="text-[#10201B] font-heading font-bold text-[16px] mb-0.5">
              You&apos;re All Caught Up
            </h4>
            <p className="text-[#6B7280] font-normal text-[13px]">
              Check back daily for fresh merchant deals and buying guides.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}