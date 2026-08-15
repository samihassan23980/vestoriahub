import React from "react";
import Link from "next/link";
import { 
  AlertCircle, 
  Search as SearchIcon, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Zap,
  Sparkles,
  BookOpen,
  ArrowRight
} from "lucide-react";
import AllBlogsInfiniteFeed from "@/app/Components/AllBlogsInfiniteFeed";

// ─── DATA FETCHING ────────────────────────────────────────────────────────────
async function getAllBlogs() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/blogs?page=1&limit=12`, {
      next: {
        revalidate: 3600,
        tags: ["blogs"],
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export const metadata = {
  title: "Shopping Guides, Deal Strategies & Reviews | VestoriaHub",
  description:
    "Explore expert buying guides, verified promo code breakdowns, and honest product reviews. Smart shopping advice to help you maximize your savings with VestoriaHub.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Shopping Guides & Deal Insights | VestoriaHub",
    description:
      "Expert money-saving strategies, verified coupon breakdowns, and data-backed product reviews.",
    url: "https://www.vestoriahub.com/blogs",
    siteName: "VestoriaHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shopping Guides & Deal Insights | VestoriaHub",
    description:
      "Expert money-saving strategies, verified coupon breakdowns, and data-backed product reviews.",
  },
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default async function BlogsIndexPage() {
  const data = await getAllBlogs();

  const initialBlogs = data?.blogs || [];
  const hasNextPage = data ? data.page < data.totalPages : false;

  // ── ERROR / EMPTY STATE ──
  if (!data || initialBlogs.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#F8F0E5] px-6 text-center font-sans text-[#16241F]">
        <div className="w-20 h-20 rounded-3xl bg-[#FFFFFF] flex items-center justify-center mb-6 border border-[#E2D9CC] shadow-xs">
          <AlertCircle size={36} className="text-[#C1432F]" />
        </div>
        <h1 className="text-[30px] md:text-[38px] font-heading font-extrabold text-[#10201B] mb-3 tracking-tight">
          No Articles Found
        </h1>
        <p className="max-w-md text-[#6B7280] font-normal text-[15px] leading-relaxed mb-8">
          We couldn&apos;t load the editorial feed right now. Please check back shortly for updated guides and deal insights.
        </p>
        <Link
          href="/"
          className="bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] font-heading font-bold text-[14px] px-8 py-3.5 rounded-full transition-all shadow-xs"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F0E5] pb-24 font-sans text-[#16241F]">
      
      {/* ── ALL BLOGS HERO (VESTORIAHUB DEEP FOREST S-WAVE THEME) ── */}
      <section className="relative w-full bg-[#10201B] border-b border-[#25473C] overflow-hidden py-14 lg:py-20 z-10 text-[#FDFBF7]">
        
        {/* Background S-Wave Flow */}
        <div className="absolute top-1/2 left-0 w-[200vw] lg:w-full h-[320px] -translate-y-1/2 pointer-events-none z-0 opacity-20">
          <svg viewBox="0 0 1440 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#A8C3B0]">
            <path
              d="M-100 150 C 300 350, 600 -50, 1000 150 C 1300 300, 1600 50, 1800 150"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M-100 170 C 300 370, 600 -30, 1000 170 C 1300 320, 1600 70, 1800 170"
              stroke="#D9A441"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 8"
              className="opacity-60"
            />
          </svg>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-10 w-[500px] h-[500px] bg-[#D9A441]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-[#1C352D] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* ── LEFT COLUMN: EDITORIAL HEADLINE & SEARCH (7 COLS) ── */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-2 bg-[#162B24] border border-[#25473C] text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-xs">
                <Sparkles size={13} />
                <span>VestoriaHub Editorial Journal</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-[#FDFBF7] text-[36px] sm:text-[48px] lg:text-[56px] font-heading font-extrabold tracking-tight leading-[1.08] mb-5">
                Discover. Learn. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
                  Shop Smarter Every Day.
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-[#D5E4D9] text-[15px] md:text-[16.5px] max-w-[560px] mb-8 leading-relaxed font-normal border-l-2 border-[#D9A441] pl-4">
                Explore actionable checkout strategies, tested promo code guides, and honest product reviews — curated to ensure you never overpay online.
              </p>

              {/* Minimal Search Bar */}
              <div className="w-full max-w-[520px] mb-6">
                <div className="bg-[#162B24] p-1.5 rounded-2xl border border-[#25473C] shadow-sm flex items-center focus-within:border-[#D9A441] transition-all">
                  <SearchIcon
                    size={18}
                    className="ml-3 text-[#8A8F8C] shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Search shopping guides, reviews & discount tips…"
                    className="w-full h-[44px] px-3 bg-transparent text-[13.5px] text-[#FDFBF7] placeholder:text-[#8A8F8C] font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Category Quick Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {["Coupon Hacks", "Marketplace Trends", "Tech Reviews", "Budgeting Tips"].map(
                  (cat) => (
                    <Link
                      key={cat}
                      href={`/blogs?category=${encodeURIComponent(cat)}`}
                      className="text-[11.5px] font-heading font-semibold text-[#A8C3B0] bg-[#162B24] border border-[#25473C] px-3.5 py-1.5 rounded-full hover:border-[#D9A441] hover:text-[#FDFBF7] transition-all shadow-xs"
                    >
                      {cat}
                    </Link>
                  )
                )}
              </div>
            </div>

            {/* ── RIGHT COLUMN: SHOPPING STRATEGY HIGHLIGHT CARDS (5 COLS) ── */}
            <div className="lg:col-span-5 w-full flex flex-col gap-3.5 relative z-10">
              
              {/* Pillar Header */}
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-[#D9A441] fill-[#D9A441]" />
                <h3 className="text-[#FDFBF7] font-heading font-extrabold text-[15px] uppercase tracking-wider">
                  The Smart Shopper Blueprint
                </h3>
              </div>

              {/* Strategy Card 1 */}
              <div className="bg-[#162B24]/90 rounded-2xl p-4.5 border border-[#25473C] hover:border-[#D9A441]/50 transition-all duration-300 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#10201B] border border-[#25473C] flex items-center justify-center shrink-0 text-[#D9A441]">
                    <Layers size={17} />
                  </div>
                  <div>
                    <h4 className="text-[#FDFBF7] font-heading font-bold text-[14.5px] mb-0.5">
                      Stack Verified Savings
                    </h4>
                    <p className="text-[#A8C3B0] text-[12.5px] font-normal leading-relaxed">
                      Layer site-wide promotional sales on top of verified merchant coupons at checkout for double-tier discount compounding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategy Card 2 */}
              <div className="bg-[#162B24]/90 rounded-2xl p-4.5 border border-[#25473C] hover:border-[#D9A441]/50 transition-all duration-300 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#10201B] border border-[#25473C] flex items-center justify-center shrink-0 text-[#D9A441]">
                    <Clock size={17} />
                  </div>
                  <div>
                    <h4 className="text-[#FDFBF7] font-heading font-bold text-[14.5px] mb-0.5">
                      Track True Price Floors
                    </h4>
                    <p className="text-[#A8C3B0] text-[12.5px] font-normal leading-relaxed">
                      Avoid inflated MSRP markups by following our price-history reviews and cyclical 90-day retail drop algorithms.
                    </p>
                  </div>
                </div>
              </div>

              {/* Strategy Card 3 */}
              <div className="bg-[#162B24]/90 rounded-2xl p-4.5 border border-[#25473C] hover:border-[#D9A441]/50 transition-all duration-300 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-[#10201B] border border-[#25473C] flex items-center justify-center shrink-0 text-[#D9A441]">
                    <ShieldCheck size={17} />
                  </div>
                  <div>
                    <h4 className="text-[#FDFBF7] font-heading font-bold text-[14.5px] mb-0.5">
                      Daily Test Verification
                    </h4>
                    <p className="text-[#A8C3B0] text-[12.5px] font-normal leading-relaxed">
                      Our desk manually checks checkout codes with direct retailer networks to guarantee zero expired promos at checkout.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ── THE INFINITE EDITORIAL FEED ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 relative z-20">
        <AllBlogsInfiniteFeed
          initialBlogs={initialBlogs}
          initialHasMore={hasNextPage}
        />
      </div>

    </main>
  );
}