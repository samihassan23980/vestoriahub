import React from "react";
import Link from "next/link";
import HeroCarouselClient from "./HeroCarouselClient";
import { Search, ShieldCheck, Sparkles, TrendingUp, Tag, ArrowRight } from "lucide-react";

async function getHeroSlides() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(
      `${baseUrl}/api/admin/hero-slides?live=true&status=active&limit=20&page=1`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data.slides)
      ? data.slides.filter((slide) => {
          const statusAllowed =
            slide.status === "active" || slide.status === "scheduled";
          const hasDesktopMedia = Boolean(slide.media?.desktopUrl);
          return statusAllowed && hasDesktopMedia;
        })
      : [];
  } catch (error) {
    console.error("Failed to fetch hero slides on server:", error);
    return [];
  }
}

export default async function HeroCarousel() {
  const slides = await getHeroSlides();

  // If live active slides exist, render the carousel client
  if (slides && slides.length >= 2) {
    return <HeroCarouselClient slides={slides} />;
  }

  // Fallback Hero UI: Signature Deep Forest & High-Contrast Warm Cream Canvas
  return (
    <section className="relative w-full bg-[#10201B] overflow-hidden pt-14 md:pt-20 lg:pt-24 pb-24 md:pb-32 lg:pb-36 font-sans">
      


      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-[840px] mx-auto text-center">
          
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2.5 bg-[#162B24] border border-[#25473C] px-4 py-1.5 rounded-full text-[12px] md:text-[13px] font-semibold mb-6 shadow-md backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D9A441] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D9A441]"></span>
            </span>
            <span className="text-[#FDFBF7] font-bold tracking-wide">100% Tested & Verified</span>
            <span className="text-[#A8C3B0]">•</span>
            <span className="text-[#E2D9CC]">Over 10,000+ Active Promo Codes</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-heading text-[38px] sm:text-[52px] md:text-[64px] lg:text-[70px] font-extrabold !text-[#FDFBF7] tracking-tight leading-[1.08] mb-6">
            Shop Smarter. <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B558] via-[#F8F0E5] to-[#D9A441] drop-shadow-sm">
              Spend Lighter.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="!text-[#E2D9CC] text-[16px] sm:text-[18px] md:text-[20px] leading-[1.65] max-w-[680px] mx-auto mb-9 font-normal">
            Discover strictly verified promo codes, hand-picked marketplace discounts, and shopping guides so you never pay retail price again.
          </p>

          {/* ─── SEARCH BAR ─── */}
          <form 
            action="/stores" 
            method="GET"
            className="relative w-full max-w-[620px] mx-auto group mb-7"
          >
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-[#A8C3B0] group-focus-within:text-[#D9A441] transition-colors" />
            </div>

            <input
              type="text"
              name="search"
              aria-label="Search for brand coupons, products, or stores"
              placeholder="Search stores, brands, or coupons (e.g. Nike, Amazon)..."
              className="block w-full h-[62px] sm:h-[66px] pl-14 pr-[136px] sm:pr-[152px] rounded-full border-2 border-[#25473C] bg-[#162B24] text-[#FDFBF7] placeholder-[#A8C3B0]/80 text-[15px] sm:text-[16px] focus:outline-none focus:border-[#D9A441] focus:ring-4 focus:ring-[#D9A441]/20 shadow-[0_12px_32px_rgba(0,0,0,0.45)] transition-all"
            />

            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-5 sm:px-7 bg-gradient-to-r from-[#D9A441] to-[#BE8E34] hover:from-[#E5B558] hover:to-[#D9A441] text-[#16241F] font-heading font-bold text-[14px] sm:text-[15px] rounded-full shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Search</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </form>

          {/* ─── POPULAR TRENDING CHIPS ─── */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-[12.5px]">
            <span className="flex items-center gap-1.5 font-bold text-[#D9A441]">
              <TrendingUp size={14} className="text-[#D9A441]" />
              Trending:
            </span>
            {["Amazon Deals", "Nike 20% Off", "Electronics", "Fashion Sales", "Free Shipping"].map((tag, idx) => (
              <Link
                key={idx}
                href={`/stores?q=${encodeURIComponent(tag)}`}
                className="bg-[#162B24] hover:bg-[#1C352D] text-[#FDFBF7] border border-[#25473C] hover:border-[#D9A441] px-3.5 py-1 rounded-full transition-all duration-150 text-[12.5px] font-medium"
              >
                {tag}
              </Link>
            ))}
          </div>

          {/* ─── KEY VALUE PILLARS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-10 border-t border-[#25473C]/80 max-w-[760px] mx-auto text-left">
            <div className="flex items-center gap-3.5 bg-[#162B24]/70 p-3.5 rounded-2xl border border-[#25473C]">
              <div className="w-10 h-10 rounded-xl bg-[#10201B] flex items-center justify-center shrink-0 border border-[#25473C]">
                <ShieldCheck size={20} className="text-[#D9A441]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold !text-[#FDFBF7]">Verified Codes</h4>
                <p className="text-[12px] !text-[#A8C3B0]">Tested before publishing</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#162B24]/70 p-3.5 rounded-2xl border border-[#25473C]">
              <div className="w-10 h-10 rounded-xl bg-[#10201B] flex items-center justify-center shrink-0 border border-[#25473C]">
                <Sparkles size={20} className="text-[#D9A441]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold !text-[#FDFBF7]">Curated Drops</h4>
                <p className="text-[12px] !text-[#A8C3B0]">Genuine daily price cuts</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-[#162B24]/70 p-3.5 rounded-2xl border border-[#25473C]">
              <div className="w-10 h-10 rounded-xl bg-[#10201B] flex items-center justify-center shrink-0 border border-[#25473C]">
                <Tag size={20} className="text-[#D9A441]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold !text-[#FDFBF7]">100% Free</h4>
                <p className="text-[12px] !text-[#A8C3B0]">No sign-up required</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── SMOOTH SVG BOTTOM WAVE TRANSITION (Deep Forest -> Warm Cream) ─── */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-20">
        <svg
          className="relative block w-full h-[40px] sm:h-[60px] lg:h-[80px]"
          viewBox="0 0 1440 120"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0,32L60,42.7C120,53,240,75,360,74.7C480,75,600,53,720,48C840,43,960,53,1080,64C1200,75,1320,85,1380,90.7L1440,96L1440,120L1380,120C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120L0,120Z"
            fill="#F8F0E5"
          />
        </svg>
      </div>
    </section>
  );
}