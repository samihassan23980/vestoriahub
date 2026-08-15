"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
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
} from "lucide-react";

const RESELLERS = [
  { name: "Saks Fifth Avenue", code: "TAKE20", discount: "20% Off Storewide" },
  { name: "Foot Locker", code: "LKS15", discount: "15% Off Orders $75+" },
];

// --- HELPERS ---

function formatDiscount(type, value) {
  if (type === "percent") return `${value}% OFF`;
  if (type === "flat") return `$${value} OFF`;
  if (type === "free_shipping") return "FREE SHIP";
  return "SALE";
}

function formatExpiry(dateString) {
  if (!dateString) return "Ongoing";
  const days = Math.ceil(
    (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24),
  );
  if (days < 0) return "Expired";
  if (days === 0) return "Ends today";
  return `Ends in ${days} days`;
}

function buildTermsLine(coupon) {
  const parts = [];
  if (coupon.minOrderValue) {
    parts.push(`Min. order $${coupon.minOrderValue}`);
  }
  if (coupon.maxDiscountCap) {
    parts.push(`Max savings $${coupon.maxDiscountCap}`);
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
    initials: ["AM", "BT", "LP", "JD", "RK"][num % 5],
  };
}

// --- COMPONENTS ---

const RowCouponCard = ({ coupon }) => {
  const [copied, setCopied] = useState(false);
  const stats = getSimulatedStats(coupon._id || "a1b2");
  const termsLine = buildTermsLine(coupon);
  const verifiedLabel = formatVerifiedDate(coupon.verifiedAt);

  const handleCopy = async () => {
    if (!coupon.code) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);

      if (coupon.trackingLink) {
        window.open(coupon.trackingLink, "_blank");
      }

      setTimeout(() => setCopied(false), 2000);
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
    <div className="bg-[var(--color-surface)] rounded-[16px] border border-[var(--color-border)] flex flex-col md:flex-row relative group transition-all duration-300 hover:-translate-y-[2px] shadow-[0_4px_16px_rgba(3,4,10,0.4)] hover:shadow-[0_16px_40px_rgba(124,92,252,0.15)] hover:border-[var(--color-primary)]/50 overflow-hidden mb-[24px]">
      {/* PINNED / EXCLUSIVE RIBBON */}
      {(coupon.isPinned || coupon.isExclusive) && (
        <div className="absolute top-0 left-0 z-10 flex">
          {coupon.isPinned && (
            <span className="flex items-center gap-[4px] bg-[var(--color-primary)] text-white text-[10px] font-bold uppercase tracking-[0.06em] px-[10px] py-[5px] rounded-br-[8px]">
              <Pin size={11} /> Pinned
            </span>
          )}
          {coupon.isExclusive && (
            <span className="flex items-center gap-[4px] bg-[var(--color-warning)] text-[var(--color-navy-950)] text-[10px] font-bold uppercase tracking-[0.06em] px-[10px] py-[5px] rounded-br-[8px]">
              <Tag size={11} /> Exclusive
            </span>
          )}
        </div>
      )}

      {/* ZONE 1: DISCOUNT */}
      <div className="flex md:flex-col items-center justify-center p-[24px] bg-[var(--color-navy-900)] border-b md:border-b-0 md:border-r border-[var(--color-border)] shrink-0 md:w-[200px]">
        <div className="flex flex-col items-start md:items-center">
          <div className="text-[var(--color-primary)] text-[28px] md:text-[32px] font-bold leading-none mb-[4px] text-center">
            {formatDiscount(coupon.discountType, coupon.discountValue)}
          </div>
          <div className="text-[var(--color-text-secondary)] opacity-80 text-[10px] font-bold tracking-[0.1em] uppercase">
            {coupon.type === "coupon" && coupon.codeType === "public"
              ? "Promo Code"
              : "Verified Deal"}
          </div>
        </div>
      </div>

      {/* ZONE 2: CONTENT */}
      <div className="flex flex-col justify-between flex-grow p-[24px] pt-[36px] md:pt-[24px]">
        <div>
          <h3 className="text-[var(--color-text-primary)] text-[18px] md:text-[20px] font-bold leading-[1.3] mb-[8px] group-hover:text-[var(--color-primary)] transition-colors">
            {coupon.title}
          </h3>
          <p className="text-[var(--color-text-secondary)] text-[14px] leading-[1.6] mb-[8px] max-w-[600px]">
            {coupon.subtitle ||
              coupon.terms ||
              "Get the best deal today. Apply at checkout or click to activate."}
          </p>
          {termsLine && (
            <p className="text-[var(--color-text-secondary)] opacity-70 text-[12px] font-medium mb-[20px]">
              {termsLine}
            </p>
          )}
          {!termsLine && <div className="mb-[12px]" />}
        </div>

        {/* Trust Metrics */}
        <div className="flex flex-wrap items-center gap-[16px] md:gap-[24px] text-[12px] font-medium">
          <div className="flex items-center gap-[6px] text-[var(--color-primary)] bg-[var(--color-primary)]/15 px-[10px] py-[4px] rounded-full">
            <Users size={14} /> {stats.uses} uses today
          </div>
          <div className="flex items-center gap-[6px] text-[var(--color-text-secondary)]">
            <Clock size={14} /> Last used {stats.mins} mins ago
          </div>
          <div className="flex items-center gap-[6px] text-[var(--color-text-secondary)] border-l border-[var(--color-border)] pl-[16px] md:pl-[24px]">
            {coupon.isVerified ? (
              <>
                <BadgeCheck size={16} className="text-[var(--color-primary)]" />
                <span>{verifiedLabel || "Verified Recently"}</span>
              </>
            ) : (
              <span className="text-[var(--color-secondary)]">
                Community Deal
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ZONE 3: ACTION */}
      <div className="flex flex-col items-center md:items-end justify-center p-[24px] bg-[var(--color-navy-900)] border-t md:border-t-0 md:border-l border-[var(--color-border)] shrink-0 md:w-[240px]">
        {coupon.type === "coupon" && coupon.codeType === "public" ? (
          <div className="w-full flex flex-col items-center md:items-end gap-[12px]">
            <div
              className="w-full relative group/code cursor-pointer"
              onClick={handleCopy}
            >
              <div className="absolute inset-0 border-[1.5px] border-dashed border-[var(--color-border)] rounded-[8px] group-hover/code:bg-[var(--color-primary)]/10 transition-colors" />
              <div className="relative flex items-center justify-between p-[12px_16px]">
                <span className="font-mono text-[16px] font-bold text-[var(--color-primary)] tracking-[0.1em]">
                  {coupon.code}
                </span>
                {copied ? (
                  <CheckCheck
                    size={18}
                    className="text-[var(--color-primary)]"
                  />
                ) : (
                  <Copy
                    size={18}
                    className="text-[var(--color-text-secondary)] group-hover/code:text-[var(--color-primary)] transition-colors"
                  />
                )}
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="w-full py-[12px] rounded-[8px] text-[14px] font-bold transition-all duration-150 flex items-center justify-center gap-[8px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-[0_4px_16px_rgba(124,92,252,0.25)]"
            >
              {copied ? (
                <>
                  <CheckCheck size={16} /> Code Copied!
                </>
              ) : (
                "Copy Code"
              )}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center md:items-end gap-[12px]">
            <button
              onClick={handleDealClick}
              className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white py-[14px] rounded-[8px] text-[14px] font-bold transition-all duration-150 flex items-center justify-center gap-[8px] shadow-[0_4px_16px_rgba(124,92,252,0.25)]"
            >
              Get Deal <ExternalLink size={16} />
            </button>
          </div>
        )}
        <div className="text-[11px] text-[var(--color-text-secondary)] mt-[16px] text-center md:text-right w-full">
          {formatExpiry(coupon.expiryDate)}
        </div>
      </div>
    </div>
  );
};

const AccordionItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-[var(--color-border)] last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-[20px] flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] rounded-[4px]"
      >
        <span className="text-[var(--color-text-primary)] text-[16px] font-bold">
          {question}
        </span>
        <ChevronDown
          size={20}
          className={`text-[var(--color-primary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[200px] mb-[20px]" : "max-h-0"}`}
      >
        <p className="text-[var(--color-text-secondary)] text-[15px] leading-[1.6]">
          {answer}
        </p>
      </div>
    </div>
  );
};

// --- MAIN CLIENT COMPONENT ---

export default function SingleStoreClient({ initialData, slug }) {
  const router = useRouter();
  const { store, coupons, similarStores } = initialData;

  // Defensive fallbacks to avoid crashes under any structure scenario
  const couponsItems = coupons?.items || [];
  const couponsTotal = coupons?.total || 0;

  const policies = [
    {
      label: "Shipping Policy",
      value: store.policy?.shippingInfo || "Check merchant site for details",
    },
    {
      label: "Return Policy",
      value:
        store.policy?.returnRefundPolicy || "Check merchant site for details",
    },
  ];

  const factEntries = store.facts
    ? Object.entries(store.facts).filter(([, v]) => v)
    : [];

  return (
    <div className="min-h-screen bg-[var(--color-background)] font-sans pb-[96px]">
      {/* ── HEADER BREADCRUMB ── */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] py-[16px]">
        <div className="max-w-[1280px] mx-auto px-[24px] flex items-center gap-[6px] text-[12px] text-[var(--color-text-secondary)] font-medium">
          <a
            href="/"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            Home
          </a>
          <ChevronRight size={12} />
          <a
            href="/stores"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            Stores
          </a>
          <ChevronRight size={12} />
          <span className="text-[var(--color-primary)] font-bold">
            {store.name} Promo Codes
          </span>
        </div>
      </div>

      {/* ── STORE PROFILE HERO ── */}
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] pb-[48px] pt-[32px]">
        <div className="max-w-[1280px] mx-auto px-[24px] flex flex-col lg:flex-row gap-[48px] lg:items-center justify-between">
          {/* Brand Info */}
          <div className="flex items-center gap-[24px]">
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] rounded-full bg-[var(--color-navy-900)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden relative shadow-sm shrink-0">
              {store.images?.logo?.url ? (
                <Image
                  src={store.images.logo.url}
                  alt={`${store.name} logo`}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <span className="text-[var(--color-primary)] font-bold text-[40px]">
                  {store.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-[10px] mb-[8px]">
                <h1 className="text-[var(--color-text-primary)] text-[32px] md:text-[40px] font-bold leading-none">
                  {store.content?.heading || `${store.name} Promo Codes`}
                </h1>
                {store.isFeatured && (
                  <span className="flex items-center gap-[4px] bg-[var(--color-warning)] text-[var(--color-navy-950)] text-[10px] font-bold uppercase tracking-[0.06em] px-[8px] py-[4px] rounded-full">
                    <Star size={11} className="fill-current" /> Featured
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-[12px] text-[14px] text-[var(--color-text-secondary)] font-medium">
                <div className="flex items-center gap-[4px] text-[var(--color-warning)]">
                  <Star size={16} className="fill-current" />
                  <span className="text-[var(--color-text-primary)] font-bold">
                    4.8
                  </span>
                </div>
                <span>(Community Verified)</span>
                {store.officialUrl && (
                  <a
                    href={store.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow sponsored"
                    className="flex items-center gap-[4px] text-[var(--color-primary)] font-bold hover:underline"
                  >
                    <Globe size={14} /> Visit Site <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Intelligence Panel */}
          <div className="bg-[var(--color-navy-900)] border border-[var(--color-border)] rounded-[16px] p-[24px] shadow-lg flex items-center gap-[32px] w-full lg:w-auto relative overflow-hidden">
            <div className="absolute -right-[20px] -top-[20px] w-[150px] h-[150px] rounded-full bg-[var(--color-primary)]/10 pointer-events-none blur-[40px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-[6px] text-[var(--color-secondary)] text-[11px] font-bold tracking-[0.08em] uppercase mb-[8px]">
                <TrendingUp size={14} /> Savings Intelligence
              </div>
              <div className="text-[var(--color-text-primary)] text-[14px] leading-[1.5] max-w-[340px]">
                {store.name} currently has{" "}
                <strong className="text-[var(--color-primary)]">
                  {couponsTotal} active offers
                </strong>
                . Our community frequently verifies these discounts to ensure
                maximum savings.
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-[24px] pl-[24px] border-l border-[var(--color-border)] relative z-10">
              <div>
                <div className="text-[var(--color-text-secondary)] text-[11px] font-bold uppercase tracking-[0.06em] mb-[4px]">
                  Active Deals
                </div>
                <div className="text-[var(--color-text-primary)] text-[24px] font-bold">
                  {couponsTotal}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className="max-w-[1280px] mx-auto px-[24px] pt-[48px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[48px] items-start">
          {/* MAIN CONTENT (Left - 8 Cols) */}
          <div className="col-span-1 lg:col-span-8">
            <div className="flex items-center justify-between mb-[24px]">
              <h2 className="text-[var(--color-text-primary)] text-[24px] font-bold">
                Top Codes & Deals
              </h2>
              <span className="text-[var(--color-text-secondary)] text-[14px] font-medium bg-[var(--color-surface)] px-[12px] py-[6px] rounded-full border border-[var(--color-border)]">
                {couponsTotal} Offers Available
              </span>
            </div>

            {/* Coupons List */}
            <div className="mb-[48px]">
              {couponsItems.length === 0 ? (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-[48px] text-center">
                  <p className="text-[var(--color-text-secondary)] font-medium">
                    No active coupons found for this store right now.
                  </p>
                </div>
              ) : (
                couponsItems.map((offer) => (
                  <RowCouponCard key={offer._id} coupon={offer} />
                ))
              )}
            </div>

            {/* Store Profile / About */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-[32px] shadow-[0_4px_24px_rgba(3,4,10,0.5)] mb-[48px]">
              <div className="flex items-center gap-[8px] mb-[16px]">
                <Info size={20} className="text-[var(--color-primary)]" />
                <h3 className="text-[var(--color-text-primary)] text-[20px] font-bold">
                  About {store.name}
                </h3>
              </div>
              <div className="text-[var(--color-text-secondary)] text-[15px] leading-[1.7] mb-[32px]">
                {store.content?.longDescription ||
                  store.content?.shortDescription ||
                  `${store.name} offers great products and premium deals.`}
              </div>

              {/* Quick Facts */}
              {factEntries.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[16px] mb-[32px]">
                  {factEntries.map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-[var(--color-navy-900)] border border-[var(--color-border)] rounded-[10px] px-[14px] py-[12px]"
                    >
                      <div className="text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-[0.05em] mb-[2px]">
                        {key.replace(/([A-Z])/g, " $1")}
                      </div>
                      <div className="text-[var(--color-text-primary)] text-[14px] font-bold">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[24px] pt-[24px] border-t border-[var(--color-border)]">
                {policies.map((p, i) => (
                  <div key={i}>
                    <div className="text-[var(--color-text-primary)] font-bold text-[14px] mb-[4px]">
                      {p.label}
                    </div>
                    <div className="text-[var(--color-text-secondary)] text-[14px]">
                      {p.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            {store.faqs && store.faqs.length > 0 && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-[32px] shadow-[0_4px_24px_rgba(3,4,10,0.5)]">
                <h3 className="text-[var(--color-text-primary)] text-[20px] font-bold mb-[24px]">
                  {store.name} FAQ
                </h3>
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

          {/* SIDEBAR (Right - 4 Cols) */}
          <aside className="col-span-1 lg:col-span-4 flex flex-col gap-[32px] lg:sticky lg:top-[32px]">
            {/* Similar Competitor Deals */}
            {similarStores && similarStores.length > 0 && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-[24px] shadow-[0_4px_24px_rgba(3,4,10,0.5)]">
                <h3 className="text-[var(--color-text-primary)] text-[16px] font-bold mb-[20px]">
                  Similar Stores
                </h3>
                <div className="flex flex-col gap-[16px]">
                  {similarStores.map((sim) => (
                    <div
                      key={sim._id}
                      className="flex items-center gap-[12px] pb-[16px] border-b border-[var(--color-border)] last:border-0 last:pb-0"
                    >
                      <div className="w-[36px] h-[36px] rounded-full bg-[var(--color-navy-900)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden relative shrink-0">
                        {sim.images?.logo?.url ? (
                          <Image
                            src={sim.images.logo.url}
                            alt={`${sim.name} logo`}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <span className="text-[var(--color-primary)] font-bold text-[14px]">
                            {sim.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-[2px] flex-1 min-w-0">
                        <div className="flex items-center gap-[6px]">
                          <span className="text-[var(--color-text-primary)] font-bold text-[14px] truncate">
                            {sim.name}
                          </span>
                          {sim.isFeatured && (
                            <Star
                              size={12}
                              className="text-[var(--color-warning)] fill-current shrink-0"
                            />
                          )}
                        </div>
                        <a
                          href={`/store/${sim.slug}`}
                          className="text-[var(--color-primary)] text-[12px] font-bold text-left hover:underline"
                        >
                          View Store Deals →
                        </a>
                      </div>
                    </div>
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