"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShieldCheck, Tag } from "lucide-react";

export default function DeepDiveSlider({ posts = [] }) {
  if (!posts || posts.length === 0) return null;

  // Max 6 to 8 items strictly enforced
  const displayPosts = posts.slice(0, 8);

  // Scoped themes with forced high-contrast text tokens
  const cardThemes = [
    // 1. Sage Green Tint Card
    {
      bg: "bg-[#EBF3EE]",
      border: "border-[#BDD6C4]",
      titleColor: "!text-[#10201B]",
      excerptColor: "!text-[#16241F]/85",
      metaColor: "!text-[#1C352D]",
      subMetaColor: "!text-[#427867]",
      tagBg: "bg-[#1C352D]",
      tagText: "text-[#F8F0E5]",
      chipBg: "bg-[#D8E7DD]",
      chipText: "text-[#10201B]",
      arrowBg: "bg-[#1C352D] text-[#F8F0E5]",
      divider: "border-[#BDD6C4]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(28,53,45,0.12)]",
    },
    // 2. Warm Gold Tint Card
    {
      bg: "bg-[#FAF2E6]",
      border: "border-[#E8D8C0]",
      titleColor: "!text-[#16241F]",
      excerptColor: "!text-[#16241F]/85",
      metaColor: "!text-[#16241F]",
      subMetaColor: "!text-[#8A6A23]",
      tagBg: "bg-[#D9A441]",
      tagText: "text-[#16241F]",
      chipBg: "bg-[#F0DEBD]",
      chipText: "text-[#16241F]",
      arrowBg: "bg-[#D9A441] text-[#16241F]",
      divider: "border-[#E8D8C0]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(217,164,65,0.15)]",
    },
    // 3. Crisp Off-White Surface Card
    {
      bg: "bg-[#FDFBF7]",
      border: "border-[#E2D9CC]",
      titleColor: "!text-[#16241F]",
      excerptColor: "!text-[#16241F]/80",
      metaColor: "!text-[#16241F]",
      subMetaColor: "!text-[#6B7280]",
      tagBg: "bg-[#16241F]",
      tagText: "text-[#FDFBF7]",
      chipBg: "bg-[#EFE7D8]",
      chipText: "text-[#16241F]",
      arrowBg: "bg-[#16241F] text-[#F8F0E5]",
      divider: "border-[#E2D9CC]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(22,36,31,0.08)]",
    },
    // 4. Dark Deep Forest Accent Card
    {
      bg: "bg-[#162B24]",
      border: "border-[#25473C]",
      titleColor: "!text-[#FDFBF7]",
      excerptColor: "!text-[#D5E4D9]",
      metaColor: "!text-[#FDFBF7]",
      subMetaColor: "!text-[#A8C3B0]",
      tagBg: "bg-[#D9A441]",
      tagText: "text-[#16241F]",
      chipBg: "bg-[#1C352D]",
      chipText: "text-[#D9A441]",
      arrowBg: "bg-[#D9A441] text-[#16241F]",
      divider: "border-[#25473C]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(16,32,27,0.3)]",
      isDark: true,
    },
    // 5. Soft Ice Slate Card
    {
      bg: "bg-[#EBF1F5]",
      border: "border-[#CAD6E2]",
      titleColor: "!text-[#10201B]",
      excerptColor: "!text-[#16241F]/85",
      metaColor: "!text-[#10201B]",
      subMetaColor: "!text-[#475569]",
      tagBg: "bg-[#1C352D]",
      tagText: "text-[#F8F0E5]",
      chipBg: "bg-[#D5E1EC]",
      chipText: "text-[#10201B]",
      arrowBg: "bg-[#1C352D] text-[#F8F0E5]",
      divider: "border-[#CAD6E2]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(28,53,45,0.1)]",
    },
    // 6. Warm Coral Tint Card
    {
      bg: "bg-[#FAF0EC]",
      border: "border-[#E8D0C5]",
      titleColor: "!text-[#16241F]",
      excerptColor: "!text-[#16241F]/85",
      metaColor: "!text-[#16241F]",
      subMetaColor: "!text-[#9C3827]",
      tagBg: "bg-[#C1432F]",
      tagText: "text-[#FDFBF7]",
      chipBg: "bg-[#F3DDD3]",
      chipText: "text-[#C1432F]",
      arrowBg: "bg-[#C1432F] text-[#FDFBF7]",
      divider: "border-[#E8D0C5]",
      accentGlow: "hover:shadow-[0_12px_30px_rgba(193,67,47,0.12)]",
    },
  ];

  return (
    <section className="w-full bg-[#F8F0E5] py-12 md:py-16 font-sans">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ─── TOP CONTROL BAR ─── */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="inline-flex items-center justify-between w-full max-w-[860px] px-5 py-2.5 rounded-full bg-[#FDFBF7] border border-[#E2D9CC] shadow-sm mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9A441] animate-pulse" />
              <span className="font-heading text-[12px] sm:text-[13px] font-extrabold tracking-wider !text-[#1C352D] uppercase">
                VESTORIAHUB <span className="text-[#8A8F8C] font-normal mx-1">|</span> CURATED SAVINGS INTELLIGENCE
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-bold !text-[#8A8F8C] tracking-widest uppercase">
              <span className="!text-[#1C352D] font-extrabold">[VERIFIED: 100%]</span>
              <span>•</span>
              <span>DEEP DIVE</span>
            </div>
          </div>

          <h2 className="font-heading text-[26px] sm:text-[34px] md:text-[40px] font-extrabold !text-[#1C352D] tracking-tight leading-tight uppercase">
            Your Shopping Digest, Curated For Maximum Value.
          </h2>
          <p className="text-[13px] sm:text-[14px] font-bold !text-[#6B7280] uppercase tracking-wider mt-1">
            (Active State: Smart Savings & Deal Optimization)
          </p>
        </div>

        {/* ─── ASYMMETRIC BENTO GRID (6-8 Items) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 items-stretch">
          {displayPosts.map((post, idx) => {
            const theme = cardThemes[idx % cardThemes.length];
            
            // Grid spanning logic matching reference composition
            let colSpan = "lg:col-span-4";
            if (idx === 0) colSpan = "lg:col-span-5";
            if (idx === 1) colSpan = "lg:col-span-4";
            if (idx === 2) colSpan = "lg:col-span-3";
            if (idx === 3) colSpan = "lg:col-span-4";
            if (idx === 4) colSpan = "lg:col-span-4";
            if (idx === 5) colSpan = "lg:col-span-4";
            if (idx === 6) colSpan = "lg:col-span-6";
            if (idx === 7) colSpan = "lg:col-span-6";

            return (
              <Link
                key={post.id || post.slug || idx}
                href={`/blogs/${post.slug}`}
                className={`group relative flex flex-col justify-between rounded-[26px] p-5 sm:p-6 border transition-all duration-300 ${colSpan} ${theme.bg} ${theme.border} ${theme.accentGlow} hover:-translate-y-1`}
              >
                <div>
                  {/* Card Header Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`text-[11px] font-heading font-extrabold tracking-widest uppercase ${theme.isDark ? "!text-[#A8C3B0]" : "!text-[#6B7280]"}`}>
                      [VESTORIAHUB]
                    </span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${theme.isDark ? "!text-[#FDFBF7]" : "!text-[#16241F]"}`}>
                      <ShieldCheck size={13} className="text-[#D9A441]" />
                      Verified
                    </span>
                  </div>

                  {/* Card Content Split */}
                  <div className="flex flex-col-reverse sm:flex-row gap-4 justify-between items-start mb-4">
                    <div className="flex-1 pr-1">
                      <h3
                        className={`font-heading text-[18px] sm:text-[20px] font-extrabold uppercase leading-[1.2] tracking-tight mb-2 transition-colors ${theme.titleColor} group-hover:!text-[#D9A441]`}
                      >
                        {post.title}
                      </h3>
                      <p
                        className={`text-[13px] leading-relaxed line-clamp-2 ${theme.excerptColor} font-normal`}
                      >
                        {post.excerpt ||
                          "Exploring verified money-saving strategies and curated shopping analysis."}
                      </p>
                    </div>

                    {/* Image Thumbnail with Overlay Badge */}
                    <div className="relative w-full sm:w-[130px] md:w-[140px] aspect-[4/3] rounded-[18px] overflow-hidden shrink-0 border border-black/10 bg-black/5 shadow-inner">
                      <Image
                        src={post.image || "/fallback-blog.jpg"}
                        alt={post.title || "Deep dive post"}
                        fill
                        sizes="(max-width: 768px) 100vw, 200px"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-108"
                      />
                      {post.categoryName && (
                        <div className="absolute top-2 right-2 z-10">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-heading font-extrabold tracking-wider uppercase shadow-md ${theme.tagBg} ${theme.tagText}`}
                          >
                            {post.categoryName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  {post.categoryName && (
                    <div className="mb-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${theme.chipBg} ${theme.chipText}`}
                      >
                        <Tag size={10} />
                        {post.categoryName}
                      </span>
                    </div>
                  )}
                </div>

                {/* ─── CARD FOOTER ─── */}
                <div
                  className={`flex items-center justify-between pt-3.5 border-t ${theme.divider} mt-auto`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-black/10">
                      {post.author?.avatar ? (
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name || "Author"}
                          fill
                          sizes="30px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[10px] bg-[#1C352D] text-[#F8F0E5]">
                          {(post.author?.name || "V")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col leading-none">
                      <span
                        className={`text-[11px] font-heading font-extrabold uppercase tracking-wider ${theme.metaColor}`}
                      >
                        {post.author?.name || "EDITORIAL TEAM"}
                      </span>
                      <span className={`text-[10px] uppercase font-bold mt-1 ${theme.subMetaColor}`}>
                        {post.date || "OCT 2026"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:rotate-45 shadow-xs ${theme.arrowBg}`}
                  >
                    <ArrowUpRight size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}