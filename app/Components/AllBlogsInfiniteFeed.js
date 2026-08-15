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
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  BookOpen,
  Sparkles,
  Loader2,
  Tag,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";

// ─── Dedupe by slug or ID ────────────────────────────────────────────────────
function getUniquePosts(posts) {
  const seen = new Set();
  const result = [];
  for (const post of posts) {
    if (!post) continue;
    const key = post._id || post.slug || post.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(post);
  }
  return result;
}

// ─── Date Formatter Utility ──────────────────────────────────────────────────
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

// ─── UNIVERSAL VESTORIAHUB FEED CARD ─────────────────────────────────────────
const FeedBlogCard = ({ blog, layout = "grid", priority = false }) => {
  if (!blog) return null;

  const title = blog.title || "Curated Shopping Guide & Verified Savings";
  const excerpt =
    blog.excerpt ||
    blog.summary ||
    blog.shortDescription ||
    "Discover verified checkout promo codes and expert merchant shopping strategies.";
  const slug = blog.slug || "#";
  const catName =
    blog.category?.name || blog.categoryName || "SHOPPING GUIDE";
  const authorName =
    blog.author?.name || blog.authorName || "VestoriaHub Editorial";
  const readTime = blog.readTimeMinutes || blog.readTime || "4";
  const dateVal = blog.publishedAt || blog.createdAt || blog.date;
  const imageUrl = blog.featuredImage?.url || blog.image || "";

  const isFeatured = layout === "featured";
  const isCompact = layout === "compact";
  const isOverlay = layout === "overlay"; // Dark Ambient Card Variant

  return (
    <article
      className={`group relative flex flex-col justify-between w-full h-full rounded-[24px] transition-all duration-300 hover:-translate-y-1 overflow-hidden p-5 border-2 ${
        isOverlay
          ? "bg-[#10201B] border-[#25473C] text-[#FDFBF7] shadow-sm hover:border-[#D9A441]/60 hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)]"
          : "bg-[#FFFFFF] border-[#E2D9CC] text-[#16241F] shadow-xs hover:border-[#BDD6C4] hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)]"
      }`}
    >
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
          className={`relative block overflow-hidden rounded-[18px] shrink-0 ${
            isOverlay
              ? "bg-[#162B24] border border-[#25473C]"
              : "bg-[#F1E7D8] border border-[#E2D9CC]"
          } ${
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
              alt={blog.featuredImage?.alt || title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div
              className={`flex h-full items-center justify-center ${
                isOverlay ? "text-[#A8C3B0]" : "text-[#8A8F8C]"
              }`}
            >
              <BookOpen size={36} />
            </div>
          )}

          <div
            className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
              isOverlay
                ? "from-[#0B1612]/70 opacity-80"
                : "from-[#10201B]/40 opacity-60 group-hover:opacity-80"
            } transition-opacity`}
          />

          {/* Floating Category Tag */}
          <span
            className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-heading font-extrabold uppercase tracking-wider border shadow-sm ${
              isOverlay
                ? "bg-[#162B24]/95 text-[#D9A441] border-[#25473C]"
                : "bg-[#10201B]/90 backdrop-blur-md text-[#D9A441] border-[#25473C]"
            }`}
          >
            <Tag size={10} />
            {catName}
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
            <div
              className={`mb-2.5 flex items-center gap-3 text-[11px] font-mono font-semibold flex-wrap ${
                isOverlay ? "text-[#A8C3B0]" : "text-[#8A8F8C]"
              }`}
            >
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
                className={`font-heading font-bold transition-colors group-hover:text-[#D9A441] leading-[1.25] mb-2.5 tracking-tight line-clamp-2 ${
                  isOverlay ? "text-[#FDFBF7]" : "text-[#10201B]"
                } ${
                  isFeatured
                    ? "text-[22px] sm:text-[26px]"
                    : "text-[17px] sm:text-[18px]"
                }`}
              >
                {title}
              </h3>
            </Link>

            {/* Excerpt */}
            {layout !== "compact" && (
              <p
                className={`mb-4 text-[13px] leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal ${
                  isOverlay ? "text-[#D5E4D9]" : "text-[#6B7280]"
                }`}
              >
                {excerpt}
              </p>
            )}
          </div>

          {/* Footer Author & Action */}
          <div
            className={`flex items-center justify-between pt-3 mt-auto border-t ${
              isOverlay ? "border-[#25473C]" : "border-[#E2D9CC]"
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-heading font-black border ${
                  isOverlay
                    ? "bg-[#162B24] border-[#25473C] text-[#D9A441]"
                    : "bg-[#EBF3EE] border-[#BDD6C4] text-[#1C352D]"
                }`}
              >
                {authorName[0]?.toUpperCase() || "V"}
              </div>
              <span
                className={`text-[12px] font-heading font-bold truncate max-w-[180px] ${
                  isOverlay ? "text-[#FDFBF7]" : "text-[#1C352D]"
                }`}
              >
                {authorName}
              </span>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-heading font-extrabold uppercase border transition-all ${
                isOverlay
                  ? "border-[#25473C] bg-[#162B24] text-[#FDFBF7] group-hover:bg-[#D9A441] group-hover:text-[#16241F] group-hover:border-[#D9A441]"
                  : "border-[#BDD6C4] bg-[#EBF3EE] text-[#1C352D] group-hover:bg-[#1C352D] group-hover:text-[#FDFBF7] group-hover:border-[#1C352D]"
              }`}
            >
              <span>Read</span>
              <ArrowUpRight size={12} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── LAYOUT ENGINE COMPONENTS ────────────────────────────────────────────────

const LayoutGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {items.map((b, idx) => (
      <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="grid" />
    ))}
  </div>
);

const LayoutTriad = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    {items[0] && (
      <div className="lg:col-span-8 h-full">
        <FeedBlogCard blog={items[0]} layout="featured" />
      </div>
    )}
    {items.length > 1 && (
      <div className="lg:col-span-4 flex flex-col gap-6 justify-between">
        {items.slice(1, 3).map((b, idx) => (
          <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="compact" />
        ))}
      </div>
    )}
  </div>
);

const LayoutShowcase = ({ items }) => (
  <div className="flex flex-col gap-6 mb-8">
    {items[0] && <FeedBlogCard blog={items[0]} layout="featured" priority />}
    {items.length > 1 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.slice(1, 5).map((b, idx) => (
          <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="grid" />
        ))}
      </div>
    )}
  </div>
);

const LayoutBento = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {items[0] && (
      <div className="md:col-span-2">
        <FeedBlogCard blog={items[0]} layout="featured" />
      </div>
    )}
    {items[1] && (
      <div className="md:col-span-1">
        <FeedBlogCard blog={items[1]} layout="grid" />
      </div>
    )}
    {items[2] && (
      <div className="md:col-span-1">
        <FeedBlogCard blog={items[2]} layout="grid" />
      </div>
    )}
    {items[3] && (
      <div className="md:col-span-2">
        <FeedBlogCard blog={items[3]} layout="featured" />
      </div>
    )}
  </div>
);

const LayoutSplitHero = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    {items.map((b, idx) => (
      <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="overlay" />
    ))}
  </div>
);

const LayoutMosaic = ({ items }) => (
  <div className="flex flex-col gap-6 mb-8">
    {items.length > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.slice(0, 2).map((b, idx) => (
          <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="overlay" />
        ))}
      </div>
    )}
    {items.length > 2 && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.slice(2, 5).map((b, idx) => (
          <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="grid" />
        ))}
      </div>
    )}
  </div>
);

const LayoutRail = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    {items[0] && (
      <div className="lg:col-span-7">
        <FeedBlogCard blog={items[0]} layout="overlay" />
      </div>
    )}
    {items.length > 1 && (
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        {items.slice(1, 4).map((b, idx) => (
          <FeedBlogCard key={b._id || b.slug || idx} blog={b} layout="compact" />
        ))}
      </div>
    )}
  </div>
);

// ─── MAIN EXPORT COMPONENT ───────────────────────────────────────────────────
export default function AllBlogsInfiniteFeed({
  initialBlogs = [],
  initialHasMore = true,
}) {
  const [blogs, setBlogs] = useState(() => getUniquePosts(initialBlogs));
  const [page, setPage] = useState(2);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const observerTarget = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/public/blogs?page=${page}&limit=12`);
      const result = await res.json();
      const fetchedBlogs = result.blogs || [];

      if (fetchedBlogs.length === 0) {
        setHasMore(false);
      } else {
        setBlogs((prev) => getUniquePosts([...prev, ...fetchedBlogs]));
        setHasMore(result.page < result.totalPages);
        setPage((prev) => prev + 1);
      }
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: "Network Error",
        text: "Failed to load more articles.",
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
  }, [page, hasMore, isLoading]);

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

  const chunkedLayouts = useMemo(() => {
    const pattern = [4, 3, 5, 4, 3, 5, 4];
    const chunks = [];
    let index = 0,
      patternIdx = 0;

    const uniqueBlogs = getUniquePosts(blogs);

    while (index < uniqueBlogs.length) {
      const type = patternIdx % pattern.length;
      const expectedSize = pattern[type];
      const items = uniqueBlogs.slice(index, index + expectedSize);

      if (items.length > 0) {
        chunks.push({
          type,
          items,
          id: `chunk-${index}-${items[0]?._id || items[0]?.slug}`,
        });
      }
      index += expectedSize;
      patternIdx++;
    }
    return chunks;
  }, [blogs]);

  return (
    <section className="w-full bg-[#F8F0E5] font-sans">
      {/* Feed Header */}
      <div className="flex items-center gap-2 mb-8 border-b border-[#E2D9CC] pb-3.5">
        <Sparkles size={20} className="text-[#D9A441]" />
        <h2 className="text-[24px] sm:text-[28px] font-heading font-extrabold text-[#10201B] tracking-tight">
          The Master Feed
        </h2>
      </div>

      {/* Dynamic Chunked Engine */}
      <div className="flex flex-col">
        {chunkedLayouts.map((chunk) => {
          if (chunk.items.length < 3) {
            return <LayoutGrid key={chunk.id} items={chunk.items} />;
          }

          const layouts = [
            LayoutGrid,
            LayoutTriad,
            LayoutShowcase,
            LayoutBento,
            LayoutSplitHero,
            LayoutMosaic,
            LayoutRail,
          ];

          const Comp = layouts[chunk.type];

          return (
            <React.Fragment key={chunk.id}>
              <Comp items={chunk.items} />
            </React.Fragment>
          );
        })}
      </div>

      {/* Infinite Scroll Trigger / Loader State */}
      <div
        ref={observerTarget}
        className="flex flex-col items-center justify-center py-12"
      >
        {isLoading ? (
          <div className="flex items-center gap-2.5 bg-[#1C352D] text-[#FDFBF7] px-7 py-3 rounded-full shadow-sm border border-[#25473C]">
            <Loader2 className="animate-spin text-[#D9A441]" size={16} />
            <span className="text-[12px] font-heading font-bold tracking-wider uppercase">
              Fetching Stories...
            </span>
          </div>
        ) : (
          !hasMore && (
            <div className="text-center mt-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center mx-auto mb-2.5 text-[#1C352D]">
                <CheckCircle2 size={22} className="text-[#34D399]" />
              </div>
              <h4 className="text-[#10201B] font-heading font-bold text-[16px] mb-0.5">
                You&apos;re All Caught Up
              </h4>
              <p className="text-[#6B7280] font-normal text-[13px]">
                You&apos;ve reached the end of the feed.
              </p>
            </div>
          )
        )}
      </div>
    </section>
  );
}