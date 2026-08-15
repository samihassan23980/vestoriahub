"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Copy,
  CheckCheck,
  Clock,
  Users,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Star,
  Info,
  ChevronDown,
  Pin,
  Globe,
  Tag,
  BadgeCheck,
  Sparkles,
  Percent,
  Layers,
  ArrowUpRight,
} from "lucide-react";

// --- HELPERS ---

function formatDiscount(type, value) {
  if (type === "percent") return `${value}% OFF`;
  if (type === "flat") return `$${value} OFF`;
  if (type === "free_shipping") return "FREE SHIP";
  return "VERIFIED DEAL";
}

function formatExpiry(dateString) {
  if (!dateString) return "Ongoing Promo";
  const days = Math.ceil(
    (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "Expired";
  if (days === 0) return "Ends today";
  return `Ends in ${days}d`;
}

function buildTermsLine(coupon) {
  const parts = [];
  if (coupon.minOrderValue) {
    parts.push(`Min. order $${coupon.minOrderValue}`);
  }
  if (coupon.maxDiscountCap) {
    parts.push(`Max cap $${coupon.maxDiscountCap}`);
  }
  return parts.join(" · ");
}

function formatVerifiedDate(dateString) {
  if (!dateString) return null;
  const days = Math.floor(
    (new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return "Verified today";
  if (days === 1) return "Verified yesterday";
  if (days < 30) return `Verified ${days}d ago`;
  return "Verified";
}

function getSimulatedStats(idStr) {
  const num = parseInt(idStr.substring(0, 4), 16) || 100;
  return {
    uses: (num % 800) + 50,
    mins: (num % 59) + 1,
  };
}

// --- SUB-COMPONENTS ---

const GridCouponCard = ({ coupon }) => {
  const [copied, setCopied] = useState(false);
  const stats = getSimulatedStats(coupon._id || "a1b2");
  const termsLine = buildTermsLine(coupon);
  const verifiedLabel = formatVerifiedDate(coupon.verifiedAt);
  const isPromoCode = coupon.type === "coupon" && coupon.codeType === "public";

  const handleCopy = async (e) => {
    e.preventDefault();
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);

      if (coupon.trackingLink) {
        window.open(coupon.trackingLink, "_blank");
      }

      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDealClick = () => {
    if (coupon.trackingLink) {
      window.open(coupon.trackingLink, "_blank");
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-[22px] bg-[#FFFFFF] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] p-5 shadow-xs hover:shadow-[0_14px_36px_rgba(28,53,45,0.09)] transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      
      {/* Top Banner & Discount Pill */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {coupon.isPinned && (
              <span className="inline-flex items-center gap-1 bg-[#1C352D] text-[#FDFBF7] text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Pin size={10} className="text-[#D9A441]" /> Pinned
              </span>
            )}
            {coupon.isExclusive && (
              <span className="inline-flex items-center gap-1 bg-[#D9A441] text-[#16241F] text-[10px] font-heading font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Sparkles size={10} /> Exclusive
              </span>
            )}
            {!coupon.isPinned && !coupon.isExclusive && (
              <span className="inline-flex items-center gap-1 bg-[#EBF3EE] border border-[#BDD6C4] text-[#1C352D] text-[10px] font-heading font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <Tag size={10} className="text-[#D9A441]" />
                {isPromoCode ? "Coupon Code" : "Store Deal"}
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono font-semibold !text-[#8A8F8C]">
            {formatExpiry(coupon.expiryDate)}
          </span>
        </div>

        {/* Discount Value Display */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[26px] sm:text-[30px] font-heading font-black tracking-tight text-[#1C352D] leading-none">
            {formatDiscount(coupon.discountType, coupon.discountValue)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-[16px] sm:text-[17px] text-[#16241F] leading-snug line-clamp-2 mb-2 group-hover:text-[#D9A441] transition-colors">
          {coupon.title}
        </h3>

        {/* Subtitle / Terms */}
        <p className="text-[13px] text-[#6B7280] leading-relaxed line-clamp-2 mb-3 font-normal">
          {coupon.subtitle || coupon.terms || "Apply at checkout to redeem this verified store discount."}
        </p>

        {termsLine && (
          <div className="inline-block bg-[#FDFBF7] border border-[#E2D9CC] text-[#8A8F8C] text-[11px] font-medium px-2 py-0.5 rounded-md mb-4">
            {termsLine}
          </div>
        )}
      </div>

      {/* Action Zone & Stats Bottom */}
      <div className="pt-3 border-t border-[#E2D9CC] mt-auto">
        {isPromoCode ? (
          <div className="flex flex-col gap-2">
            {/* Promo Code Copy Trigger Container */}
            <div
              onClick={handleCopy}
              className="relative w-full h-[46px] rounded-xl border-2 border-dashed border-[#BDD6C4] bg-[#EBF3EE]/60 hover:bg-[#EBF3EE] flex items-center justify-between px-3.5 cursor-pointer transition-all group/code"
            >
              <span className="font-mono text-[15px] font-extrabold text-[#1C352D] tracking-wider truncate">
                {coupon.code}
              </span>
              
              <div className="flex items-center gap-1 text-[11.5px] font-heading font-extrabold text-[#1C352D] group-hover/code:text-[#D9A441] transition-colors">
                {copied ? (
                  <>
                    <CheckCheck size={16} className="text-[#34D399]" />
                    <span className="text-[#34D399]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    <span>Copy</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="w-full h-[42px] rounded-xl bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] font-heading font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {copied ? "Code Copied & Store Opened" : "Copy Code & Open Store"}
            </button>
          </div>
        ) : (
          <button
            onClick={handleDealClick}
            className="w-full h-[46px] rounded-xl bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] font-heading font-bold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-xs group/btn"
          >
            <span>Activate Offer</span>
            <ArrowUpRight size={15} strokeWidth={2.5} className="text-[#D9A441] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </button>
        )}

        {/* Live Social Proof */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8A8F8C] font-semibold mt-3 pt-2">
          <span className="flex items-center gap-1 text-[#427867]">
            <Users size={12} /> {stats.uses} uses today
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {stats.mins}m ago
          </span>
        </div>
      </div>
    </div>
  );
};

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[#E2D9CC] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left focus:outline-none rounded-lg"
      >
        <span className="font-heading font-bold text-[15.5px] text-[#1C352D]">
          {question}
        </span>
        <ChevronDown
          size={18}
          className={`text-[#D9A441] transition-transform duration-300 shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[300px] pb-4 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-[#6B7280] text-[14px] leading-relaxed font-normal">
          {answer}
        </p>
      </div>
    </div>
  );
};

// --- MAIN CLIENT COMPONENT ---

export default function SingleStoreClient({ initialData, slug }) {
  const { store, coupons, similarStores } = initialData || {};

  const couponsItems = coupons?.items || [];
  const couponsTotal = coupons?.total || couponsItems.length || 0;

  const policies = [
    {
      label: "Shipping Information",
      value: store?.policy?.shippingInfo || "Standard and expedited shipping terms apply. Check official store checkout.",
    },
    {
      label: "Returns & Refund Guarantee",
      value: store?.policy?.returnRefundPolicy || "Hassle-free return policy supported directly by the merchant.",
    },
  ];

  const factEntries = store?.facts
    ? Object.entries(store.facts).filter(([, v]) => v)
    : [];

  return (
    <div className="min-h-screen bg-[#F8F0E5] font-sans pb-24">
      
      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="bg-[#10201B] border-b border-[#25473C] py-3.5">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[12px] font-mono text-[#A8C3B0]">
          <Link href="/" className="hover:text-[#D9A441] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-[#25473C]" />
          <Link href="/stores" className="hover:text-[#D9A441] transition-colors">
            Stores
          </Link>
          <ChevronRight size={12} className="text-[#25473C]" />
          <span className="text-[#FDFBF7] font-bold truncate">
            {store?.name || "Merchant"} Coupons
          </span>
        </div>
      </nav>

      {/* ── HIGH-CONVERTING CENTERED PROFILE HERO ── */}
      <section className="relative bg-[#10201B] text-[#F8F0E5] pt-14 pb-16 overflow-hidden border-b border-[#25473C]">
        
        {/* Background Ambient S-Wave */}
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
              className="opacity-50"
            />
          </svg>
        </div>

        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#D9A441]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-[#1C352D] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          
          {/* Centered Brand Avatar with Verified Ring */}
          <div className="relative mb-5">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[28px] bg-[#FFFFFF] border-2 border-[#E2D9CC] flex items-center justify-center p-3.5 shadow-xl overflow-hidden">
              {store?.images?.logo?.url || store?.logo ? (
                <Image
                  src={store?.images?.logo?.url || store?.logo}
                  alt={`${store?.name || "Store"} logo`}
                  width={112}
                  height={112}
                  className="object-contain w-full h-full"
                />
              ) : (
                <span className="text-[#1C352D] font-heading font-black text-4xl">
                  {(store?.name || "V")[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* Verified Icon Accent on Avatar */}
            <div className="absolute -bottom-2 -right-2 bg-[#10201B] rounded-full p-1 border border-[#25473C] shadow-md">
              <BadgeCheck size={22} className="text-[#34D399] fill-[#10201B]" />
            </div>
          </div>

          {/* Store Header Titles */}
          <div className="inline-flex items-center gap-2 bg-[#162B24] border border-[#25473C] text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full mb-3 shadow-xs">
            <ShieldCheck size={13} />
            <span>Official Partner Store</span>
          </div>

          <h1 className="text-[32px] sm:text-[44px] md:text-[50px] font-heading font-black uppercase tracking-tight text-[#FDFBF7] leading-tight mb-3">
            {store?.content?.heading || `${store?.name} Promo Codes & Deals`}
          </h1>

          <p className="text-[14.5px] sm:text-[16px] text-[#D5E4D9] max-w-2xl mx-auto leading-relaxed font-normal mb-8">
            {store?.content?.shortDescription ||
              `Discover verified coupon codes, discounts, and limited-time price drops for ${store?.name}. Tested daily for guaranteed checkout savings.`}
          </p>

          {/* Quick Metrics Bar & Official Link */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <div className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-4 py-2 rounded-xl text-[12.5px] font-mono text-[#FDFBF7]">
              <Tag size={14} className="text-[#D9A441]" />
              <strong className="text-[#D9A441]">{couponsTotal}</strong>
              <span className="text-[#A8C3B0]">Active Offers</span>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-4 py-2 rounded-xl text-[12.5px] font-mono text-[#FDFBF7]">
              <Star size={14} className="text-[#D9A441] fill-[#D9A441]" />
              <span>4.9 / 5.0 Rating</span>
            </div>

            {store?.officialUrl && (
              <a
                href={store.officialUrl}
                target="_blank"
                rel="noopener noreferrer nofollow sponsored"
                className="inline-flex items-center gap-1.5 bg-[#D9A441] hover:bg-[#BE8E34] text-[#16241F] text-[12.5px] font-heading font-bold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-98"
              >
                <Globe size={14} />
                <span>Visit Official Store</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

        </div>
      </section>

      {/* ── TWO COLUMN MAIN CONTENT BODY ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ── MAIN CONTENT (Left - 8 Cols) ── */}
          <div className="col-span-1 lg:col-span-8">
            
            {/* Section Header with Live Offer Count */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2D9CC]">
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-[#D9A441]" />
                <h2 className="text-[20px] sm:text-[22px] font-heading font-extrabold text-[#1C352D] uppercase tracking-tight">
                  Available Offers & Promo Codes
                </h2>
              </div>
              <span className="text-[12px] font-mono font-bold bg-[#EBF3EE] text-[#1C352D] border border-[#BDD6C4] px-3 py-1 rounded-full">
                {couponsTotal} Verified Deals
              </span>
            </div>

            {/* ── 2-COLUMN COUPONS GRID ── */}
            {couponsItems.length === 0 ? (
              <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-full bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center mx-auto mb-4 text-[#1C352D]">
                  <Tag size={24} />
                </div>
                <h3 className="font-heading font-bold text-[18px] text-[#1C352D] mb-1">
                  No active promo codes right now
                </h3>
                <p className="text-[13.5px] text-[#6B7280] max-w-md mx-auto">
                  Our verification team audits merchant networks daily. Check back shortly for updated discounts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                {couponsItems.map((offer) => (
                  <GridCouponCard key={offer._id || offer.code} coupon={offer} />
                ))}
              </div>
            )}

            {/* ── ABOUT STORE EDITORIAL CARD ── */}
            <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-[24px] p-6 sm:p-8 shadow-xs mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
                  <Info size={18} />
                </div>
                <h3 className="text-[20px] font-heading font-extrabold text-[#1C352D] uppercase tracking-tight">
                  About {store?.name}
                </h3>
              </div>

              <div className="text-[14.5px] text-[#6B7280] leading-relaxed font-normal mb-6">
                {store?.content?.longDescription ||
                  store?.content?.shortDescription ||
                  `${store?.name} provides competitive catalog offerings and verified shopper perks across all product tiers.`}
              </div>

              {/* Store Quick Facts Grid */}
              {factEntries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {factEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-[#FDFBF7] border border-[#E2D9CC] rounded-xl p-3"
                    >
                      <span className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C] block mb-0.5">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="text-[13.5px] font-heading font-bold text-[#1C352D] truncate block">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Policy Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-[#E2D9CC]">
                {policies.map((p, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="font-heading font-bold text-[14px] text-[#1C352D]">
                      {p.label}
                    </span>
                    <span className="text-[13px] text-[#6B7280] leading-relaxed">
                      {p.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FAQ SECTION ── */}
            {store?.faqs && store.faqs.length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-[24px] p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-[#D9A441]" />
                  <h3 className="text-[20px] font-heading font-extrabold text-[#1C352D] uppercase tracking-tight">
                    Frequently Asked Questions
                  </h3>
                </div>
                <div>
                  {store.faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      question={faq.question}
                      answer={faq.answer}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── SIDEBAR (Right - 4 Cols) ── */}
          <aside className="col-span-1 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8">
            
            {/* Savings Intelligence Card */}
            <div className="bg-[#10201B] rounded-[24px] p-6 border border-[#25473C] shadow-sm text-[#FDFBF7] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D9A441]/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest mb-3">
                <TrendingUp size={14} />
                <span>Savings Intelligence</span>
              </div>

              <h4 className="text-[18px] font-heading font-extrabold uppercase text-[#FDFBF7] mb-2 leading-tight">
                Maximizing Checkout Value
              </h4>

              <p className="text-[13px] text-[#D5E4D9] leading-relaxed mb-4 font-normal">
                Combine verified store coupons with seasonal clearance promotions to stack savings. We re-test codes continuously throughout the day.
              </p>

              <div className="pt-3 border-t border-[#25473C] flex items-center justify-between text-[11.5px] font-mono text-[#A8C3B0]">
                <span>Status: Fully Verified</span>
                <span className="text-[#34D399] font-bold">100% Checked</span>
              </div>
            </div>

            {/* Similar Competitor Deals Card */}
            {similarStores && similarStores.length > 0 && (
              <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-[24px] p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E2D9CC]">
                  <Layers size={16} className="text-[#D9A441]" />
                  <h3 className="text-[16px] font-heading font-extrabold text-[#1C352D] uppercase tracking-tight">
                    Similar Brand Deals
                  </h3>
                </div>

                <div className="flex flex-col gap-3.5">
                  {similarStores.map((sim) => (
                    <Link
                      key={sim._id || sim.slug}
                      href={`/stores/${sim.slug}`}
                      className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FDFBF7] border border-transparent hover:border-[#E2D9CC] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F8F0E5] border border-[#E2D9CC] flex items-center justify-center p-1 relative overflow-hidden shrink-0">
                          {sim.images?.logo?.url || sim.logo ? (
                            <Image
                              src={sim.images?.logo?.url || sim.logo}
                              alt={`${sim.name} logo`}
                              width={40}
                              height={40}
                              className="object-contain w-full h-full"
                            />
                          ) : (
                            <span className="text-[#1C352D] font-heading font-bold text-[14px]">
                              {sim.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col">
                          <span className="font-heading font-bold text-[14px] text-[#1C352D] group-hover:text-[#D9A441] transition-colors truncate max-w-[140px]">
                            {sim.name}
                          </span>
                          <span className="text-[11px] font-mono text-[#8A8F8C]">
                            {sim.activeOffers || 0} Offers
                          </span>
                        </div>
                      </div>

                      <div className="w-7 h-7 rounded-full bg-[#EBF3EE] text-[#1C352D] flex items-center justify-center group-hover:bg-[#1C352D] group-hover:text-[#FDFBF7] transition-colors">
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </aside>

        </div>
      </div>

    </div>
  );
}