"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, 
  ListFilter, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  ShieldCheck, 
  ChevronDown, 
  Clock, 
  CheckCircle2 
} from "lucide-react";

export default function EditorsPicks({ posts = [], categories = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Brand-aligned fallback content for VestoriaHub
  const fallbackPicks = [
    {
      id: "1",
      title: "The Zero-Fail Checkout Strategy: Stacking Store Codes & Hidden Perks",
      excerpt: "Step-by-step framework to verify discount tiers and combine percentage coupons with free shipping.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
      categoryName: "COUPON HACKS",
      authorName: "VestoriaHub Editorial",
      date: "OCT 28, 2026",
      readTime: "4 Min Read",
      slug: "zero-fail-checkout-strategy",
    },
    {
      id: "2",
      title: "Amazon Price Drop Algorithms: Real Flash Sales vs. Algorithmic Creep",
      excerpt: "How to track true 90-day price floors and avoid inflated MSRP discounts during seasonal promotions.",
      image: "https://images.unsplash.com/photo-1526178613552-2b45c6c302f0?auto=format&fit=crop&q=80&w=800",
      categoryName: "MARKETPLACE",
      authorName: "VestoriaHub Intelligence",
      date: "OCT 26, 2026",
      readTime: "6 Min Read",
      slug: "amazon-price-drop-algorithms",
    },
    {
      id: "3",
      title: "Smart Hardware Buying Guide: Evaluating Tech Specs Over Marketing Hype",
      excerpt: "Where to allocate budget across laptops, monitors, and accessories to maximize longevity per dollar.",
      image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      categoryName: "TECH REVIEWS",
      authorName: "VestoriaHub Tech Lab",
      date: "OCT 24, 2026",
      readTime: "5 Min Read",
      slug: "smart-hardware-buying-guide",
    },
    {
      id: "4",
      title: "Behind the Verification Desk: How We Audit Over 10,000+ Promo Codes",
      excerpt: "A deep dive into our direct retailer test pipelines to eliminate dead coupon codes entirely.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
      categoryName: "TRUST & VERIFICATION",
      authorName: "VestoriaHub Editorial",
      date: "OCT 20, 2026",
      readTime: "3 Min Read",
      slug: "how-we-audit-promo-codes",
    },
    {
      id: "5",
      title: "Sustainable Essentials: Strategic Household Budgeting for High Inflation",
      excerpt: "Cut recurring grocery and pantry costs by utilizing automated price drop alerts and bundled rebates.",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
      categoryName: "DAILY SAVINGS",
      authorName: "VestoriaHub Lifestyle",
      date: "OCT 18, 2026",
      readTime: "5 Min Read",
      slug: "sustainable-essentials-budgeting",
    },
    {
      id: "6",
      title: "Ergonomic Workspace Architecture: Premium Setups on a Curated Budget",
      excerpt: "Discover verified merchant discounts on acoustic isolation, monitor arms, and seating solutions.",
      image: "https://images.unsplash.com/photo-1593062096033-9a26b09da705?auto=format&fit=crop&q=80&w=800",
      categoryName: "WORKSPACE",
      authorName: "VestoriaHub Design",
      date: "OCT 14, 2026",
      readTime: "4 Min Read",
      slug: "ergonomic-workspace-curated-budget",
    },
  ];

  // Stagger offsets for organic wave motion across columns
  const staggerOffsets = [
    "lg:-translate-y-5",
    "lg:translate-y-5",
    "lg:-translate-y-8",
    "lg:translate-y-10",
    "lg:-translate-y-3",
    "lg:translate-y-6",
  ];

  const displayPosts = useMemo(() => {
    let source = posts && posts.length > 0 ? posts : fallbackPicks;
    let result = [...source];

    if (selectedCategory !== "All") {
      result = result.filter(
        (p) => p.categoryName?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q)
      );
    }

    return result.slice(0, 6);
  }, [posts, selectedCategory, searchQuery]);

  if (!displayPosts || displayPosts.length === 0) return null;

  return (
    <section className="relative w-full py-20 lg:py-28 bg-[#F8F0E5] font-sans overflow-hidden border-b border-[#E2D9CC]">
      
      {/* ── BACKGROUND FLOWING S-WAVE ACCENT ── */}
      <div className="absolute top-1/2 left-0 w-[200vw] lg:w-full h-[320px] -translate-y-1/2 pointer-events-none z-0 opacity-40">
        <svg viewBox="0 0 1440 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#A8C3B0]">
          <path 
            d="M-100 150 C 300 350, 600 -50, 1000 150 C 1300 300, 1600 50, 1800 150" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="animate-pulse"
          />
          <path 
            d="M-100 170 C 300 370, 600 -30, 1000 170 C 1300 320, 1600 70, 1800 170" 
            stroke="#D9A441" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeDasharray="6 8"
            className="opacity-70"
          />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ── SECTION HEADER & CONTROLS ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 lg:mb-20 gap-6 border-b border-[#E2D9CC] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] mb-3 shadow-xs">
              <Sparkles size={13} className="text-[#D9A441]" />
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest !text-[#1C352D]">
                Verified Editorial Curation
              </span>
            </div>
            <h2 className="text-[34px] sm:text-[44px] lg:text-[48px] font-heading font-extrabold tracking-tight uppercase leading-none !text-[#1C352D]">
              Editor&apos;s <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] to-[#BE8E34]">Picks</span>
            </h2>
          </div>

          {/* Top Controls (Category Filter Dropdown & Live Search) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none flex items-center gap-2 pl-9 pr-9 py-2.5 bg-[#FDFBF7] !text-[#1C352D] rounded-full border border-[#E2D9CC] text-[12px] font-heading font-bold uppercase tracking-wider hover:border-[#BDD6C4] focus:outline-none focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20 shadow-xs cursor-pointer transition-all"
              >
                <option value="All">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.name || cat}>
                    {cat.name || cat}
                  </option>
                ))}
              </select>
              <ListFilter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D9A441] pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8A8F8C] pointer-events-none" />
            </div>

            {/* Search Input Bar */}
            <div className="relative shadow-xs rounded-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F8C]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter curated guides..." 
                className="pl-9 pr-4 py-2.5 bg-[#FDFBF7] !text-[#16241F] border border-[#E2D9CC] rounded-full text-[12.5px] focus:outline-none focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20 w-[200px] sm:w-[230px] placeholder-[#8A8F8C] font-medium transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── 6-POST ASYMMETRIC WAVE GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {displayPosts.map((post, idx) => {
            const offsetClass = staggerOffsets[idx % staggerOffsets.length];

            return (
              <Link
                key={post.id || post.slug || idx}
                href={`/blogs/${post.slug || '#'}`}
                className={`group relative flex flex-col justify-between p-5 w-full rounded-[24px] bg-[#FDFBF7] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] shadow-[0_4px_16px_rgba(28,53,45,0.04)] hover:shadow-[0_16px_36px_rgba(28,53,45,0.1)] transition-all duration-400 hover:-translate-y-1 ${offsetClass}`}
              >
                <div>
                  {/* 1. Image Thumbnail Canvas with Pill Overlays */}
                  <div className="relative w-full aspect-[16/10] rounded-[18px] overflow-hidden bg-[#F1E7D8] mb-4 border border-[#E2D9CC]/80">
                    <Image
                      src={post.image || "/fallback-blog.jpg"}
                      alt={post.title || "Curated Guide"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10201B]/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Floating Category Tag */}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 bg-[#10201B]/85 backdrop-blur-md !text-[#D9A441] border border-[#25473C] text-[9.5px] font-heading font-extrabold uppercase px-2.5 py-1 rounded-full shadow-md">
                        <Tag size={10} />
                        {post.categoryName || "GUIDE"}
                      </span>
                    </div>

                    {/* Floating Action Disc */}
                    <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#D9A441] text-[#16241F] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-300 shadow-md">
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </div>
                  </div>

                  {/* 2. Metadata Bar */}
                  <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold !text-[#427867]">
                      <ShieldCheck size={13} className="text-[#D9A441]" />
                      Verified Guide
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono !text-[#8A8F8C]">
                      <Clock size={11} />
                      {post.readTime || "4 Min Read"}
                    </span>
                  </div>

                  {/* 3. Article Title */}
                  <h3 className="px-1 font-heading font-extrabold text-[18px] sm:text-[19px] leading-[1.28] !text-[#1C352D] group-hover:!text-[#D9A441] transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>

                  {/* 4. Article Excerpt */}
                  <p className="px-1 text-[13px] !text-[#16241F]/80 leading-relaxed line-clamp-2 font-normal mb-5">
                    {post.excerpt || "Comprehensive strategies and verified store coupon insights from our team."}
                  </p>
                </div>

                {/* 5. Footer & Action Border Row */}
                <div className="px-1 pt-3.5 border-t border-[#E2D9CC] flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[11.5px] font-heading font-bold !text-[#1C352D] truncate max-w-[160px]">
                      {post.authorName || post.author?.name || "VestoriaHub Editorial"}
                    </span>
                    <span className="text-[10px] font-mono !text-[#8A8F8C] uppercase">
                      {post.date || "OCT 2026"}
                    </span>
                  </div>

                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border border-[#BDD6C4] bg-[#EBF3EE] !text-[#1C352D] text-[10.5px] font-heading font-extrabold uppercase group-hover:bg-[#1C352D] group-hover:!text-[#F8F0E5] group-hover:border-[#1C352D] transition-all duration-200">
                    <span>Read</span>
                    <ArrowRight size={11} strokeWidth={2.5} />
                  </span>
                </div>

              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}