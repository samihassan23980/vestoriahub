import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function DeepDiveCard({ post, index = 0 }) {
  const isFirst = index === 0;

  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group relative flex flex-col justify-center items-center w-full overflow-hidden rounded-[24px] bg-[#1A1A1A] border border-[#1A1A1A]/10 shadow-[0_8px_32px_rgba(26,26,26,0.08)] hover:shadow-[0_16px_48px_rgba(6,80,71,0.25)] transition-all duration-700 font-sans"
      style={{ minHeight: isFirst ? 500 : 400 }}
    >
      {/* ── Background Image ─────────────────────────────────────── */}
      <Image
        src={post.image || "/fallback-blog.jpg"}
        alt={post.title}
        fill
        loading={isFirst ? "eager" : "lazy"}
        priority={isFirst}
        sizes="(max-width: 768px) 100vw, 80vw"
        className="object-cover opacity-60 group-hover:opacity-50 group-hover:scale-105 transition-all duration-1000 ease-out"
      />

      {/* ── Spotlight Gradient Overlays ──────────────────────────── */}
      {/* Mimics the dark vignette seen in the reference image to make the white text pop */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/30 via-transparent to-[#1A1A1A]/80 z-0" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#1A1A1A]/40 to-[#1A1A1A]/90 z-0 opacity-80 group-hover:opacity-90 transition-opacity duration-700" />

      {/* ── Centered Content Panel ───────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 md:px-16 lg:px-24 w-full max-w-[900px] transform group-hover:-translate-y-2 transition-transform duration-500 ease-out">
        {/* Category Tag */}
        <span className="text-[#ECF9F9] text-[11px] md:text-[13px] font-extrabold uppercase tracking-[0.2em] mb-4 md:mb-6 drop-shadow-md">
          {post.categoryName || "Deep Dive"}
        </span>

        {/* Huge Centered Title */}
        <h3
          className={`font-sans font-extrabold text-[#FFFFFF] leading-[1.15] mb-6 md:mb-8 tracking-tight drop-shadow-lg ${
            isFirst
              ? "text-[32px] md:text-[48px] lg:text-[56px]"
              : "text-[28px] md:text-[40px] lg:text-[48px]"
          }`}
        >
          {post.title}
        </h3>

        {/* Optional Excerpt for the first card (to keep subsequent cards cleaner) */}
        {isFirst && post.excerpt && (
          <p className="text-[#ECF9F9]/80 text-[15px] md:text-[18px] font-medium line-clamp-2 max-w-[700px] mb-8 drop-shadow-md">
            {post.excerpt}
          </p>
        )}

        {/* Meta Row: Avatar, Name, Dot, Date (Matching Reference Image) */}
        <div className="flex items-center gap-3 text-[#ECF9F9]/90 text-[13px] md:text-[15px] font-medium mt-auto">
          {/* Avatar */}
          <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden bg-[#ECF9F9]/10 border-[1.5px] border-[#FFFFFF]/20 shadow-md">
            {post.author?.avatar ? (
              <Image
                src={post.author.avatar}
                alt={post.author.name || "Author"}
                fill
                loading="lazy"
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#FFFFFF] font-bold text-[12px] md:text-[14px]">
                {(post.author?.name || "E")[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Name */}
          <span className="font-bold text-[#FFFFFF]">
            {post.author?.name || "Editorial Team"}
          </span>

          {/* Separator Dot */}
          <span className="opacity-50 text-[10px] md:text-[12px]">●</span>

          {/* Date */}
          <span className="opacity-90">{post.date || "Just now"}</span>
        </div>
      </div>
    </Link>
  );
}
