"use client";

import React, { useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── Fonts ────────────────────────────────────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

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

// ─── CARD 1 — Hero (large image, overlay content) ────────────────────────────
const HeroCard = ({ post, priority }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="reveal-card group relative block rounded-[16px] overflow-hidden bg-[var(--color-navy-900)] shadow-[0_4px_20px_rgba(3,4,10,0.5)] hover:shadow-[0_8px_32px_rgba(124,92,252,0.2)] transition-shadow"
    style={{ minHeight: 340 }}
  >
    <Image
      src={post.image || "/fallback-blog.jpg"}
      alt={post.title}
      fill
      priority={priority}
      sizes="(max-width: 768px) 100vw, 60vw"
      className="object-cover opacity-80 group-hover:opacity-70 group-hover:scale-[1.04] transition-all duration-700"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)]/95 via-[var(--color-background)]/40 to-transparent" />
    <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
      <span className="inline-block bg-[var(--color-primary)] text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-md mb-3 w-max shadow-sm">
        {post.categoryName}
      </span>
      <h3 className="font-sans text-[26px] md:text-[32px] font-extrabold text-[var(--color-text-primary)] leading-tight mb-2 tracking-tight">
        {post.title}
      </h3>
      <p className="text-[var(--color-text-secondary)] text-[14px] font-medium line-clamp-2 mb-5">
        {post.excerpt}
      </p>
    </div>
  </Link>
);

// ─── CARD 2 — Standard ───────────────────────────────────────────────────────
const StandardCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="reveal-card group flex flex-col rounded-[16px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:shadow-[0_12px_32px_rgba(124,92,252,0.15)] transition-all duration-300 h-full"
  >
    <div className="relative h-[180px] overflow-hidden bg-[var(--color-navy-900)] flex-shrink-0">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        loading="lazy"
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
      <span className="absolute top-4 left-4 bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md z-10 shadow-[0_4px_12px_rgba(3,4,10,0.5)]">
        {post.categoryName}
      </span>
    </div>
    <div className="p-5 flex flex-col flex-grow">
      <h4 className="font-sans text-[16px] font-bold text-[var(--color-text-primary)] line-clamp-2 mb-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
        {post.title}
      </h4>
      <p className="text-[var(--color-text-secondary)] text-[13px] font-medium line-clamp-2 mb-4 leading-relaxed">
        {post.excerpt}
      </p>
      <div className="mt-auto flex items-center gap-2 text-[var(--color-text-secondary)] opacity-70 text-[12px] font-medium pt-4 border-t border-[var(--color-border)]">
        <CalendarDays size={14} /> {post.date}
      </div>
    </div>
  </Link>
);

// ─── CARD 3 — Horizontal ─────────────────────────────────────────────────────
const HorizontalCard = ({ post }) => (
  <Link
    href={`/blogs/${post.slug}`}
    className="reveal-card group flex gap-4 rounded-[16px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50 hover:shadow-[0_12px_24px_rgba(124,92,252,0.15)] transition-all duration-300 p-3"
  >
    <div className="relative w-[130px] h-[100px] rounded-[10px] overflow-hidden flex-shrink-0 bg-[var(--color-navy-900)]">
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
    </div>
    <div className="flex flex-col justify-center flex-grow min-w-0 py-1 pr-2">
      <span className="text-[var(--color-secondary)] text-[10px] font-bold uppercase tracking-wider mb-1.5">
        {post.categoryName}
      </span>
      <h4 className="font-sans text-[15px] font-bold text-[var(--color-text-primary)] line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
        {post.title}
      </h4>
    </div>
  </Link>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeInfiniteFeed({ initialPosts }) {
  const containerRef = useRef(null);
  const horizontalScrollRef = useRef(null);
  const horizontalContainerRef = useRef(null);

  const posts = useMemo(
    () => getUniquePosts(initialPosts || [], 30),
    [initialPosts],
  );

  useEffect(() => {
    if (!posts.length) return;
    const ctx = gsap.context(() => {
      // Reveal Animation
      ScrollTrigger.batch(".reveal-card", {
        start: "top 90%",
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }),
        once: true,
      });

      // Horizontal Scroll
      const track = horizontalScrollRef.current;
      const section = horizontalContainerRef.current;
      if (track && section) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - section.clientWidth),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            pin: true,
            scrub: 1,
            start: "top top",
            end: () => `+=${track.scrollWidth}`,
          },
        });
      }
    }, containerRef);
    return () => ctx.revert();
  }, [posts]);

  return (
    <div
      ref={containerRef}
      className={`w-full bg-[var(--color-background)] ${inter.variable} font-sans`}
    >
      {/* SECTION 1: HERO */}
      <section className="py-16 md:py-24 px-5 max-w-[1280px] mx-auto border-b border-[var(--color-border)]">
        <h2 className="text-[32px] font-extrabold mb-10 text-[var(--color-text-primary)]">
          Shopping Insights
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HeroCard post={posts[0]} priority />
          <div className="grid sm:grid-cols-2 gap-6">
            {posts.slice(1, 5).map((post) => (
              <StandardCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: HORIZONTAL SLIDE */}
      <section
        ref={horizontalContainerRef}
        className="h-screen flex flex-col justify-center bg-[var(--color-surface)] border-b border-[var(--color-border)] overflow-hidden"
      >
        <div className="px-10 mb-10 text-[var(--color-text-primary)]">
          <h2 className="text-4xl font-extrabold">Deep Dives</h2>
        </div>
        <div ref={horizontalScrollRef} className="flex gap-8 px-10">
          {posts.slice(5, 15).map((post) => (
            <div key={post.id} className="min-w-[300px] w-[300px]">
              <StandardCard post={post} />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: GRID */}
      <section className="py-24 px-5 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(15).map((post) => (
            <div key={post.id} className="reveal-card opacity-0">
              <StandardCard post={post} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
