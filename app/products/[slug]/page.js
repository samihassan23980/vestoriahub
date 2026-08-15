import React from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  ExternalLink,
  Store,
  Check,
  X,
  Award,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { connectDB } from "@/app/lib/mongodb";
import AffiliateProduct from "@/app/models/affiliateProduct";
import Category from "@/app/models/category";
import StoreModel from "@/app/models/store";

export const revalidate = 60; // ISR 60 Seconds

// ── 1. Fetch Product Data Helper ──────────────────────────────────────────────
async function getProductBySlug(slug) {
  try {
    await connectDB();
    const cleanSlug = String(slug || "").trim().toLowerCase();

    const product = await AffiliateProduct.findOne({ slug: cleanSlug })
      .populate("categoryId", "name slug icon uiConfig.themeColor")
      .populate("storeId", "name slug logo website")
      .lean();

    if (!product) return null;

    // Convert MongoDB ObjectIds & Dates to string for Next.js Serializability
    return JSON.parse(JSON.stringify(product));
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    return null;
  }
}

// ── 2. SEO Dynamic Metadata Generator ─────────────────────────────────────────
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested affiliate deal or product does not exist.",
    };
  }

  const title = product.seoTitle || `${product.title} - Best Deals & Review`;
  const description =
    product.seoDescription ||
    product.shortDescription ||
    `Get the best price on ${product.title}. Fully verified deal with expert review and ratings.`;

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: primaryImage ? [{ url: primaryImage, alt: product.title }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: primaryImage ? [primaryImage] : [],
    },
  };
}

// ── 3. Product Detail Page Component ──────────────────────────────────────────
export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);

  if (!product) {
    notFound();
  }

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    "/placeholder-image.jpg";

  const storeName =
    product.brandName || product.storeId?.name || "Verified Merchant";
  const verifiedDate = product.lastVerifiedAt
    ? new Date(product.lastVerifiedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Convert Specifications Map/Object to array for rendering
  const specList = product.specifications
    ? Object.entries(product.specifications)
    : [];

  // Schema.org Product JSON-LD for Google Search Rich Snippets
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    image: product.images?.map((img) => img.url) || [primaryImage],
    description: product.shortDescription || product.description,
    brand: {
      "@type": "Brand",
      name: storeName,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency || "USD",
      price: product.price,
      availability: "https://schema.org/InStock",
      url: product.affiliateLink,
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount || 1,
      },
    }),
  };

  return (
    <>
      {/* Google Product Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="bg-navy-900 min-h-screen py-8 md:py-12 text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* ── Breadcrumb Navigation ──────────────────────────────────── */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-lavender-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link
              href="/"
              className="hover:text-purple-400 transition-colors"
            >
              Home
            </Link>
            <ChevronRight size={14} className="text-lavender-500" />
            <Link
              href="/products"
              className="hover:text-purple-400 transition-colors"
            >
              Products
            </Link>
            {product.categoryId?.name && (
              <>
                <ChevronRight size={14} className="text-lavender-500" />
                <Link
                  href={`/categories/${product.categoryId.slug}`}
                  className="hover:text-purple-400 transition-colors"
                >
                  {product.categoryId.name}
                </Link>
              </>
            )}
            <ChevronRight size={14} className="text-lavender-500" />
            <span className="text-white font-semibold truncate max-w-[200px] md:max-w-[300px]">
              {product.title}
            </span>
          </nav>

          {/* ── Top Hero Spotlight Container ───────────────────────────── */}
          <div className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] shadow-[0_8px_30px_rgba(6,7,19,0.5)] overflow-hidden p-6 md:p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left Column: Image Gallery */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="relative aspect-square w-full rounded-2xl bg-navy-950 border border-[var(--indigo-line)] overflow-hidden group">
                  {/* Ribbons & Badges */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {product.ribbonText && (
                      <span className="bg-purple-600 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                        {product.ribbonText}
                      </span>
                    )}
                    {product.discountPercentage > 0 && (
                      <span className="bg-purple-500 text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-md uppercase tracking-wider">
                        {product.discountPercentage}% OFF
                      </span>
                    )}
                  </div>

                  <Image
                    src={primaryImage}
                    alt={product.images?.[0]?.alt || product.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Additional Thumbnails */}
                {product.images?.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    {product.images.map((img, index) => (
                      <div
                        key={index}
                        className="relative w-16 h-16 rounded-xl border border-[var(--indigo-line)] overflow-hidden flex-shrink-0 bg-navy-950"
                      >
                        <Image
                          src={img.url}
                          alt={img.alt || `Thumbnail ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Title, Rating, Price, CTA */}
              <div className="lg:col-span-7 flex flex-col">
                {/* Brand & Store */}
                <div className="flex items-center gap-2 text-lavender-400 font-bold text-[12px] uppercase tracking-wider mb-3">
                  <Store size={15} className="text-purple-400" />
                  <span>{storeName}</span>
                  {product.awardBadge && (
                    <>
                      <span className="text-lavender-500">•</span>
                      <span className="text-yellow-400 font-extrabold inline-flex items-center gap-1">
                        <Award size={14} /> {product.awardBadge}
                      </span>
                    </>
                  )}
                </div>

                {/* Main Title */}
                <h1 className="text-[28px] md:text-[38px] font-black leading-[1.2] text-white mb-4">
                  {product.title}
                </h1>

                {/* Rating & Verified Tag */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {product.rating && (
                    <div className="flex items-center gap-1.5 bg-purple-500/15 border border-purple-500/30 px-3 py-1.5 rounded-xl">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            fill={s <= product.rating ? "currentColor" : "none"}
                            strokeWidth={s <= product.rating ? 0 : 1.5}
                          />
                        ))}
                      </div>
                      <span className="font-black text-[13px] text-white">
                        {product.rating.toFixed(1)}
                      </span>
                      <span className="text-lavender-400 text-[12px]">
                        ({product.reviewCount || 0} reviews)
                      </span>
                    </div>
                  )}

                  {verifiedDate && (
                    <div className="flex items-center gap-1.5 text-lavender-400 text-[13px] font-medium">
                      <ShieldCheck size={16} className="text-emerald-400" />
                      <span>Verified: {verifiedDate}</span>
                    </div>
                  )}
                </div>

                {/* Short Description */}
                <p className="text-lavender-400 text-[16px] leading-relaxed mb-6">
                  {product.shortDescription}
                </p>

                {/* Price Block */}
                <div className="p-5 rounded-2xl bg-navy-700/60 border border-[var(--indigo-line)] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[12px] font-bold uppercase tracking-wider text-lavender-400 mb-1">
                      Discounted Offer Price
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[32px] md:text-[40px] font-black text-white">
                        {product.currency === "USD" ? "$" : ""}
                        {Number(product.price).toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[18px] text-lavender-500 line-through font-semibold">
                          {product.currency === "USD" ? "$" : ""}
                          {Number(product.originalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expert Score Metric Badge */}
                  {product.expertScore && (
                    <div className="flex items-center gap-3 bg-navy-800 px-4 py-2.5 rounded-xl border border-[var(--indigo-line)] shadow-sm">
                      <div className="text-right">
                        <div className="text-[10px] font-extrabold uppercase text-lavender-400">
                          Expert Rating
                        </div>
                        <div className="text-[18px] font-black text-purple-400">
                          {product.expertScore}/10
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                        <TrendingUp size={20} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Outbound Affiliate CTA */}
                <a
                  href={product.affiliateLink}
                  target="_blank"
                  rel="sponsored nofollow noopener"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-[16px] transition-all duration-200 shadow-lg shadow-purple-500/25 hover:scale-[1.01]"
                >
                  <span>{product.ctaText || "View Deal at Store"}</span>
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>

          {/* ── Middle Grid: Pros, Cons & Highlights ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
            {/* Pros & Cons Section */}
            {(product.pros?.length > 0 || product.cons?.length > 0) && (
              <div className="lg:col-span-7 bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-8 shadow-sm">
                <h2 className="text-[20px] font-black mb-6 text-white">
                  Expert Analysis: Pros & Cons
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Pros */}
                  {product.pros?.length > 0 && (
                    <div className="bg-emerald-950/30 p-5 rounded-2xl border border-emerald-800/40">
                      <h3 className="text-emerald-300 font-extrabold text-[15px] mb-3 flex items-center gap-2">
                        <Check size={18} className="text-emerald-400" /> What We Like
                      </h3>
                      <ul className="space-y-2.5">
                        {product.pros.map((pro, index) => (
                          <li
                            key={index}
                            className="text-[14px] text-emerald-200 flex items-start gap-2"
                          >
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cons */}
                  {product.cons?.length > 0 && (
                    <div className="bg-rose-950/30 p-5 rounded-2xl border border-rose-800/40">
                      <h3 className="text-rose-300 font-extrabold text-[15px] mb-3 flex items-center gap-2">
                        <X size={18} className="text-rose-400" /> Drawbacks
                      </h3>
                      <ul className="space-y-2.5">
                        {product.cons.map((con, index) => (
                          <li
                            key={index}
                            className="text-[14px] text-rose-200 flex items-start gap-2"
                          >
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Line Summary */}
                {product.bottomLine && (
                  <div className="mt-6 pt-6 border-t border-[var(--indigo-line)]">
                    <h4 className="text-[13px] font-extrabold uppercase text-lavender-400 mb-2">
                      The Bottom Line
                    </h4>
                    <p className="text-[15px] italic text-white leading-relaxed bg-navy-700/50 p-4 rounded-xl border border-[var(--indigo-line)]">
                      "{product.bottomLine}"
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Key Highlights Section */}
            {product.highlights?.length > 0 && (
              <div className="lg:col-span-5 bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-8 shadow-sm">
                <h2 className="text-[20px] font-black mb-6 text-white">
                  Key Feature Highlights
                </h2>
                <ul className="space-y-3">
                  {product.highlights.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 bg-navy-700/50 p-3.5 rounded-xl border border-[var(--indigo-line)]"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check size={14} strokeWidth={3} />
                      </div>
                      <span className="text-[14px] font-semibold text-white">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Lower Section: Specifications & Detailed Content ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Full Editorial Description */}
            {product.description && (
              <div className="lg:col-span-7 bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-8 shadow-sm">
                <h2 className="text-[20px] font-black mb-4 text-white">
                  Product Overview & Review
                </h2>
                <div className="text-lavender-400 text-[15px] leading-relaxed space-y-4">
                  {product.description}
                </div>
              </div>
            )}

            {/* Specifications Map Table */}
            {specList.length > 0 && (
              <div className="lg:col-span-5 bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-8 shadow-sm">
                <h2 className="text-[20px] font-black mb-6 text-white">
                  Technical Specifications
                </h2>
                <div className="divide-y divide-[var(--indigo-line)] border border-[var(--indigo-line)] rounded-2xl overflow-hidden">
                  {specList.map(([key, val], idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 text-[14px] odd:bg-navy-700/40 even:bg-navy-800"
                    >
                      <span className="font-semibold text-lavender-400">{key}</span>
                      <span className="font-bold text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </>
  );
}