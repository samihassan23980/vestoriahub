"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ArrowRight, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import gsap from "gsap";

// ─── Typography ───────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

// ─── Data Helper ──────────────────────────────────────────────────────────────
function buildFeedFromInitial(initialFeed = []) {
  const catMap = {};
  initialFeed.forEach((blog) => {
    const key = blog.categorySlug || blog.categoryName || "general";
    if (!catMap[key]) {
      catMap[key] = {
        name: blog.categoryName || "General",
        slug: key,
        posts: [],
      };
    }
    catMap[key].posts.push(blog);
  });
  return Object.values(catMap)
    .filter((c) => c.posts.length >= 4) // Ensure enough posts for layout structures
    .map((c) => ({ name: c.name, slug: c.slug, posts: c.posts.slice(0, 7) }))
    .slice(0, 4);
}

// ─── UI Primitives & Small Components ─────────────────────────────────────────

const SectionHeader = ({ title, eyebrow }) => (
  <div className="gsap-reveal mb-12 opacity-0">
    {eyebrow && (
      <span className="text-[var(--color-secondary)] text-[11px] font-extrabold uppercase tracking-[0.2em] mb-3 block">
        {eyebrow}
      </span>
    )}
    <h2 className="text-[36px] md:text-[44px] font-extrabold text-[var(--color-text-primary)] tracking-tight leading-none">
      {title}
    </h2>
  </div>
);

const AuthorBlock = ({ author, isDark = false }) => (
  <div className="flex items-center gap-3 mt-auto pt-4">
    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[var(--color-surface-alt)] flex-shrink-0 border border-[var(--color-border)]">
      {author?.avatar ? (
        <Image
          src={author.avatar}
          alt={author.name || "Author"}
          fill
          className="object-cover"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-bold text-[13px] ${isDark ? "text-white bg-white/20" : "text-[var(--color-text-primary)]"}`}
        >
          {(author?.name || "E")[0].toUpperCase()}
        </div>
      )}
    </div>
    <span
      className={`text-[13px] font-bold ${isDark ? "text-white" : "text-[var(--color-text-primary)]"}`}
    >
      {author?.name || "Editorial Team"}
    </span>
  </div>
);

// ─── Card Components ──────────────────────────────────────────────────────────

// 1. Bento Hero Card (Large Vertical-ish)
const BentoHeroCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex flex-col h-full w-full"
  >
    <div className="relative aspect-[4/3] md:aspect-[16/10] w-full rounded-[24px] overflow-hidden bg-[var(--color-navy-900)] mb-6">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        sizes="(max-width: 1024px) 100vw, 60vw"
        className="object-cover transition-transform duration-1000 group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col flex-grow pr-4">
      <span className="text-[var(--color-secondary)] text-[11px] font-extrabold uppercase tracking-[0.2em] mb-4">
        {post.categoryName}
      </span>
      <h3 className="text-[28px] lg:text-[36px] font-extrabold text-[var(--color-text-primary)] leading-[1.1] mb-4 group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
        {post.title}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed line-clamp-3 mb-6">
        {post.excerpt}
      </p>
      <AuthorBlock author={post.author} />
    </div>
  </Link>
);

// 2. Compact List Card (Small Image Left, Text Right)
const CompactListCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex items-center gap-6 py-6 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface)] transition-colors rounded-[16px] -mx-4 px-4"
  >
    <div className="relative w-[110px] aspect-square rounded-[16px] overflow-hidden bg-[var(--color-navy-900)] shrink-0">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        sizes="110px"
        className="object-cover transition-transform duration-700 group-hover:scale-110"
      />
    </div>
    <div className="flex flex-col justify-center">
      <span className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-widest mb-2">
        {post.categoryName}
      </span>
      <h4 className="text-[17px] font-extrabold text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
        {post.title}
      </h4>
      <span className="text-[var(--color-text-secondary)] opacity-70 text-[12px] font-medium mt-3">
        {post.date}
      </span>
    </div>
  </Link>
);

// 3. Featured Horizontal Card (Wide Image)
const EditorialFeaturedCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center rounded-[24px] overflow-hidden"
  >
    <div className="relative aspect-[4/3] md:aspect-[1.2/1] w-full overflow-hidden rounded-[24px] bg-[var(--color-navy-900)]">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col justify-center py-4 pr-6">
      <span className="text-[var(--color-secondary)] text-[11px] font-extrabold uppercase tracking-[0.2em] mb-4 block">
        {post.categoryName}
      </span>
      <h2 className="text-[32px] lg:text-[42px] font-extrabold text-[var(--color-text-primary)] leading-[1.1] mb-5 group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
        {post.title}
      </h2>
      <p className="text-[15px] lg:text-[16px] text-[var(--color-text-secondary)] font-medium line-clamp-3 mb-8 leading-relaxed">
        {post.excerpt}
      </p>
      <AuthorBlock author={post.author} />
    </div>
  </Link>
);

// 4. Standard Grid Card (Vertical)
const EditorialGridCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="group flex flex-col h-full rounded-[20px] transition-all duration-300 hover:-translate-y-1"
  >
    <div className="relative aspect-[4/3] sm:aspect-[1.5/1] w-full overflow-hidden rounded-[20px] bg-[var(--color-navy-900)] mb-5">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
    </div>
    <div className="flex flex-col flex-grow px-2">
      <span className="text-[var(--color-secondary)] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-3">
        {post.categoryName}
      </span>
      <h3 className="text-[19px] font-extrabold text-[var(--color-text-primary)] leading-snug mb-3 group-hover:text-[var(--color-primary)] transition-colors tracking-tight line-clamp-2">
        {post.title}
      </h3>
      <p className="text-[14px] text-[var(--color-text-secondary)] line-clamp-2 mb-5 leading-relaxed">
        {post.excerpt}
      </p>
      <AuthorBlock author={post.author} />
    </div>
  </Link>
);

// ─── Distinct Layout Components ───────────────────────────────────────────────

// LAYOUT 1: The "Bento" Magazine Layout (Asymmetric)
const LayoutBento = ({ category }) => (
  <div className="gsap-container mb-32">
    <SectionHeader title={category.name} eyebrow="Curated Collection" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
      {/* Left: Huge Hero Card */}
      <div className="gsap-reveal lg:col-span-7 opacity-0">
        {category.posts[0] && <BentoHeroCard post={category.posts[0]} />}
      </div>
      {/* Right: Stacked Compact List */}
      <div className="gsap-reveal lg:col-span-5 flex flex-col justify-center opacity-0">
        <h4 className="text-[18px] font-extrabold text-[var(--color-text-primary)] mb-6 pb-4 border-b border-[var(--color-border)]">
          More in {category.name}
        </h4>
        <div className="flex flex-col">
          {category.posts.slice(1, 4).map((post) => (
            <CompactListCard key={post.id || post.slug} post={post} />
          ))}
        </div>
        <Link
          href={`/categories/${category.slug}`}
          className="mt-8 inline-flex items-center gap-2 text-[var(--color-primary)] font-bold text-[14px] hover:gap-3 transition-all"
        >
          View All {category.name} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </div>
);

// LAYOUT 2: The "Classic" Editorial Layout (1 Hero Top, 3 Grid Bottom)
const LayoutClassic = ({ category }) => (
  <div className="gsap-container mb-32">
    <SectionHeader title={category.name} eyebrow="Top Stories" />
    <div className="flex flex-col gap-12">
      <div className="gsap-reveal opacity-0">
        {category.posts[0] && (
          <EditorialFeaturedCard post={category.posts[0]} />
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {category.posts.slice(1, 4).map((post, i) => (
          <div key={post.id || i} className="gsap-reveal opacity-0">
            <EditorialGridCard post={post} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// LAYOUT 3: The "Spotlight Slider" (Interactive Carousel)
const LayoutSlider = ({ category }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: false,
  });
  const [prevBtnDisabled, setPrevBtnDisabled] = useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = useState(true);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="gsap-container mb-32 bg-[var(--color-surface)] rounded-[32px] p-8 md:p-12 border border-[var(--color-border)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <SectionHeader title={category.name} eyebrow="Interactive Feed" />

        {/* Carousel Controls */}
        <div className="gsap-reveal flex items-center gap-3 opacity-0 pb-2">
          <button
            onClick={scrollPrev}
            disabled={prevBtnDisabled}
            className={`w-12 h-12 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-all ${prevBtnDisabled ? "opacity-30 cursor-not-allowed" : "bg-[var(--color-surface-alt)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] text-[var(--color-text-primary)]"}`}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={scrollNext}
            disabled={nextBtnDisabled}
            className={`w-12 h-12 flex items-center justify-center rounded-full border border-[var(--color-border)] transition-all ${nextBtnDisabled ? "opacity-30 cursor-not-allowed" : "bg-[var(--color-surface-alt)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] text-[var(--color-text-primary)]"}`}
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div className="gsap-reveal overflow-hidden opacity-0" ref={emblaRef}>
        <div className="flex -ml-6">
          {category.posts.map((post, idx) => (
            <div
              key={post.id || idx}
              className="pl-6 flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0"
            >
              <EditorialGridCard post={post} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Main Export Component ────────────────────────────────────────────────────
export default function CategoryBlogs({ layoutData }) {
  const containerRef = useRef(null);

  // ── Data Resolution ──
  const rawFeed = Array.isArray(layoutData?.feedCategories)
    ? layoutData.feedCategories
    : [];
  const initialFeed = Array.isArray(layoutData?.initialFeed)
    ? layoutData.initialFeed
    : [];
  const feedCategories =
    rawFeed.length > 0 ? rawFeed : buildFeedFromInitial(initialFeed);

  const trendingRaw = Array.isArray(layoutData?.trending)
    ? layoutData.trending
    : [];
  const trendingPosts =
    trendingRaw.length > 0 ? trendingRaw : initialFeed.slice(0, 7);

  // ── GSAP Scroll Animation Logic ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      const containers = gsap.utils.toArray(".gsap-container");

      containers.forEach((container) => {
        const reveals = container.querySelectorAll(".gsap-reveal");
        gsap.fromTo(
          reveals,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: container,
              start: "top 85%", // Triggers when top of container hits 85% of viewport
              toggleActions: "play none none none",
            },
          },
        );
      });
    }, containerRef);

    return () => ctx.revert(); // Cleanup GSAP
  }, [feedCategories, trendingPosts]);

  return (
    <section
      ref={containerRef}
      className={`bg-[var(--color-background)] text-[var(--color-text-primary)] ${inter.variable} font-sans overflow-hidden`}
    >
      <div className="max-w-[1360px] mx-auto px-4 md:px-8 py-20 md:py-32">
        {/* ── Trending Section (Always Interactive Slider) ── */}
        {trendingPosts.length > 0 && (
          <LayoutSlider
            category={{
              name: "Trending Now",
              posts: trendingPosts,
              slug: "trending",
            }}
          />
        )}

        {/* ── Dynamic Category Layouts ── */}
        {feedCategories.map((cat, idx) => {
          // Cycle through the 3 distinct layouts based on index to prevent visual monotony
          const layoutType = idx % 3;

          if (!cat.posts || cat.posts.length < 4) return null; // Fallback safety

          return (
            <React.Fragment key={cat.slug || idx}>
              {layoutType === 0 && <LayoutBento category={cat} />}
              {layoutType === 1 && <LayoutClassic category={cat} />}
              {layoutType === 2 && <LayoutSlider category={cat} />}
            </React.Fragment>
          );
        })}

        {/* ── Load More CTA ── */}
        <div className="gsap-container mt-16 text-center flex justify-center">
          <Link
            href="/blogs"
            className="gsap-reveal inline-flex items-center justify-center gap-3 bg-transparent hover:bg-[var(--color-primary)] text-[var(--color-primary)] hover:text-white border-2 border-[var(--color-primary)] font-extrabold text-[15px] px-12 py-4 rounded-full transition-all duration-300 shadow-sm opacity-0"
          >
            <Compass size={18} /> Explore All Categories
          </Link>
        </div>
      </div>
    </section>
  );
}
