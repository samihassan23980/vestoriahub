"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import Image from "next/image";
import Swal from "sweetalert2";
import useEmblaCarousel from "embla-carousel-react";
import {
  Loader2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Clock,
  User,
  CalendarDays,
  ArrowLeft,
} from "lucide-react";

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

// ─── UNIVERSAL BLOG CARD (Fixed Sizing Engine) ────────────────────────────────
const BlogCard = ({ blog, layout = "grid", priority = false }) => {
  const imageUrl = blog.featuredImage?.url || "";

  // Dynamic layout classes to prevent squashing in narrow columns
  const containerClasses = {
    featured:
      "flex-col lg:flex-row min-h-[400px] border-[var(--indigo-line)] shadow-sm",
    grid: "flex-col h-full hover:shadow-[0_16px_32px_rgba(124,92,252,0.1)]",
    list: "flex-col sm:flex-row hover:shadow-[0_12px_24px_rgba(124,92,252,0.1)]",
    compact:
      "flex-col sm:flex-row h-full hover:shadow-[0_12px_24px_rgba(124,92,252,0.1)]",
  };

  const imageWrapperClasses = {
    featured: "lg:w-1/2 min-h-[280px] lg:min-h-full",
    grid: "w-full aspect-[16/10]",
    list: "sm:w-[280px] min-h-[220px]",
    compact: "sm:w-[40%] min-h-[180px]",
  };

  const contentClasses = {
    featured: "p-8 md:p-12",
    grid: "p-6",
    list: "p-6 md:p-8",
    compact: "p-5",
  };

  const titleClasses = {
    featured: "text-[28px] md:text-[36px]",
    grid: "text-[18px] md:text-[20px]",
    list: "text-[20px] md:text-[24px]",
    compact: "text-[16px] md:text-[18px]",
  };

  return (
    <article
      className={`group flex overflow-hidden rounded-[24px] border border-[var(--indigo-line)] bg-navy-600 transition-all duration-500 ease-in-out hover:border-purple-500/50 ${containerClasses[layout]}`}
    >
      {/* Thumbnail */}
      <Link
        href={`/blogs/${blog.slug}`}
        className={`relative block overflow-hidden bg-navy-700 shrink-0 ${imageWrapperClasses[layout]}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={blog.featuredImage?.alt || blog.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-lavender-500/30">
            <BookOpen size={48} />
          </div>
        )}
        {blog.category?.name && (
          <span className="absolute left-4 top-4 z-20 rounded-[6px] bg-purple-500 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-sm">
            {blog.category.name}
          </span>
        )}
      </Link>

      {/* Content */}
      <div
        className={`flex flex-1 flex-col justify-between ${contentClasses[layout]}`}
      >
        <div>
          <div className="mb-4 flex items-center gap-4 text-[12px] font-bold text-lavender-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-purple-400" />{" "}
              {formatDate(blog.publishedAt)}
            </span>
            {blog.readTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" />{" "}
                {blog.readTimeMinutes} min
              </span>
            )}
          </div>
          <Link href={`/blogs/${blog.slug}`}>
            <h3
              className={`font-bold text-white transition-colors group-hover:text-purple-400 leading-[1.25] mb-3 tracking-tight line-clamp-2 ${titleClasses[layout]}`}
            >
              {blog.title}
            </h3>
          </Link>
          {layout !== "compact" && (
            <p className="mb-6 text-[14px] leading-relaxed text-lavender-300 line-clamp-2 md:line-clamp-3">
              {blog.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--indigo-line)] pt-4 mt-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 text-[12px] font-bold">
              {(blog.author?.name || "E")[0].toUpperCase()}
            </div>
            <span className="text-[12px] font-bold text-white">
              {blog.author?.name || "Editorial"}
            </span>
          </div>
          {layout !== "compact" && (
            <Link
              href={`/blogs/${blog.slug}`}
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-purple-400 transition-all hover:gap-2"
            >
              Read <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── DYNAMIC LAYOUT BLOCKS ────────────────────────────────────────────────────

// Layout 0: Deep Dive Slider (Cinematic 3 Posts)
const EditorialSlider = ({ items }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: items.length >= 3,
    align: "center",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = useCallback(
    (index) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full mb-16 py-12 rounded-[32px] bg-navy-700 border border-[var(--indigo-line)] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
      {items.length > 1 && (
        <div className="absolute inset-y-0 left-0 right-0 max-w-[1280px] mx-auto pointer-events-none z-30 hidden md:block">
          <button
            onClick={scrollPrev}
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-navy-800/80 backdrop-blur-md flex items-center justify-center text-white border border-[var(--indigo-line)] hover:bg-purple-500 hover:border-purple-500 transition-all pointer-events-auto shadow-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-navy-800/80 backdrop-blur-md flex items-center justify-center text-white border border-[var(--indigo-line)] hover:bg-purple-500 hover:border-purple-500 transition-all pointer-events-auto shadow-lg"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex items-center touch-pan-y">
          {items.map((post, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <div
                key={post._id}
                className="relative flex-[0_0_90%] sm:flex-[0_0_75%] lg:flex-[0_0_65%] min-w-0 px-2 sm:px-4"
              >
                <Link
                  href={`/blogs/${post.slug}`}
                  onClick={(e) => {
                    if (!isActive) {
                      e.preventDefault();
                      scrollTo(idx);
                    }
                  }}
                  className={`group relative flex flex-col justify-center items-center w-full rounded-[24px] overflow-hidden bg-navy-900 border border-[var(--indigo-line)] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isActive
                      ? "h-[450px] scale-100 opacity-100 z-20 shadow-[0_24px_64px_rgba(0,0,0,0.4)] border-purple-500/50"
                      : "h-[380px] scale-[0.9] opacity-50 z-10 cursor-pointer"
                  }`}
                >
                  <Image
                    src={
                      post.image ||
                      post.featuredImage?.url ||
                      "/fallback-blog.jpg"
                    }
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                  <div
                    className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ${
                      isActive
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    }`}
                  >
                    <span className="text-purple-300 text-[11px] font-extrabold uppercase tracking-[0.2em] mb-4 drop-shadow-md">
                      {post.category?.name || "Deep Dive"}
                    </span>
                    <h3 className="font-extrabold text-white text-[28px] md:text-[36px] leading-[1.1] mb-6 max-w-2xl drop-shadow-lg">
                      {post.title}
                    </h3>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Layout 1: The "Classic Grid" (4 Posts)
const EditorialGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
    {items.map((blog) => (
      <div key={blog._id} className="h-full">
        <BlogCard blog={blog} layout="grid" />
      </div>
    ))}
  </div>
);

// Layout 2: The "Triad" (1 Main Vertical + 2 Stacked Compact)
const EditorialTriad = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
    {/* Left: Main Large Grid Card */}
    <div className="lg:col-span-7 xl:col-span-7 h-full">
      {items[0] && <BlogCard blog={items[0]} layout="grid" />}
    </div>
    {/* Right: 2 Stacked Compact Cards */}
    <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6 justify-between">
      {items.slice(1, 3).map((blog) => (
        <div key={blog._id} className="flex-1">
          <BlogCard blog={blog} layout="compact" />
        </div>
      ))}
    </div>
  </div>
);

// Layout 3: The "Showcase" (1 Full Width Featured + 4 Grid)
const EditorialShowcase = ({ items }) => (
  <div className="flex flex-col gap-8 mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="w-full">
      {items[0] && <BlogCard blog={items[0]} layout="featured" />}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.slice(1, 5).map((blog) => (
        <div key={blog._id} className="h-full">
          <BlogCard blog={blog} layout="grid" />
        </div>
      ))}
    </div>
  </div>
);

// ─── MAIN FEED COMPONENT ──────────────────────────────────────────────────────
export default function CategoryInfiniteFeed({
  slug,
  initialBlogs,
  initialHasMore,
  featuredIds,
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
        `/api/public/blog-categories/${slug}?page=${page}&limit=12`,
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error);

      const fetchedBlogs = result.data.blogs.items || [];
      const existingIds = new Set(blogs.map((b) => b._id));
      const uniqueNew = fetchedBlogs.filter(
        (b) => !featuredIds.includes(b._id) && !existingIds.has(b._id),
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
        background: "#13152B", // var(--navy-600)
        color: "#FFFFFF",
        iconColor: "#7C5CFC", // var(--purple-500)
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
      { threshold: 0.1, rootMargin: "800px" },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // Dynamic Chunking: Slider(3) -> Grid(4) -> Triad(3) -> Showcase(5)
  const chunkedLayouts = useMemo(() => {
    const pattern = [3, 4, 3, 5];
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
    <section className="mt-16 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-[var(--indigo-line)] pb-6">
        <div>
          <span className="flex items-center gap-2 text-purple-400 font-bold text-[11px] uppercase tracking-[0.2em] mb-2">
            <Sparkles size={14} /> The Feed
          </span>
          <h2 className="text-[32px] md:text-[40px] font-extrabold text-white tracking-tight leading-none">
            Continue Reading
          </h2>
        </div>
      </div>

      <div className="flex flex-col">
        {chunkedLayouts.map((chunk) => {
          const expectedSize = [3, 4, 3, 5][chunk.type];
          // Fallback gracefully to grid if we run out of items mid-pattern
          if (chunk.items.length !== expectedSize || chunk.type === 1)
            return <EditorialGrid key={chunk.id} items={chunk.items} />;
          if (chunk.type === 0)
            return <EditorialSlider key={chunk.id} items={chunk.items} />;
          if (chunk.type === 2)
            return <EditorialTriad key={chunk.id} items={chunk.items} />;
          if (chunk.type === 3)
            return <EditorialShowcase key={chunk.id} items={chunk.items} />;
          return null;
        })}
      </div>

      <div
        ref={observerTarget}
        className="flex flex-col items-center justify-center py-20 w-full"
      >
        {isLoading ? (
          <div className="flex items-center gap-4 bg-purple-500 text-white px-8 py-4 rounded-full shadow-[0_8px_30px_rgba(124,92,252,0.25)] transform hover:scale-105 transition-transform">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-[13px] font-bold tracking-widest uppercase">
              Curating More Articles...
            </span>
          </div>
        ) : hasMore ? (
          <div className="h-16" />
        ) : (
          <div className="text-center animate-in fade-in duration-1000 mt-8">
            <div className="w-14 h-14 rounded-full bg-navy-700 border border-[var(--indigo-line)] flex items-center justify-center mx-auto mb-5">
              <ArrowRight className="text-purple-500" size={24} />
            </div>
            <h4 className="text-white font-extrabold text-[18px] mb-2">
              You're All Caught Up
            </h4>
            <p className="text-lavender-400 font-medium text-[14px]">
              Check back soon for new insights and guides.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
