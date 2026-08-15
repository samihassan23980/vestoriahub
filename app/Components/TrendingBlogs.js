"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, ChevronDown, Sparkles, Tag, ShieldCheck } from "lucide-react";

export default function TrendingBlogs({ posts = [], categories = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Staggered heights to create dynamic visual masonry depth
  const imageHeights = [
    "h-[190px]", // 0: Compact horizontal
    "h-[310px]", // 1: Tall editorial showcase
    "h-[230px]", // 2: Medium square-ish
    "h-[270px]", // 3: Mid vertical
    "h-[210px]", // 4: Standard portrait
    "h-[170px]", // 5: Compact banner
    "h-[290px]", // 6: Tall vertical
    "h-[230px]", // 7: Standard
  ];

  // Filter & Search Logic
  const filteredPosts = useMemo(() => {
    let result = posts && posts.length > 0 ? [...posts] : [];

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

    return result.slice(0, 8);
  }, [posts, selectedCategory, searchQuery]);

  if (!filteredPosts || filteredPosts.length === 0) return null;

  return (
    <section className="relative w-full py-16 lg:py-24 bg-[#F8F0E5] font-sans border-b border-[#E2D9CC] overflow-hidden">
      
      {/* ─── BACKGROUND SUBTLE GEOMETRIC GRID (VestoriaHub Accent) ─── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="vestoriaGridPattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1C352D" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vestoriaGridPattern)" />
        </svg>
      </div>

      {/* ─── DYNAMIC FLOWING SAVINGS WAVE (Savings Gold & Forest Green Glow) ─── */}
      <div className="absolute top-[48%] left-0 w-full overflow-hidden leading-none z-0 pointer-events-none -translate-y-1/2">
        <svg viewBox="0 0 1440 250" className="w-full h-auto opacity-75" preserveAspectRatio="none">
          {/* Outer Soft Gold Glow */}
          <path
            fill="none"
            stroke="#D9A441"
            strokeWidth="20"
            strokeLinecap="round"
            opacity="0.25"
            d="M-20,120 C320,250, 420,-50, 840,120 C1160,250, 1300,50, 1460,80"
            filter="blur(10px)"
          />
          {/* Inner Sharp Forest Green Vector */}
          <path
            fill="none"
            stroke="#1C352D"
            strokeWidth="3.5"
            strokeLinecap="round"
            d="M-20,120 C320,250, 420,-50, 840,120 C1160,250, 1300,50, 1460,80"
          />
          {/* Directional Indicator Arrow */}
          <path
            fill="none"
            stroke="#D9A441"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M1420,50 L1460,80 L1420,110"
          />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        
        {/* ─── HEADER CONTROLS (Editorial Brand Header & Search/Filters) ─── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-6 pb-6 border-b border-[#E2D9CC]">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] mb-3">
              <Sparkles size={13} className="text-[#D9A441]" />
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider !text-[#1C352D]">
                Curated Deal Intelligence
              </span>
            </div>
            <h2 className="text-[32px] md:text-[46px] font-heading font-extrabold !text-[#1C352D] uppercase leading-none tracking-tight">
              Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] to-[#BE8E34]">Insights</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none bg-[#FDFBF7] border border-[#E2D9CC] hover:border-[#BDD6C4] rounded-full pl-5 pr-10 py-2.5 text-[12.5px] font-heading font-bold uppercase tracking-wider !text-[#1C352D] cursor-pointer focus:outline-none focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/20 shadow-xs transition-all"
              >
                <option value="All">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.name || cat}>
                    {cat.name || cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-4 top-1/2 -translate-y-1/2 !text-[#8A8F8C] pointer-events-none"
              />
            </div>
            
            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 border border-[#E2D9CC] rounded-full px-4 py-2 bg-[#FDFBF7] shadow-xs focus-within:border-[#D9A441] focus-within:ring-2 focus-within:ring-[#D9A441]/20 transition-all w-full sm:w-[240px]">
              <Search size={15} className="!text-[#8A8F8C] shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trending..." 
                className="bg-transparent text-[13px] outline-none !text-[#16241F] placeholder-[#8A8F8C] w-full font-medium"
              />
            </div>
          </div>
        </div>

        {/* ─── STAGGERED MASONRY GRID (Strictly 8 Items) ─── */}
        <div className="columns-1 sm:columns-2 lg:columns-4 gap-6 lg:gap-8 space-y-6 lg:space-y-8 relative z-10">
          
          {filteredPosts.map((post, idx) => (
            <Link
              key={post.id || post.slug || idx}
              href={`/blogs/${post.slug || '#'}`}
              className="break-inside-avoid block group relative w-full"
            >
              <div className="bg-[#FDFBF7] rounded-[2.2rem] p-3.5 shadow-[0_10px_30px_rgba(28,53,45,0.05)] hover:shadow-[0_18px_40px_rgba(28,53,45,0.12)] transition-all duration-300 h-full flex flex-col border border-[#E2D9CC] group-hover:border-[#BDD6C4] hover:-translate-y-1.5">
                
                {/* Upper Image Showcase Container */}
                <div className={`relative w-full rounded-[1.8rem] overflow-hidden bg-[#F1E7D8] ${imageHeights[idx % 8]} border border-[#E2D9CC]/60`}>
                  <Image
                    src={post.image || "/fallback-blog.jpg"}
                    alt={post.title || "Insight Guide"}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  
                  {/* Action Button Accent (Leading Card) */}
                  {idx === 0 && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-tr from-[#D9A441] to-[#BE8E34] text-[#16241F] rounded-full flex items-center justify-center shadow-lg shadow-[#D9A441]/30 z-20 hover:scale-110 transition-transform">
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </div>
                  )}

                  {/* Absolute Floating Category Tag */}
                  <div className="absolute -bottom-3.5 left-3.5 z-20">
                    <span className="inline-flex items-center gap-1 bg-[#1C352D] !text-[#FDFBF7] text-[9.5px] font-heading font-extrabold uppercase px-3 py-1 rounded-full shadow-[0_4px_12px_rgba(28,53,45,0.25)] tracking-wider border border-[#A8C3B0]/30">
                      <Tag size={10} className="text-[#D9A441]" />
                      {post.categoryName || "SAVINGS"}
                    </span>
                  </div>
                </div>

                {/* Bottom Card Content Area */}
                <div className="pt-7 pb-2 px-2.5 flex flex-col flex-grow">
                  <h3 className="!text-[#1C352D] font-heading font-bold text-[17px] lg:text-[19px] leading-[1.28] uppercase mb-5 group-hover:!text-[#D9A441] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#E2D9CC]">
                    <p className="text-[11px] !text-[#8A8F8C] font-semibold tracking-wide truncate max-w-[130px]">
                      {post.authorName || post.author?.name || "VestoriaHub"} • {post.date || "OCT 2026"}
                    </p>
                    
                    <button 
                      type="button"
                      aria-label="Read Guide"
                      className="border border-[#1C352D]/30 rounded-full px-3.5 py-1 text-[10px] font-heading font-extrabold tracking-widest uppercase !text-[#1C352D] group-hover:bg-[#1C352D] group-hover:!text-[#FDFBF7] group-hover:border-[#1C352D] transition-all duration-200"
                    >
                      Read
                    </button>
                  </div>
                </div>

              </div>
            </Link>
          ))}

        </div>

      </div>
    </section>
  );
}