"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Bookmark, Share2, Tag, Check, ShieldCheck } from "lucide-react";

export default function HeroSectionBlogs({ heroFeatured, heroGrid = [] }) {
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  // Fallback curated articles tuned for VestoriaHub
  const fallbackPosts = [
    {
      id: "1",
      title: "NAVIGATING DIGITAL SAVINGS HORIZONS",
      excerpt: "The future of verified coupon architecture and automated price-tracking systems.",
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
      categoryName: "SAVINGS, TECH",
      date: "12 OCT 2026",
      slug: "navigating-digital-savings-horizons",
    },
    {
      id: "2",
      title: "UNVEILING CODE INTERACTIVITY",
      excerpt: "Behind the scenes of checking promo codes before checkout.",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      categoryName: "VERIFIED",
      date: "11 OCT 2026",
      slug: "unveiling-code-interactivity",
    },
    {
      id: "3",
      title: "AMAZON PRICE DROP STORYTELLING",
      excerpt: "Analyzing genuine flash sales versus artificial price fluctuations.",
      image: "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&q=80&w=800",
      categoryName: "MARKETPLACE",
      date: "10 OCT 2026",
      slug: "amazon-price-drop-storytelling",
    },
    {
      id: "4",
      title: "HUMAN & MACHINE CONNECT",
      excerpt: "How algorithms match deal shoppers with relevant store coupons.",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
      categoryName: "INTELLIGENCE",
      date: "08 OCT 2026",
      slug: "human-machine-connect",
    },
    {
      id: "5",
      title: "CORE SHOPPING PULSE",
      excerpt: "Evaluating tech specs versus retail MSRP to find real value.",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
      categoryName: "TECH GUIDE",
      date: "07 OCT 2026",
      slug: "core-shopping-pulse",
    },
    {
      id: "6",
      title: "HARDWARE DEALS RADAR",
      excerpt: "Smart shopper breakdown of the best camera gear and seasonal drops.",
      image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
      categoryName: "GEAR",
      date: "07 OCT 2026",
      slug: "hardware-deals-radar",
    },
    {
      id: "7",
      title: "BIG DATA SAVINGS VISUALIZATION",
      excerpt: "Understanding annual clearance cycles and Black Friday trends.",
      image: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&q=80&w=800",
      categoryName: "DATA, TRENDS",
      date: "06 OCT 2026",
      slug: "big-data-savings-visualization",
    },
    {
      id: "8",
      title: "ARTISTRY IN INTERFACE",
      excerpt: "Designing friction-free checkout workflows that save everyday shoppers money.",
      image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=800",
      categoryName: "DESIGN",
      date: "05 OCT 2026",
      slug: "artistry-in-interface",
    },
    {
      id: "9",
      title: "THE MODERN SAVER SPACE",
      excerpt: "Building an ergonomic remote setup with curated retailer discount codes.",
      image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&q=80&w=800",
      categoryName: "WORKSPACE",
      date: "04 OCT 2026",
      slug: "the-modern-saver-space",
    },
  ];

  const mainHero = heroFeatured || fallbackPosts[0];
  const remaining = Array.isArray(heroGrid) && heroGrid.length > 0 ? heroGrid : fallbackPosts.slice(1);
  const midGrid = remaining.slice(0, 4);
  const bottomGrid = remaining.slice(4, 8);

  const toggleBookmark = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShare = (e, slug, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(`${window.location.origin}/blogs/${slug}`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <section className="relative w-full bg-[#0D1814] font-sans py-12 lg:py-16 overflow-hidden border-b border-[#25473C]">
      
      {/* ── AMBIENT BACKGROUND LIGHTING ── */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#D9A441]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] bg-[#162B24] rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ── TOP SECTION HEADER ── */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#25473C]/80">
          <div className="flex items-center gap-3">
            <h2 className="text-[28px] sm:text-[36px] font-heading font-black tracking-tight !text-[#D9A441] uppercase leading-none">
              JOURNAL
            </h2>
            <span className="hidden sm:inline-block text-[11px] font-mono font-bold tracking-widest !text-[#D5E4D9] uppercase bg-[#162B24] border border-[#25473C] px-3 py-1 rounded-full">
              SAVINGS INTELLIGENCE
            </span>
          </div>

          <Link
            href="/blogs"
            className="group flex items-center gap-1.5 text-[12px] font-heading font-extrabold uppercase tracking-widest !text-[#D9A441] hover:!text-[#FFFFFF] transition-colors"
          >
            <span>VIEW ALL POSTS</span>
            <ArrowUpRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* ── MAIN BENTO GRID MATRIX ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* ── 1. MAIN LARGE HERO CARD (Spans 2 cols, 2 rows) ── */}
          <Link
            href={`/blogs/${mainHero.slug || "#"}`}
            className="group relative lg:col-span-2 lg:row-span-2 rounded-[22px] overflow-hidden bg-[#162B24] border-2 border-[#25473C] hover:border-[#D9A441] transition-all duration-500 flex flex-col justify-between min-h-[440px] lg:min-h-[520px] shadow-2xl"
          >
            {/* Background Split Image */}
            <div 
              className="absolute inset-0 w-full h-full z-0 overflow-hidden"
              style={{ clipPath: "polygon(36% 0, 100% 0, 100% 100%, 16% 100%)" }}
            >
              <Image
                src={mainHero.image || "/fallback-blog.jpg"}
                alt={mainHero.title || "Hero post"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-1000 ease-out brightness-[0.75]"
              />
              {/* Solid black gradient overlay on the image */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#162B24] via-[#162B24]/40 to-black/60" />
            </div>

            {/* Top Bar (Pill Tag + Action Icons) */}
            <div className="relative z-20 p-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-heading font-extrabold tracking-wider uppercase bg-[#0D1814] !text-[#D9A441] border border-[#D9A441]/50 shadow-md">
                <Tag size={12} className="text-[#D9A441]" />
                {mainHero.categoryName || "FEATURED"}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleShare(e, mainHero.slug, mainHero.id || "hero")}
                  className="w-8 h-8 rounded-full bg-[#0D1814]/90 backdrop-blur-md border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Share article"
                >
                  {copiedId === (mainHero.id || "hero") ? <Check size={14} className="text-[#D9A441]" /> : <Share2 size={14} />}
                </button>
                <button
                  onClick={(e) => toggleBookmark(e, mainHero.id || "hero")}
                  className="w-8 h-8 rounded-full bg-[#0D1814]/90 backdrop-blur-md border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all hover:scale-110"
                  aria-label="Bookmark article"
                >
                  <Bookmark
                    size={14}
                    className={bookmarkedIds.includes(mainHero.id || "hero") ? "fill-[#D9A441] text-[#D9A441]" : ""}
                  />
                </button>
              </div>
            </div>

            {/* Bottom Content Info (High-Contrast Text Box) */}
            <div className="relative z-20 p-6 sm:p-8 max-w-[85%] sm:max-w-[72%]">
              <h3 className="text-[26px] sm:text-[34px] lg:text-[38px] font-heading font-black uppercase !text-[#FFFFFF] leading-[1.08] tracking-tight group-hover:!text-[#D9A441] transition-colors mb-3 drop-shadow-md">
                {mainHero.title}
              </h3>

              <p className="text-[14px] !text-[#D5E4D9] leading-relaxed line-clamp-2 mb-5 font-medium drop-shadow-sm">
                {mainHero.excerpt || "Exploring verified shopping architecture and discount intelligence."}
              </p>

              <span className="text-[11.5px] font-mono font-bold tracking-widest !text-[#A8C3B0] uppercase">
                {mainHero.date || "12 OCT 2026"}
              </span>
            </div>
          </Link>

          {/* ── 2. STACKED CARDS 1-4 (Cols 3 & 4) ── */}
          {midGrid.map((post, idx) => {
            const isLeftCut = idx % 2 === 0;
            const clipStyle = isLeftCut
              ? "polygon(46% 0, 100% 0, 100% 100%, 28% 100%)"
              : "polygon(38% 0, 100% 0, 100% 100%, 20% 100%)";

            return (
              <Link
                key={post.id || idx}
                href={`/blogs/${post.slug || "#"}`}
                className="group relative rounded-[20px] overflow-hidden bg-[#162B24] border-2 border-[#25473C] hover:border-[#D9A441] transition-all duration-300 flex flex-col justify-between p-5 min-h-[240px] shadow-lg"
              >
                {/* Diagonal Image Cutout */}
                <div
                  className="absolute inset-0 w-full h-full z-0 overflow-hidden"
                  style={{ clipPath: clipStyle }}
                >
                  <Image
                    src={post.image || "/fallback-blog.jpg"}
                    alt={post.title || "Post thumbnail"}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.70]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#162B24] via-[#162B24]/40 to-black/50" />
                </div>

                {/* Top Actions & Tag */}
                <div className="relative z-20 flex items-center justify-between">
                  <span className="inline-block px-3 py-0.5 rounded-full text-[9.5px] font-heading font-extrabold tracking-wider uppercase bg-[#0D1814] !text-[#D9A441] border border-[#D9A441]/40">
                    {post.categoryName || "SAVINGS"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleShare(e, post.slug, post.id || idx)}
                      className="w-7 h-7 rounded-full bg-[#0D1814]/90 border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all"
                      aria-label="Share"
                    >
                      {copiedId === (post.id || idx) ? <Check size={12} className="text-[#D9A441]" /> : <Share2 size={12} />}
                    </button>
                    <button
                      onClick={(e) => toggleBookmark(e, post.id || idx)}
                      className="w-7 h-7 rounded-full bg-[#0D1814]/90 border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all"
                      aria-label="Bookmark"
                    >
                      <Bookmark
                        size={12}
                        className={bookmarkedIds.includes(post.id || idx) ? "fill-[#D9A441] text-[#D9A441]" : ""}
                      />
                    </button>
                  </div>
                </div>

                {/* Bottom Title & Date (Bright White Text) */}
                <div className="relative z-20 max-w-[75%] mt-auto">
                  <h4 className="text-[17px] font-heading font-extrabold uppercase !text-[#FFFFFF] leading-[1.18] tracking-tight group-hover:!text-[#D9A441] transition-colors line-clamp-2 mb-1.5 drop-shadow-md">
                    {post.title}
                  </h4>
                  <span className="text-[10.5px] font-mono font-bold tracking-widest !text-[#A8C3B0] uppercase">
                    {post.date || "OCT 2026"}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* ── 3. BOTTOM ROW: 4 HORIZONTAL CARDS (Cols 1 to 4) ── */}
          {bottomGrid.map((post, idx) => (
            <Link
              key={post.id || idx + 4}
              href={`/blogs/${post.slug || "#"}`}
              className="group relative rounded-[20px] overflow-hidden bg-[#162B24] border-2 border-[#25473C] hover:border-[#D9A441] transition-all duration-300 flex flex-col justify-between p-5 min-h-[225px] shadow-lg"
            >
              {/* Slanted Thumbnail Slice */}
              <div
                className="absolute inset-0 w-full h-full z-0 overflow-hidden"
                style={{ clipPath: "polygon(42% 0, 100% 0, 100% 100%, 22% 100%)" }}
              >
                <Image
                  src={post.image || "/fallback-blog.jpg"}
                  alt={post.title || "Post thumbnail"}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.70]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#162B24] via-[#162B24]/40 to-black/50" />
              </div>

              {/* Top Tag & Actions */}
              <div className="relative z-20 flex items-center justify-between">
                <span className="inline-block px-3 py-0.5 rounded-full text-[9.5px] font-heading font-extrabold tracking-wider uppercase bg-[#0D1814] !text-[#D9A441] border border-[#D9A441]/40">
                  {post.categoryName || "DEALS"}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleShare(e, post.slug, post.id || idx + 4)}
                    className="w-7 h-7 rounded-full bg-[#0D1814]/90 border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all"
                    aria-label="Share"
                  >
                    {copiedId === (post.id || idx + 4) ? <Check size={12} className="text-[#D9A441]" /> : <Share2 size={12} />}
                  </button>
                  <button
                    onClick={(e) => toggleBookmark(e, post.id || idx + 4)}
                    className="w-7 h-7 rounded-full bg-[#0D1814]/90 border border-[#25473C] !text-[#FDFBF7] hover:!text-[#D9A441] flex items-center justify-center transition-all"
                    aria-label="Bookmark"
                  >
                    <Bookmark
                      size={12}
                      className={bookmarkedIds.includes(post.id || idx + 4) ? "fill-[#D9A441] text-[#D9A441]" : ""}
                    />
                  </button>
                </div>
              </div>

              {/* Bottom Title & Date */}
              <div className="relative z-20 max-w-[75%] mt-auto">
                <h4 className="text-[16.5px] font-heading font-extrabold uppercase !text-[#FFFFFF] leading-[1.2] tracking-tight group-hover:!text-[#D9A441] transition-colors line-clamp-2 mb-1.5 drop-shadow-md">
                  {post.title}
                </h4>
                <span className="text-[10.5px] font-mono font-bold tracking-widest !text-[#A8C3B0] uppercase">
                  {post.date || "OCT 2026"}
                </span>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </section>
  );
}