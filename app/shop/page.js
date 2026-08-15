"use client";
import React from "react";
import Link from "next/link";
import {
  Star,
  StarHalf,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  Grid3X3,
  ArrowRight,
  Clock,
} from "lucide-react";

const CategoryLandingPage = () => {
  // ─── DUMMY DATA: CATEGORY ───────────────────────────────────────────────────
  const category = {
    name: "Ergonomic Office Chairs",
    slug: "ergonomic-office-chairs",
    description:
      "<p>Investing in a high-quality ergonomic chair is essential for long hours at the desk. We have tested and reviewed the top models of 2026 based on lumbar support, adjustability, and overall build quality. Whether you're gaming, coding, or managing a business, these are our top picks.</p>",
    uiConfig: {
      heroHeadline: "The Best Ergonomic Chairs for 2026",
      heroSubtitle:
        "Tested, reviewed, and ranked by our workspace experts. Save your back and boost your productivity.",
      themeColor: "#F4A836",
      keyFeatures: ["Tested by Experts", "Updated Monthly", "Verified Deals"],
      heroBanner: {
        url: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?q=80&w=2000&auto=format&fit=crop",
        alt: "Modern office setup",
      },
    },
    aggregateRating: { ratingValue: 4.8, reviewCount: 1240 },
  };

  // ─── DUMMY DATA: TOP PICKS (Matches schema: isTopPick: true, displayVariant: "featured_horizontal")
  const topPicks = [
    {
      id: "prod_1",
      title: "Herman Miller Aeron Ergonomic Chair",
      brandName: "Herman Miller",
      shortDescription:
        "The gold standard of office seating. Features advanced PostureFit SL hardware.",
      ribbonText: "Editor's Choice", // NEW SCHEMA FIELD
      expertScore: 9.8, // NEW SCHEMA FIELD
      displayVariant: "featured_horizontal", // NEW SCHEMA FIELD
      lastVerifiedAt: new Date().toISOString(), // NEW SCHEMA FIELD
      pros: [
        "Unmatched lumbar support",
        "Breathable mesh material",
        "12-year warranty",
      ],
      cons: ["Premium price tag", "Headrest sold separately"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&auto=format&fit=crop",
          alt: "Herman Miller Aeron",
        },
      ],
      price: 1250.0,
      originalPrice: 1400.0,
      discountPercentage: 11,
      affiliateLink: "#",
      ctaText: "Check Price",
      rating: 4.9, // User rating
      reviewCount: 3420,
    },
    {
      id: "prod_2",
      title: "Steelcase Leap Fabric Task Chair",
      brandName: "Steelcase",
      shortDescription:
        "Incredible adjustability with LiveBack technology that changes shape to support your spine.",
      ribbonText: "Best Ergonomics", // NEW SCHEMA FIELD
      expertScore: 9.5, // NEW SCHEMA FIELD
      displayVariant: "featured_horizontal", // NEW SCHEMA FIELD
      lastVerifiedAt: new Date().toISOString(), // NEW SCHEMA FIELD
      pros: [
        "LiveBack technology",
        "Highly adjustable armrests",
        "Excellent seat depth",
      ],
      cons: ["Seat pad can run warm"],
      images: [
        {
          url: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?w=500&auto=format&fit=crop",
          alt: "Steelcase Leap",
        },
      ],
      price: 899.99,
      originalPrice: 1050.0,
      discountPercentage: 14,
      affiliateLink: "#",
      ctaText: "View Deal",
      rating: 4.7, // User rating
      reviewCount: 2150,
    },
  ];

  // ─── DUMMY DATA: TRENDING (Matches schema: isHotDeal: true, displayVariant: "compact_grid")
  const trendingProducts = Array(6)
    .fill(null)
    .map((_, i) => ({
      id: `trend_${i}`,
      title: `Premium Office Chair Series ${i + 1}`,
      brandName: "ErgoPro",
      price: 299.0 - i * 10,
      originalPrice: 399.0,
      discountPercentage: Math.round(((399 - (299 - i * 10)) / 399) * 100),
      rating: 4.6,
      reviewCount: 450 + i * 12,
      images: [
        {
          url: `https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&auto=format&fit=crop&q=60`,
          alt: "Chair",
        },
      ],
      ribbonText: i === 0 ? "Hot Deal" : i === 2 ? "50% Off" : null, // NEW SCHEMA FIELD
      displayVariant: "compact_grid", // NEW SCHEMA FIELD
      affiliateLink: "#",
    }));

  // ─── DUMMY DATA: ALL PRODUCTS (Matches schema: displayVariant: "standard")
  const gridProducts = Array(12)
    .fill(null)
    .map((_, i) => ({
      id: `grid_${i}`,
      title: `Standard Desk Chair Model ${i + 10}`,
      brandName: i % 2 === 0 ? "Branch" : "HON",
      price: 199.0 + i * 5,
      rating: 4.2 + (i % 5) * 0.1,
      reviewCount: 120 + i * 5,
      displayVariant: "standard", // NEW SCHEMA FIELD
      images: [
        {
          url: `https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=500&auto=format&fit=crop&q=60`,
          alt: "Chair",
        },
      ],
      affiliateLink: "#",
    }));

  // Helper to render stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars)
        stars.push(
          <Star key={i} size={14} className="fill-[#F4A836] text-[#F4A836]" />,
        );
      else if (i === fullStars && hasHalfStar)
        stars.push(
          <StarHalf
            key={i}
            size={14}
            className="fill-[#F4A836] text-[#F4A836]"
          />,
        );
      else stars.push(<Star key={i} size={14} className="text-[#E0DEF5]" />);
    }
    return stars;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] font-sans pb-20">
      {/* ─── 1. HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative w-full bg-[#1A1340] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={category.uiConfig.heroBanner.url}
            alt={category.uiConfig.heroBanner.alt}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1340]/80 to-[#1A1340]"></div>
        </div>
        <div className="max-w-[1280px] mx-auto px-6 py-16 md:py-24 relative z-10 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#A09EC0] mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link
              href="/categories"
              className="hover:text-white transition-colors"
            >
              Categories
            </Link>
            <ChevronRight size={14} />
            <span className="text-[#F4A836]">{category.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-4xl">
            {category.uiConfig.heroHeadline || category.name}
          </h1>
          <p className="text-[18px] text-[#A09EC0] max-w-2xl leading-relaxed mb-8">
            {category.uiConfig.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6">
            {category.uiConfig.keyFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20"
              >
                <ShieldCheck size={16} className="text-[#22B07D]" />
                <span className="text-white text-[13px] font-semibold">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 2. TRUST BAR ───────────────────────────────────────────────────── */}
      {category.aggregateRating.reviewCount > 0 && (
        <div className="bg-white border-b border-[#E0DEF5] shadow-sm">
          <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-[#2D2380]" />
              <span className="text-[#1A1340] font-bold text-[15px]">
                Category Rating:
              </span>
              <div className="flex items-center gap-1">
                {renderStars(category.aggregateRating.ratingValue)}
              </div>
              <span className="text-[#7775A0] text-[14px] font-medium">
                {category.aggregateRating.ratingValue} out of 5
              </span>
            </div>
            <div className="text-[13px] text-[#7775A0] font-medium">
              Based on{" "}
              <span className="text-[#1A1340] font-bold">
                {category.aggregateRating.reviewCount}
              </span>{" "}
              verified reviews
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1280px] mx-auto px-6 mt-12">
        {/* ─── 3. TOP EXPERT PICKS (Listicle Layout mapping to 'featured_horizontal') ────────────────────────── */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Award size={28} className="text-[#F4A836]" />
            <h2 className="text-[28px] font-bold text-[#1A1340]">
              Our Top Picks
            </h2>
          </div>
          <div className="space-y-6 max-w-[1000px]">
            {topPicks.map((product, index) => (
              <article
                key={product.id}
                className="bg-white rounded-xl border border-[#E0DEF5] shadow-[0_2px_12px_rgba(26,19,64,0.05)] hover:shadow-[0_8px_24px_rgba(26,19,64,0.12)] hover:border-[#4A3DBF] transition-all duration-200 overflow-hidden group flex flex-col md:flex-row"
              >
                {/* Image Section */}
                <div className="md:w-[300px] shrink-0 bg-[#F7F6FF] relative p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-[#E0DEF5]">
                  <div className="absolute top-0 left-0 bg-[#1A1340] text-white w-10 h-10 flex items-center justify-center font-bold text-lg rounded-br-xl z-10">
                    #{index + 1}
                  </div>
                  <img
                    src={product.images[0]?.url}
                    alt={product.title}
                    className="w-full max-h-[220px] object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content Section */}
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Dynamic Ribbon Text */}
                        {product.ribbonText && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wide rounded-md">
                            <Award size={14} /> {product.ribbonText}
                          </span>
                        )}
                        <span className="text-[#7775A0] text-[12px] font-semibold tracking-wide uppercase">
                          {product.brandName}
                        </span>
                      </div>

                      {/* Dynamic Expert Score vs User Rating */}
                      {product.expertScore && (
                        <div className="bg-[#22B07D] text-white text-[12px] font-bold px-2 py-1 rounded flex items-center gap-1">
                          Expert Score: {product.expertScore}/10
                        </div>
                      )}
                    </div>

                    <h3 className="text-[22px] font-bold text-[#1A1340] leading-tight mb-2 group-hover:text-[#2D2380] transition-colors">
                      {product.title}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">{renderStars(product.rating)}</div>
                      <span className="text-[13px] font-semibold text-[#1A1340]">
                        {product.rating}{" "}
                        <span className="font-normal text-[#7775A0]">
                          User Rating
                        </span>
                      </span>
                      <span className="text-[12px] text-[#7775A0]">
                        ({product.reviewCount} reviews)
                      </span>
                    </div>

                    <p className="text-[#7775A0] text-[14px] leading-relaxed mb-5">
                      {product.shortDescription}
                    </p>

                    {/* Pros/Cons Compact */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <ul className="space-y-1.5">
                        {product.pros.map((pro, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[12px] text-[#1A1340]"
                          >
                            <CheckCircle2
                              size={14}
                              className="text-[#22B07D] shrink-0 mt-0.5"
                            />{" "}
                            <span className="line-clamp-1">{pro}</span>
                          </li>
                        ))}
                      </ul>
                      <ul className="space-y-1.5">
                        {product.cons.map((con, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-[12px] text-[#7775A0]"
                          >
                            <XCircle
                              size={14}
                              className="text-[#E24B4A] shrink-0 mt-0.5"
                            />{" "}
                            <span className="line-clamp-1">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA & Trust Signals */}
                  <div className="pt-5 border-t border-[#E0DEF5] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-[#1A1340]">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[14px] text-[#A09EC0] font-semibold line-through">
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {/* Price Verification Trust Signal */}
                      {product.lastVerifiedAt && (
                        <div className="flex items-center gap-1 text-[11px] text-[#22B07D] mt-1 font-medium">
                          <Clock size={12} /> Price verified{" "}
                          {formatDate(product.lastVerifiedAt)}
                        </div>
                      )}
                    </div>

                    <a
                      href={product.affiliateLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#FF6B35] hover:bg-[#e05520] text-white rounded-lg font-bold text-[14px] transition-all transform hover:-translate-y-0.5"
                    >
                      {product.ctaText} <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* ─── 4. TRENDING & HOT DEALS (Horizontal Slider mapping to 'compact_grid') ────────────────────── */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Zap size={24} className="text-[#FF6B35]" />
              <h2 className="text-[24px] font-bold text-[#1A1340]">
                Hot Deals & Trending
              </h2>
            </div>
            <div className="hidden sm:flex gap-2">
              <button className="w-10 h-10 rounded-full bg-white border border-[#E0DEF5] flex items-center justify-center text-[#1A1340] hover:bg-[#EEEDFE] hover:border-[#2D2380] transition-colors">
                <ChevronRight className="rotate-180" size={20} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white border border-[#E0DEF5] flex items-center justify-center text-[#1A1340] hover:bg-[#EEEDFE] hover:border-[#2D2380] transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {trendingProducts.map((product) => (
              <a
                href={product.affiliateLink}
                key={product.id}
                className="snap-start shrink-0 w-[260px] bg-white rounded-xl border border-[#E0DEF5] shadow-sm hover:shadow-lg hover:border-[#4A3DBF] transition-all group flex flex-col overflow-hidden"
              >
                <div className="h-[200px] bg-[#F7F6FF] relative p-4 flex items-center justify-center border-b border-[#E0DEF5]">
                  {/* Using ribbonText and dynamic discount calculation */}
                  {product.ribbonText && (
                    <span className="absolute top-3 left-3 bg-[#FF6B35] text-white text-[10px] font-bold uppercase px-2 py-1 rounded z-10">
                      {product.ribbonText}
                    </span>
                  )}
                  {product.discountPercentage > 0 && !product.ribbonText && (
                    <span className="absolute top-3 left-3 bg-[#E24B4A] text-white text-[10px] font-bold uppercase px-2 py-1 rounded z-10">
                      {product.discountPercentage}% OFF
                    </span>
                  )}
                  <img
                    src={product.images[0]?.url}
                    alt={product.title}
                    className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[#7775A0] text-[11px] font-bold uppercase tracking-wider mb-1">
                    {product.brandName}
                  </span>
                  <h3 className="text-[15px] font-bold text-[#1A1340] leading-snug mb-2 line-clamp-2 group-hover:text-[#2D2380]">
                    {product.title}
                  </h3>
                  <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex">{renderStars(product.rating)}</div>
                    <span className="text-[11px] text-[#7775A0]">
                      ({product.reviewCount})
                    </span>
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div className="flex flex-col">
                      {product.originalPrice && (
                        <span className="text-[12px] text-[#A09EC0] line-through">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl font-bold text-[#1A1340]">
                        ${product.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#EEEDFE] text-[#2D2380] flex items-center justify-center group-hover:bg-[#2D2380] group-hover:text-white transition-colors">
                      <ExternalLink size={14} />
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ─── 5. EXPLORE ALL PRODUCTS (Dense Grid mapping to 'standard') ───────────── */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b border-[#E0DEF5] pb-4">
            <div className="flex items-center gap-3">
              <Grid3X3 size={24} className="text-[#2D2380]" />
              <h2 className="text-[24px] font-bold text-[#1A1340]">
                All Chairs ({gridProducts.length + 50})
              </h2>
            </div>
            {/* Minimal Filter/Sort UI Concept */}
            <select className="bg-white border border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-4 rounded-lg outline-none focus:border-[#2D2380]">
              <option>Sort by: Recommended</option>
              <option>Price: Low to High</option>
              <option>Highest Rated</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gridProducts.map((product) => (
              <a
                href={product.affiliateLink}
                key={product.id}
                className="bg-white rounded-xl border border-[#E0DEF5] hover:border-[#4A3DBF] hover:shadow-md transition-all group flex flex-col overflow-hidden"
              >
                <div className="h-[180px] bg-[#F7F6FF] relative p-4 flex items-center justify-center border-b border-[#E0DEF5]">
                  <img
                    src={product.images[0]?.url}
                    alt={product.title}
                    className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[14px] font-bold text-[#1A1340] leading-snug mb-1 line-clamp-2 group-hover:text-[#2D2380]">
                    {product.title}
                  </h3>
                  <span className="text-[#7775A0] text-[12px] mb-2">
                    {product.brandName}
                  </span>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-lg font-bold text-[#1A1340]">
                      ${product.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 bg-[#EEEDFE] px-2 py-1 rounded text-[#2D2380]">
                      <Star
                        size={12}
                        className="fill-[#F4A836] text-[#F4A836]"
                      />
                      <span className="text-[12px] font-bold">
                        {product.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Load More Button */}
          <div className="mt-10 flex justify-center">
            <button className="flex items-center gap-2 px-8 py-3 bg-white border-2 border-[#2D2380] text-[#2D2380] font-bold rounded-lg hover:bg-[#EEEDFE] transition-colors">
              Load More Products <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 6. SEO EDITORIAL CONTENT (Bottom of page) ──────────────────────── */}
      <section className="bg-white border-t border-[#E0DEF5]">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          <h3 className="text-2xl font-bold text-[#1A1340] mb-6">
            A Buyer's Guide to {category.name}
          </h3>
          <div
            className="prose prose-slate max-w-none text-[#7775A0] leading-relaxed text-[15px]"
            dangerouslySetInnerHTML={{ __html: category.description }}
          />
        </div>
      </section>
    </div>
  );
};

export default CategoryLandingPage;
