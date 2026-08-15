"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ListFilter, ArrowRight, Sparkles, Tag, ShieldCheck, ChevronDown } from "lucide-react";

export default function EditorsPicks({ posts = [], categories = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Stagger offsets to create the "riding the wave" organic layout
  const staggerOffsets = [
    "lg:-translate-y-6",
    "lg:translate-y-4",
    "lg:-translate-y-10",
    "lg:translate-y-12",
    "lg:-translate-y-2",
    "lg:translate-y-8",
  ];

  // Filter & Search Logic capped strictly at 6 posts
  const displayPosts = useMemo(() => {
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

    return result.slice(0, 6);
  }, [posts, selectedCategory, searchQuery]);

  if (!displayPosts || displayPosts.length === 0) return null;

  return (
    <section className="relative w-full py-20 lg:py-28 bg-[#F8F0E5] font-sans overflow-hidden border-b border-[#E2D9CC]">
      
      {/* ── BACKGROUND FLOWING WAVE (Connecting the cards) ── */}
      <div className="absolute top-1/2 left-0 w-[200vw] lg:w-full h-[320px] -translate-y-1/2 pointer-events-none z-0 opacity-40">
        <svg viewBox="0 0 1440 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#A8C3B0]">
          <path 
            d="M-100 150 C 300 350, 600 -50, 1000 150 C 1300 300, 1600 50, 1800 150" 
            stroke="currentColor" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            className="animate-pulse"
          />
          <path 
            d="M-100 170 C 300 370, 600 -30, 1000 170 C 1300 320, 1600 70, 1800 170" 
            stroke="#D9A441" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeDasharray="8 8"
            className="opacity-60"
          />
        </svg>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ── HEADER & CONTROLS ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 lg:mb-24 gap-6 border-b border-[#E2D9CC] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] mb-3">
              <Sparkles size={13} className="text-[#D9A441]" />
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider !text-[#1C352D]">
                Verified Editorial Picks
              </span>
            </div>
            <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading tracking-tight uppercase leading-none">
              <span className="font-light !text-[#427867]">CURATED</span> <span className="font-extrabold !text-[#1C352D]">INSIGHTS</span>
            </h2>
          </div>

          {/* Top Right Controls (Category Filter & Search) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none flex items-center gap-2 pl-9 pr-8 py-2 bg-[#FDFBF7] !text-[#1C352D] rounded-full border border-[#E2D9CC] text-[12px] font-heading font-bold uppercase tracking-wider hover:border-[#BDD6C4] focus:outline-none focus:border-[#D9A441] shadow-xs cursor-pointer transition-colors"
              >
                <option value="All">All Categories</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat.name || cat}>
                    {cat.name || cat}
                  </option>
                ))}
              </select>
              <ListFilter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D9A441] pointer-events-none" />
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F8C] pointer-events-none" />
            </div>

            {/* Search Input Bar */}
            <div className="relative shadow-xs rounded-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8F8C]" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search picks..." 
                className="pl-9 pr-4 py-2 bg-[#FDFBF7] !text-[#16241F] border border-[#E2D9CC] rounded-full text-[12.5px] focus:outline-none focus:border-[#D9A441] w-[200px] sm:w-[220px] placeholder-[#8A8F8C] font-medium"
              />
            </div>
          </div>
        </div>

        {/* ── 6-POST FLOWING GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-center">
          {displayPosts.map((post, idx) => {
            const offsetClass = staggerOffsets[idx % staggerOffsets.length];

            return (
              <Link
                key={post.id || post.slug || idx}
                href={`/blogs/${post.slug || '#'}`}
                className={`group relative flex flex-col p-4 w-full rounded-[2rem] bg-[#162B24] border border-[#25473C] shadow-[0_12px_30px_rgba(16,32,27,0.15)] transition-all duration-500 hover:border-[#D9A441] hover:shadow-[0_18px_40px_rgba(16,32,27,0.3)] ${offsetClass}`}
              >
                {/* 1. Image Showcase Area */}
                <div className="relative w-full aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-[#10201B] mb-2 border border-[#25473C]/60">
                  <Image
                    src={post.image || "/fallback-blog.jpg"}
                    alt={post.title || "Curated Insight Image"}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover opacity-90 group-hover:scale-105 group-hover:opacity-100 transition-all duration-700 ease-out"
                  />
                  
                  {/* Floating Action Button inside image */}
                  <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gradient-to-tr from-[#D9A441] to-[#BE8E34] text-[#16241F] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </div>
                </div>

                {/* Direct Image Title Caption Label */}
                <p className="text-[9.5px] !text-[#8A8F8C] italic px-2 mb-3 truncate">
                  {post.title || "Curated Insight Image"}
                </p>

                {/* 2. Top Category Badge */}
                <div className="px-2 mb-2.5">
                  <span className="inline-flex items-center gap-1 bg-[#D9A441] !text-[#16241F] text-[9.5px] font-heading font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    <Tag size={10} />
                    {post.categoryName || "INSIGHT"}
                  </span>
                </div>

                {/* 3. Article Title */}
                <div className="px-2 mb-5 flex-grow">
                  <h3 className="!text-[#FDFBF7] font-heading font-extrabold text-[19px] leading-[1.22] uppercase tracking-tight line-clamp-2 group-hover:!text-[#D9A441] transition-colors">
                    {post.title}
                  </h3>
                </div>

                {/* 4. Footer & Read Action CTA */}
                <div className="px-2 flex items-center justify-between border-t border-[#25473C] pt-3 mt-auto">
                  <p className="!text-[#A8C3B0] text-[11px] font-medium truncate max-w-[65%]">
                    {post.author?.name || post.authorName || "VestoriaHub"} • {post.date || "OCT 2026"}
                  </p>
                  
                  <span className="px-2.5 py-0.5 border border-[#427867] !text-[#FDFBF7] text-[10px] uppercase font-heading font-bold rounded-full group-hover:bg-[#D9A441] group-hover:!text-[#16241F] group-hover:border-[#D9A441] transition-colors">
                    READ
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