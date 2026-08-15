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
} from "lucide-react";
import StoreSearch from "../Components/StoreSearch";

export const revalidate = 60;
export const metadata = {
  title: "Browse Top Stores & Brands – Verified Coupons & Deals ",
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
   /*  images: [
      {
        url: "https://www.vestoriahub.com/og-stores.jpg",
        width: 1200,
        height: 630,
        alt: "Browse Top Stores & Brands on VestoriaHub",
      },
    ], */
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Top Stores & Brands – Verified Coupons & Deals",
    description:
      "Verified coupons, exclusive deals & signup bonuses from 500+ top brands. Updated daily.",
    /* images: ["https://www.vestoriahub.com/og-stores.jpg"], */
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

  // Total active offers across the current result set — gives the header
  // a real, live number instead of a static claim.
  const totalOffers = stores.reduce(
    (sum, store) => sum + (store.activeOffers || 0),
    0,
  );

  return (
    <main className="min-h-screen bg-[var(--color-background)] font-sans pb-24">
      {/* ── HERO ── */}
   <section className="relative bg-[var(--color-navy-900)] overflow-hidden border-b border-[var(--color-border)]">
        {/* Signature backdrop: a quiet grid of receipt-style tick marks,
            nodding to "verified savings" without resorting to generic blobs */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 27px, var(--color-border) 27px, var(--color-border) 28px)",
          }}
        />
        <div className="absolute -right-[120px] -top-[120px] w-[420px] h-[420px] rounded-full bg-[var(--color-primary)] opacity-[0.08] blur-[150px] pointer-events-none" />
        <div className="absolute -left-[80px] bottom-[-140px] w-[320px] h-[320px] rounded-full bg-[var(--color-secondary)] opacity-[0.06] blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1280px] mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-28 text-center">
          <div className="inline-flex items-center gap-[8px] bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] text-[12px] font-bold uppercase tracking-[0.08em] px-[14px] py-[7px] rounded-full mb-[24px]">
            <ShieldCheck size={14} className="text-[var(--color-primary)]" />
            {stores.length}+ Verified Stores & Brands
          </div>

          <h1 className="text-[var(--color-text-primary)] text-[40px] md:text-[60px] font-extrabold tracking-tight leading-[1.02] mb-[20px]">
            Top Stores & Brands,
            <br />
            <span className="text-[var(--color-primary)]">
              verified coupons inside.
            </span>
          </h1>

          <p className="text-[var(--color-text-secondary)] text-[16px] md:text-[18px] max-w-[560px] mx-auto mb-[40px] leading-[1.6]">
            Explore verified coupon codes, exclusive deals, signup bonuses,
            and cashback offers from the brands you already shop —
            hand-checked before publishing, updated daily.
          </p>

          <div className="max-w-[600px] mx-auto">
            <Suspense
              fallback={
                <div className="h-[56px] w-full rounded-full bg-[var(--color-surface)] animate-pulse" />
              }
            >
              <StoreSearch />
            </Suspense>
          </div>

          {!isError && (
            <div className="flex items-center justify-center gap-[32px] md:gap-[48px] mt-[40px] text-[var(--color-text-primary)]">
              <div>
                <div className="text-[24px] md:text-[28px] font-extrabold leading-none mb-[4px]">
                  {stores.length}
                </div>
                <div className="text-[11px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-secondary)] opacity-60">
                  Stores Listed
                </div>
              </div>
              <div className="w-[1px] h-[32px] bg-[var(--color-border)]" />
              <div>
                <div className="text-[24px] md:text-[28px] font-extrabold leading-none mb-[4px]">
                  {totalOffers}
                </div>
                <div className="text-[11px] uppercase tracking-[0.06em] font-bold text-[var(--color-text-secondary)] opacity-60">
                  Active Offers
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-6 pt-16">
        {/* Error State */}
        {isError && (
          <div className="py-24 text-center bg-[var(--color-surface)] rounded-[24px] border border-[var(--color-border)]">
            <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-navy-900)] flex items-center justify-center mx-auto mb-[20px] shadow-[0_4px_12px_rgba(3,4,10,0.5)]">
              <AlertCircle className="w-8 h-8 text-[var(--color-danger)]" />
            </div>
            <h2 className="text-[var(--color-text-primary)] font-bold text-[22px] mb-[8px]">
              Unable to load stores
            </h2>
            <p className="text-[var(--color-text-secondary)] text-[14px] mb-[24px]">
              Something went wrong on our end. Refresh the page, or check back
              shortly.
            </p>
            <Link
              href="/stores"
              className="inline-flex items-center gap-[6px] bg-[var(--color-primary)] text-white text-[14px] font-bold px-[20px] py-[12px] rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Try Again
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!isError && stores.length === 0 && (
          <div className="py-24 text-center bg-[var(--color-surface)] rounded-[24px] border border-[var(--color-border)]">
            <div className="w-[64px] h-[64px] rounded-full bg-[var(--color-navy-900)] flex items-center justify-center mx-auto mb-[20px] shadow-[0_4px_12px_rgba(3,4,10,0.5)]">
              <SearchIcon className="w-8 h-8 text-[var(--color-text-secondary)] opacity-40" />
            </div>
            <h2 className="text-[var(--color-text-primary)] font-bold text-[22px] mb-[8px]">
              No stores found
            </h2>
            <p className="text-[var(--color-text-secondary)] text-[14px] mb-[24px]">
              {search
                ? `We couldn't find a match for "${search}". Try a different name.`
                : "No stores are available right now."}
            </p>
            <Link
              href="/stores"
              className="inline-flex items-center gap-[6px] bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-text-primary)] text-[14px] font-bold px-[20px] py-[12px] rounded-full hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-white transition-colors"
            >
              Clear Search
            </Link>
          </div>
        )}

        {/* ── RESULTS HEADER ── */}
        {!isError && stores.length > 0 && (
          <div className="flex items-center justify-between mb-[28px]">
            <div className="flex items-center gap-[10px]">
              <StoreIcon size={18} className="text-[var(--color-primary)]" />
              <h2 className="text-[var(--color-text-primary)] text-[18px] font-bold">
                {search ? (
                  <>
                    Results for{" "}
                    <span className="text-[var(--color-primary)]">
                      "{search}"
                    </span>
                  </>
                ) : (
                  "All Stores"
                )}
              </h2>
            </div>
            <span className="text-[var(--color-text-secondary)] text-[13px] font-medium">
              {stores.length} {stores.length === 1 ? "store" : "stores"}
            </span>
          </div>
        )}

        {/* ── STORES GRID ── */}
        {!isError && stores.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {stores.map((store) => (
              <Link
                href={`/stores/${store.slug}`}
                key={store._id}
                prefetch={true}
                className="h-full"
              >
                <article className="group h-full bg-[var(--color-surface)] rounded-[20px] border border-[var(--color-border)] p-6 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_24px_48px_rgba(3,4,10,0.5)] hover:border-[var(--color-primary)]/50 relative overflow-hidden">
                  {/* Top accent line — appears on hover, keeps cards quiet by default */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--color-primary)] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

                  {store.activeOffers > 0 && (
                    <span className="absolute top-[14px] right-[14px] bg-[var(--color-secondary)] text-[var(--color-navy-950)] text-[10px] font-extrabold px-[8px] py-[3px] rounded-full shadow-[0_2px_8px_rgba(155,138,251,0.3)]">
                      HOT
                    </span>
                  )}

                  <div className="w-20 h-20 rounded-full bg-[var(--color-navy-900)] flex items-center justify-center mb-6 overflow-hidden border border-[var(--color-border)] group-hover:scale-105 group-hover:shadow-[0_4px_16px_rgba(124,92,252,0.15)] transition-all">
                    {store.logo ? (
                      <Image
                        src={store.logo}
                        alt={`${store.name} logo`}
                        width={80}
                        height={80}
                        className="object-contain p-3"
                      />
                    ) : (
                      <span className="text-[var(--color-primary)] text-2xl font-bold">
                        {store.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <h2 className="text-[var(--color-text-primary)] text-[17px] font-bold mb-5 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {store.name}
                  </h2>

                  <div className="w-full mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-4">
                    <div className="bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-[11px] font-bold px-3 py-1 rounded-md flex items-center gap-1.5 border border-[var(--color-border)]/50">
                      <Tag
                        size={12}
                        className="text-[var(--color-text-secondary)]"
                      />{" "}
                      {store.activeOffers || 0} Offers
                    </div>
                    <div className="w-[28px] h-[28px] rounded-full bg-[var(--color-navy-900)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors shadow-sm">
                      <ArrowUpRight size={14} />
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* ── TRUST STRIP ── */}
        {!isError && stores.length > 0 && (
          <div className="mt-[64px] flex flex-col sm:flex-row items-center justify-center gap-[12px] sm:gap-[40px] py-[28px] border-t border-[var(--color-border)] text-[var(--color-text-secondary)] text-[13px] font-medium opacity-80">
            <div className="flex items-center gap-[8px]">
              <ShieldCheck size={16} className="text-[var(--color-primary)]" />
              Every code checked before publishing
            </div>
            <div className="flex items-center gap-[8px]">
              <Sparkles size={16} className="text-[var(--color-primary)]" />
              New stores added every week
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
