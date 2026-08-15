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
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  CalendarDays,
  Clock,
  BookOpen,
  Sparkles,
  Loader2,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swal from "sweetalert2";

gsap.registerPlugin(ScrollTrigger);

// ─── Dedupe by slug, cap at max ──────────────────────────────────────────────
function getUniquePosts(posts, max = 30) {
  const seen = new Set();
  const result = [];
  for (const post of posts) {
    const key = post.slug || post.id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(post);
    if (result.length >= max) break;
  }
  return result;
}

// ─── UNIVERSAL FEED CARD (Dark-Mode Adapted) ──────────────────────────
const FeedBlogCard = ({ blog, layout = "grid" }) => {
  const imageUrl = blog.featuredImage?.url || blog.image || "";
  const isOverlay = layout === "overlay";
  const catName = blog.category?.name || blog.categoryName;

  const containerClasses = {
    featured: "flex-col lg:flex-row min-h-[360px]",
    grid: "flex-col h-full",
    compact: "flex-col sm:flex-row h-full",
    overlay: "relative flex-col justify-end min-h-[420px] h-full",
  };

  const imageClasses = {
    featured: "lg:w-[50%] h-[240px] lg:h-auto shrink-0",
    grid: "w-full aspect-[16/10] shrink-0",
    compact: "sm:w-[45%] h-[180px] sm:h-auto shrink-0",
    overlay: "absolute inset-0 w-full h-full",
  };

  const contentClasses = {
    featured: "p-8 md:p-10 lg:w-[50%]",
    grid: "p-6",
    compact: "p-5 sm:w-[55%] flex flex-col justify-center",
    overlay:
      "relative z-10 p-8 pt-32 bg-gradient-to-t from-[var(--color-navy-900)] via-[var(--color-navy-900)]/80 to-transparent",
  };

  return (
    <article
      className={`group flex overflow-hidden rounded-[24px] transition-all duration-500 ease-in-out border ${
        isOverlay
          ? "bg-[var(--color-navy-900)] border-transparent shadow-[0_12px_40px_rgba(3,4,10,0.6)]"
          : "bg-[var(--color-surface)] border-[var(--color-border)] shadow-[0_4px_16px_rgba(3,4,10,0.3)] hover:border-[var(--color-primary)]/50 hover:shadow-[0_20px_40px_rgba(124,92,252,0.15)]"
      } ${containerClasses[layout]}`}
    >
      <Link
        href={`/blogs/${blog.slug}`}
        className={`relative block bg-[var(--color-navy-900)] ${imageClasses[layout]}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={blog.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className={`object-cover transition-transform duration-1000 ${isOverlay ? "opacity-60 group-hover:scale-105 group-hover:opacity-40" : "group-hover:scale-105"}`}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-primary)]/20">
            <BookOpen size={48} />
          </div>
        )}

        {catName && !isOverlay && (
          <span className="absolute left-4 top-4 z-20 rounded-[6px] bg-[var(--color-primary)] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white shadow-sm">
            {catName}
          </span>
        )}
      </Link>

      <div
        className={`flex flex-col flex-grow justify-between ${contentClasses[layout]}`}
      >
        <div>
          {isOverlay && catName && (
            <span className="text-[var(--color-primary)] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3 block drop-shadow-md">
              {catName}
            </span>
          )}

          <div className="mb-3 flex flex-wrap items-center gap-3 text-[12px] font-bold text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-[var(--color-primary)]" />{" "}
              {new Date(blog.publishedAt || blog.date).toLocaleDateString()}
            </span>
            {blog.readTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-[var(--color-primary)]" />{" "}
                {blog.readTimeMinutes} min
              </span>
            )}
          </div>

          <Link href={`/blogs/${blog.slug}`}>
            <h3
              className={`font-bold transition-colors leading-[1.25] mb-3 tracking-tight line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] ${isOverlay ? "text-[24px] md:text-[28px]" : layout === "featured" ? "text-[24px] md:text-[32px]" : layout === "compact" ? "text-[17px]" : "text-[20px]"}`}
            >
              {blog.title}
            </h3>
          </Link>

          {!["compact", "overlay"].includes(layout) && (
            <p className="mb-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)] line-clamp-2 md:line-clamp-3">
              {blog.excerpt}
            </p>
          )}
        </div>

        <div
          className={`flex items-center justify-between pt-4 mt-4 border-t border-[var(--color-border)]`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-bold bg-[var(--color-surface-alt)] text-[var(--color-text-primary)] border border-[var(--color-border)]`}
            >
              {(blog.author?.name || "E")[0].toUpperCase()}
            </div>
            <span className="text-[12px] font-bold text-[var(--color-text-primary)]">
              {blog.author?.name || "Editorial"}
            </span>
          </div>
          {layout !== "compact" && (
            <Link
              href={`/blogs/${blog.slug}`}
              className="flex items-center gap-1.5 text-[12px] font-extrabold text-[var(--color-primary)] transition-all hover:gap-2"
            >
              Read <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

// ─── LAYOUT ENGINE ───
const LayoutSlider = ({ items }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
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

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
  }, [emblaApi]);

  return (
    <div className="relative w-full mb-16 py-12 md:py-16 rounded-[32px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
      <div className="absolute inset-y-0 left-0 right-0 max-w-[1360px] mx-auto z-30 hidden md:block">
        <button
          onClick={scrollPrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] shadow-xl hover:bg-[var(--color-primary)] hover:text-white transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)] shadow-xl hover:bg-[var(--color-primary)] hover:text-white transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex items-center touch-pan-y">
          {items.map((post, idx) => (
            <div
              key={post._id || idx}
              className="relative flex-[0_0_90%] sm:flex-[0_0_65%] lg:flex-[0_0_55%] min-w-0 px-3"
            >
              <Link
                href={`/blogs/${post.slug}`}
                className={`group relative flex flex-col justify-end w-full rounded-[24px] overflow-hidden bg-[var(--color-navy-900)] transition-all duration-700 ${idx === selectedIndex ? "h-[450px] md:h-[500px] scale-100 opacity-100 z-20 shadow-[0_24px_64px_rgba(3,4,10,0.6)]" : "h-[380px] md:h-[420px] scale-[0.85] opacity-50 z-10"}`}
              >
                <Image
                  src={
                    post.image ||
                    post.featuredImage?.url ||
                    "/fallback-blog.jpg"
                  }
                  alt={post.title}
                  fill
                  className="object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-navy-950)] via-[var(--color-navy-900)]/40 to-transparent" />
                <div className="relative z-10 p-8 md:p-12 text-center">
                  <span className="text-[var(--color-primary)] text-[11px] font-extrabold uppercase tracking-[0.2em] mb-4 block">
                    {post.category?.name || "Deep Dive"}
                  </span>
                  <h3 className="font-extrabold text-[var(--color-text-primary)] text-[28px] md:text-[40px] leading-[1.1] mb-6">
                    {post.title}
                  </h3>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const LayoutGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
    {items.map((b) => (
      <FeedBlogCard key={b._id} blog={b} layout="grid" />
    ))}
  </div>
);
const LayoutTriad = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
    <div className="lg:col-span-8">
      <FeedBlogCard blog={items[0]} layout="featured" />
    </div>
    <div className="lg:col-span-4 flex flex-col gap-6">
      {items.slice(1, 3).map((b) => (
        <FeedBlogCard key={b._id} blog={b} layout="compact" />
      ))}
    </div>
  </div>
);
const LayoutShowcase = ({ items }) => (
  <div className="flex flex-col gap-6 mb-16">
    <FeedBlogCard blog={items[0]} layout="featured" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.slice(1, 5).map((b) => (
        <FeedBlogCard key={b._id} blog={b} layout="grid" />
      ))}
    </div>
  </div>
);
const LayoutBento = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
    <div className="md:col-span-2">
      <FeedBlogCard blog={items[0]} layout="featured" />
    </div>
    <div className="md:col-span-1">
      <FeedBlogCard blog={items[1]} layout="grid" />
    </div>
    <div className="md:col-span-1">
      <FeedBlogCard blog={items[2]} layout="grid" />
    </div>
    <div className="md:col-span-2">
      <FeedBlogCard blog={items[3]} layout="featured" />
    </div>
  </div>
);
const LayoutSplitHero = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
    {items.map((b) => (
      <FeedBlogCard key={b._id} blog={b} layout="overlay" />
    ))}
  </div>
);
const LayoutMosaic = ({ items }) => (
  <div className="flex flex-col gap-6 mb-16">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {items.slice(0, 2).map((b) => (
        <FeedBlogCard key={b._id} blog={b} layout="overlay" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.slice(2, 5).map((b) => (
        <FeedBlogCard key={b._id} blog={b} layout="grid" />
      ))}
    </div>
  </div>
);
const LayoutRail = ({ items }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
    <div className="lg:col-span-7">
      <FeedBlogCard blog={items[0]} layout="overlay" />
    </div>
    <div className="lg:col-span-5 flex flex-col gap-6">
      {items.slice(1, 4).map((b) => (
        <FeedBlogCard key={b._id} blog={b} layout="compact" />
      ))}
    </div>
  </div>
);

// ─── Main Export Component ────────────────────────────────────────────────────
export default function AllBlogsInfiniteFeed({
  initialBlogs = [],
  initialHasMore = true,
}) {
  const [blogs, setBlogs] = useState(initialBlogs);
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
      setBlogs((prev) => [...prev, ...fetchedBlogs]);
      setHasMore(result.page < result.totalPages);
      setPage((prev) => prev + 1);
    } catch (err) {
      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "error",
        title: "Network Error",
        showConfirmButton: false,
        timer: 3000,
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
      { threshold: 0.1, rootMargin: "1000px" },
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const chunkedLayouts = useMemo(() => {
    const pattern = [3, 4, 3, 5, 4, 3, 5, 4];
    const chunks = [];
    let index = 0,
      patternIdx = 0;
    while (index < blogs.length) {
      const type = patternIdx % pattern.length;
      const expectedSize = pattern[type];
      const items = blogs.slice(index, index + expectedSize);
      if (items.length > 0) chunks.push({ type, items, id: `chunk-${index}` });
      index += expectedSize;
      patternIdx++;
    }
    return chunks;
  }, [blogs]);

  return (
    <section className="w-full mt-8 bg-[var(--color-background)]">
      <div className="flex items-center gap-3 mb-10 border-b-[3px] border-[var(--color-primary)] pb-4 w-max">
        <Sparkles size={24} className="text-[var(--color-primary)]" />
        <h2 className="text-[32px] font-extrabold text-[var(--color-text-primary)] tracking-tight">
          The Master Feed
        </h2>
      </div>
      <div className="flex flex-col">
        {chunkedLayouts.map((chunk) => {
          if (chunk.items.length < 3)
            return <LayoutGrid key={chunk.id} items={chunk.items} />;
          const layouts = [
            <LayoutSlider />,
            <LayoutGrid />,
            <LayoutTriad />,
            <LayoutShowcase />,
            <LayoutBento />,
            <LayoutSplitHero />,
            <LayoutMosaic />,
            <LayoutRail />,
          ];
          const Comp = layouts[chunk.type];
          return (
            <React.Fragment key={chunk.id}>
              {React.cloneElement(Comp, { items: chunk.items })}
            </React.Fragment>
          );
        })}
      </div>
      <div
        ref={observerTarget}
        className="flex flex-col items-center justify-center py-16"
      >
        {isLoading ? (
          <div className="flex items-center gap-4 bg-[var(--color-primary)] text-white px-8 py-4 rounded-full shadow-lg">
            <Loader2 className="animate-spin" size={20} />{" "}
            <span className="text-[13px] font-bold tracking-widest uppercase">
              Fetching Stories...
            </span>
          </div>
        ) : (
          !hasMore && (
            <div className="text-center mt-6">
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-[var(--color-primary)]" size={28} />
              </div>
              <h4 className="text-[var(--color-text-primary)] font-extrabold text-[20px]">
                You're All Caught Up
              </h4>
            </div>
          )
        )}
      </div>
    </section>
  );
}
