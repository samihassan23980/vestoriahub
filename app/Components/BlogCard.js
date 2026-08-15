import React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, ArrowRight, User } from "lucide-react";

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

export default function BlogCard({ blog, layout = "grid", priority = false }) {
  const imageUrl = blog.featuredImage?.url || "";

  // Layout-specific styling mapping
  const containerClasses = {
    featured:
      "flex-col lg:flex-row min-h-[400px] border-none shadow-[0_20px_40px_rgba(6,80,71,0.06)]",
    grid: "flex-col h-full hover:shadow-[0_20px_40px_rgba(6,80,71,0.08)]",
    list: "flex-col sm:flex-row hover:shadow-[0_15px_30px_rgba(6,80,71,0.05)]",
  };

  return (
    <article
      className={`group flex overflow-hidden rounded-[24px] border border-[#1A1A1A]/5 bg-white transition-all duration-500 ease-in-out hover:border-[#065047]/20 ${containerClasses[layout]}`}
    >
      {/* ── Thumbnail Section ── */}
      <Link
        href={`/blogs/${blog.slug}`}
        className={`relative block overflow-hidden bg-[#ECF9F9] shrink-0 ${layout === "featured" ? "lg:w-1/2" : layout === "list" ? "sm:w-[300px]" : "w-full aspect-[16/10]"}`}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={blog.featuredImage?.alt || blog.title}
            fill
            priority={priority}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#065047]/20">
            <BookOpen size={48} />
          </div>
        )}

        {blog.category?.name && (
          <span className="absolute left-5 top-5 z-20 rounded-[8px] bg-[#065047] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
            {blog.category.name}
          </span>
        )}
      </Link>

      {/* ── Content Section ── */}
      <div
        className={`flex flex-1 flex-col justify-between ${layout === "featured" ? "p-10 md:p-12" : "p-6"}`}
      >
        <div>
          {/* Metadata */}
          <div className="mb-4 flex items-center gap-4 text-[12px] font-bold text-[#1A1A1A]/50">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-[#065047]" />
              {formatDate(blog.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              {blog.readTimeMinutes || 3} min read
            </span>
          </div>

          {/* Title */}
          <Link href={`/blogs/${blog.slug}`}>
            <h3
              className={`font-bold text-[#1A1A1A] transition-colors group-hover:text-[#065047] leading-[1.2] mb-4 ${layout === "featured" ? "text-[32px]" : "text-[20px]"}`}
            >
              {blog.title}
            </h3>
          </Link>

          {/* Excerpt */}
          <p className="mb-6 text-[15px] leading-relaxed text-[#1A1A1A]/70 line-clamp-3">
            {blog.excerpt}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1A1A1A]/5 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#065047]/10 text-[#065047]">
              <User size={16} />
            </div>
            <span className="text-[13px] font-bold text-[#1A1A1A]">
              {blog.author?.name || "Editorial Team"}
            </span>
          </div>

          <Link
            href={`/blogs/${blog.slug}`}
            className="flex items-center gap-2 text-[13px] font-extrabold text-[#065047] transition-all hover:gap-3"
          >
            Read Article <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}
