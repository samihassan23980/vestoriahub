import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Tag,
  ArrowUpRight,
  Search as SearchIcon,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Store as StoreIcon,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import StoreSearch from "../Components/StoreSearch";

export const revalidate = 60;
export const metadata = {
  title: "Browse Top Stores & Brands – Verified Coupons & Deals",
  description:
    "Browse 500+ top brands and stores with verified coupon codes, exclusive deals, signup bonuses, and cashback offers — hand-checked before publishing and updated daily. Start saving on every purchase.",
  keywords:
    "top stores coupons, brand deals, verified promo codes, signup bonus offers, cashback deals, discount codes, online store savings",
  alternates: { canonical: "/stores" },
  openGraph: {
    title: "Browse Top Stores & Brands – Verified Coupons & Deals",
    description:
      "Discover verified coupons, exclusive deals, and signup bonuses from 500+ top-rated global brands. Checked before publishing, updated daily.",
    url: "https://www.vestoriahub.com/stores",
    siteName: "VestoriaHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Top Stores & Brands – Verified Coupons & Deals",
    description:
      "Verified coupons, exclusive deals & signup bonuses from 500+ top brands. Updated daily.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

async function getStores(searchQuery) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const res = await fetch(
      `${baseUrl}/api/public/stores?limit=50&page=1&search=${encodeURIComponent(searchQuery)}`,
      {
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    return null;
  }
}

export default async function StoresPage({ searchParams }) {
  const params = await searchParams;
  const search = params?.search || "";
  const data = await getStores(search);
  const stores = data?.stores || [];
  const isError = !data;

  const totalOffers = stores.reduce(
    (sum, store) => sum + (store.activeOffers || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-[#F8F0E5] font-sans pb-24">
      {/* ── HERO SECTION WITH S-WAVE ACCENT ── */}
      <section className="relative bg-[#10201B] overflow-hidden border-b border-[#25473C]">
        {/* Background S-Wave */}
        <div className="absolute top-1/2 left-0 w-[200vw] lg:w-full h-[320px] -translate-y-1/2 pointer-events-none z-0 opacity-25">
          <svg
            viewBox="0 0 1440 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full text-[#A8C3B0]"
          >
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
        <div className="absolute -right-28 -top-28 w-[420px] h-[420px] rounded-full bg-[#D9A441]/10 blur-[140px] pointer-events-none" />
        <div className="absolute -left-20 bottom-[-100px] w-[360px] h-[360px] rounded-full bg-[#1C352D] blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1360px] mx-auto px-6 pt-20 pb-20 md:pt-28 md:pb-24 text-center z-10">
          <div className="inline-flex items-center gap-2 bg-[#162B24] !text-[#D9A441] border border-[#25473C] text-[11.5px] font-heading font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <ShieldCheck size={14} />
            <span>{stores.length}+ Verified Brand Partners</span>
          </div>

          <h1 className="!text-[#FDFBF7] text-[38px] md:text-[58px] font-heading font-extrabold tracking-tight leading-[1.08] mb-5">
            Explore Top Stores & Brands,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
              verified coupons inside.
            </span>
          </h1>

          <p className="!text-[#D5E4D9] text-[15px] md:text-[17px] max-w-[620px] mx-auto mb-10 leading-relaxed font-normal">
            Explore tested promo codes, store discounts, and exclusive perks across trusted global retailers. Every deal is hand-verified before checkout.
          </p>

          <div className="max-w-[620px] mx-auto mb-10">
            <Suspense
              fallback={
                <div className="h-[52px] w-full rounded-full bg-[#162B24] border border-[#25473C] animate-pulse" />
              }
            >
              <StoreSearch />
            </Suspense>
          </div>

          {!isError && (
            <div className="inline-flex items-center justify-center gap-8 md:gap-14 bg-[#162B24]/80 border border-[#25473C] px-8 py-3.5 rounded-2xl shadow-sm">
              <div className="text-center">
                <div className="text-[24px] md:text-[28px] font-heading font-extrabold leading-none !text-[#FDFBF7] mb-1">
                  {stores.length}
                </div>
                <div className="text-[10.5px] uppercase tracking-widest font-heading font-bold !text-[#A8C3B0]">
                  Stores Listed
                </div>
              </div>

              <div className="w-[1px] h-[28px] bg-[#25473C]" />

              <div className="text-center">
                <div className="text-[24px] md:text-[28px] font-heading font-extrabold leading-none !text-[#D9A441] mb-1">
                  {totalOffers}
                </div>
                <div className="text-[10.5px] uppercase tracking-widest font-heading font-bold !text-[#A8C3B0]">
                  Live Offers
                </div>
              </div>

              <div className="w-[1px] h-[28px] bg-[#25473C]" />

              <div className="text-center">
                <div className="text-[24px] md:text-[28px] font-heading font-extrabold leading-none !text-[#34D399] mb-1">
                  100%
                </div>
                <div className="text-[10.5px] uppercase tracking-widest font-heading font-bold !text-[#A8C3B0]">
                  Verified
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── STORES DIRECTORY CONTENT ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        {/* Error State */}
        {isError && (
          <div className="py-20 text-center bg-[#FDFBF7] rounded-3xl border border-[#E2D9CC] shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#FAF0EC] border border-[#E8D0C5] flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-[#C1432F]" />
            </div>
            <h2 className="!text-[#1C352D] font-heading font-bold text-[20px] mb-2">
              Unable to load stores
            </h2>
            <p className="!text-[#6B7280] text-[13.5px] mb-6 max-w-sm mx-auto">
              Something went wrong while fetching the merchant list. Refresh or try again.
            </p>
            <Link
              href="/stores"
              className="inline-flex items-center gap-1.5 bg-[#1C352D] !text-[#FDFBF7] text-[13px] font-heading font-bold px-6 py-2.5 rounded-full hover:bg-[#10201B] transition-colors shadow-xs"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!isError && stores.length === 0 && (
          <div className="py-20 text-center bg-[#FDFBF7] rounded-3xl border border-[#E2D9CC] shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center mx-auto mb-4">
              <SearchIcon className="w-7 h-7 text-[#1C352D]" />
            </div>
            <h2 className="!text-[#1C352D] font-heading font-bold text-[20px] mb-2">
              No stores found
            </h2>
            <p className="!text-[#6B7280] text-[13.5px] mb-6 max-w-sm mx-auto">
              {search
                ? `No merchants matching "${search}". Try searching with another brand name.`
                : "No store partners are available right now."}
            </p>
            <Link
              href="/stores"
              className="inline-flex items-center gap-1.5 bg-[#1C352D] !text-[#FDFBF7] text-[13px] font-heading font-bold px-6 py-2.5 rounded-full hover:bg-[#10201B] transition-colors shadow-xs"
            >
              Clear Search
            </Link>
          </div>
        )}

        {/* Results Bar */}
        {!isError && stores.length > 0 && (
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E2D9CC]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
                <StoreIcon size={16} />
              </div>
              <h2 className="!text-[#1C352D] text-[18px] sm:text-[20px] font-heading font-bold">
                {search ? (
                  <>
                    Results for{" "}
                    <span className="text-[#D9A441]">
                      &ldquo;{search}&rdquo;
                    </span>
                  </>
                ) : (
                  "All Partner Brands"
                )}
              </h2>
            </div>
            <span className="text-[12.5px] font-mono font-bold !text-[#8A8F8C] uppercase">
              {stores.length} {stores.length === 1 ? "Brand" : "Brands"} Available
            </span>
          </div>
        )}

       {/* ── MODERN STORE PROFILE BENTO GRID ── */}
{!isError && stores.length > 0 && (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {stores.map((store) => {
      const activeCount = store.activeOffers || 0;
      const hasOffers = activeCount > 0;

      return (
        <Link
          href={`/stores/${store.slug}`}
          key={store._id}
          prefetch={true}
          className="group block h-full focus:outline-none"
        >
          <article className="h-full bg-[#FFFFFF] rounded-[24px] border border-[#E2D9CC] p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:border-[#BDD6C4] hover:shadow-[0_14px_32px_rgba(28,53,45,0.08)] relative">
            
            {/* Top Store Banner + Floating Logo Avatar Container */}
            <div className="relative mb-9">
              {/* Background Header Strip */}
              <div className="w-full h-20 rounded-[18px] bg-[#162B24] border border-[#25473C] p-3 flex items-start justify-between relative overflow-hidden">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#D9A441] to-transparent pointer-events-none" />
                
                {/* Verified Badge */}
                <span className="relative z-10 inline-flex items-center gap-1 bg-[#10201B]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#A8C3B0] border border-[#25473C]">
                  <CheckCircle2 size={11} className="text-[#34D399]" />
                  Verified
                </span>

                {/* Hot Deals Badge */}
                {hasOffers && (
                  <span className="relative z-10 bg-[#D9A441] text-[#16241F] text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full shadow-xs tracking-wider uppercase">
                    HOT
                  </span>
                )}
              </div>

              {/* Floating Logo Badge (Cleanly elevated without clipping) */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-[#FFFFFF] border-2 border-[#E2D9CC] flex items-center justify-center p-2.5 shadow-[0_8px_20px_rgba(28,53,45,0.08)] group-hover:scale-105 group-hover:border-[#BDD6C4] transition-all z-20 overflow-hidden">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={`${store.name} logo`}
                    width={60}
                    height={60}
                    className="object-contain w-full h-full"
                  />
                ) : (
                  <span className="text-[#1C352D] text-xl font-heading font-black">
                    {store.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Store Information */}
            <div className="text-center mt-2 mb-5 px-2">
              <h3 className="!text-[#10201B] text-[17px] font-heading font-bold line-clamp-1 group-hover:!text-[#D9A441] transition-colors">
                {store.name}
              </h3>
              <p className="text-[12.5px] !text-[#8A8F8C] mt-0.5 line-clamp-1 font-medium">
                {store.category?.name || "Online Marketplace"}
              </p>
            </div>

            {/* Bottom Offer Counter Footer */}
            <div className="w-full mt-auto pt-3.5 border-t border-[#E2D9CC] flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 bg-[#EBF3EE] border border-[#BDD6C4] px-3 py-1 rounded-lg !text-[#1C352D] text-[11px] font-heading font-bold">
                <Tag size={12} className="text-[#D9A441]" />
                <span>{activeCount} Active Deals</span>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#1C352D] text-[#FDFBF7] flex items-center justify-center group-hover:bg-[#D9A441] group-hover:text-[#16241F] transition-all shadow-xs">
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </div>
            </div>

          </article>
        </Link>
      );
    })}
  </div>
)}

        {/* ── TRUST & DISCLOSURE STRIP ── */}
        {!isError && stores.length > 0 && (
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 py-6 border-t border-[#E2D9CC] !text-[#6B7280] text-[13px] font-medium text-center">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#D9A441]" />
              <span>Tested & verified checkout codes daily</span>
            </div>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-[#8A8F8C]" />
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#D9A441]" />
              <span>Direct merchant affiliate network integration</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}