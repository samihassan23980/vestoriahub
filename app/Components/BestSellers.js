"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Store,
  Flame,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { gsap } from "gsap";

// Enriched Affiliate Product Data
const bestSellerProducts = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop",
    merchant: "AMAZON",
    name: "Nike React Phantom Run Flyknit 2",
    price: "$119.00",
    oldPrice: "$145.00",
    discount: "18% OFF",
    rating: 4.8,
    reviews: 1245,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1595309849731-f7ce86eda9fc?q=80&w=800&auto=format&fit=crop",
    merchant: "AMAZON",
    name: "CeraVe Hydrating Facial Cleanser 16oz",
    price: "$14.99",
    oldPrice: "$17.99",
    discount: "15% OFF",
    rating: 4.9,
    reviews: 8432,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1634316427425-722247ebe036?q=80&w=800&auto=format&fit=crop",
    merchant: "AWAY",
    name: "The Carry-On Suitcase in Coast Blue",
    price: "$295.00",
    oldPrice: null,
    discount: null,
    rating: 4.9,
    reviews: 3120,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1552010534-e4e817b173c2?q=80&w=800&auto=format&fit=crop",
    merchant: "QUINCE",
    name: "Italian Leather Kitten Heel Boots",
    price: "$99.90",
    oldPrice: "$198.00",
    discount: "50% OFF",
    rating: 4.7,
    reviews: 412,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1679284392387-250597360be3?q=80&w=800&auto=format&fit=crop",
    merchant: "AMAZON",
    name: "Keychron K2 Wireless Mechanical Keyboard",
    price: "$79.99",
    oldPrice: "$99.00",
    discount: "20% OFF",
    rating: 4.6,
    reviews: 2890,
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1679284393460-fbaecec5fcab?q=80&w=800&auto=format&fit=crop",
    merchant: "CVS",
    name: "PS by POPSUGAR Evolve Crop Tank Top",
    price: "$22.00",
    oldPrice: null,
    discount: null,
    rating: 4.5,
    reviews: 89,
  },
];

const BestSellers = () => {
  const sliderRef = useRef(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);

  // Card width + Gap
  const cardWidth = 360;
  const gap = 32;
  const slideAmount = cardWidth + gap;

  useEffect(() => {
    const calculateBounds = () => {
      if (sliderRef.current) {
        const containerWidth = sliderRef.current.parentElement.offsetWidth;
        const totalContentWidth = bestSellerProducts.length * slideAmount - gap;
        const max = Math.max(0, totalContentWidth - containerWidth);
        setMaxScroll(max);

        setCurrentPosition(0);
        gsap.set(sliderRef.current, { x: 0 });
      }
    };

    calculateBounds();
    window.addEventListener("resize", calculateBounds);
    return () => window.removeEventListener("resize", calculateBounds);
  }, []);

  const slide = (direction) => {
    if (!sliderRef.current) return;

    let newPos = currentPosition;
    if (direction === "next") {
      newPos += slideAmount;
      if (newPos > maxScroll) newPos = maxScroll;
    } else {
      newPos -= slideAmount;
      if (newPos < 0) newPos = 0;
    }

    setCurrentPosition(newPos);

    gsap.to(sliderRef.current, {
      x: -newPos,
      duration: 0.75,
      ease: "power3.out",
    });
  };

  return (
    // Premium Dark Background using Navy base and soft gradients
    <section className="bg-gradient-to-b from-[var(--color-navy-900)] to-[var(--color-background)] py-[100px] relative overflow-hidden">
      {/* ─── AMBIENT BACKGROUND GLOWS ─── */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-primary)] opacity-[0.06] blur-[150px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--color-secondary)] opacity-[0.04] blur-[120px] rounded-full pointer-events-none -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[56px] gap-8">
          <div className="max-w-2xl">
            {/* Highlight Tag */}
            <div className="inline-flex items-center gap-2 px-[14px] py-[8px] rounded-[8px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-secondary)] text-[12px] font-bold uppercase tracking-wider mb-5 shadow-[0_4px_12px_rgba(3,4,10,0.5)]">
              <Flame
                size={16}
                className="text-[var(--color-secondary)]"
                strokeWidth={2.5}
              />
              Editor's Top Picks
            </div>

            {/* Typography */}
            <h2 className="text-[var(--color-text-primary)] font-extrabold text-[40px] md:text-[48px] leading-[1.1] tracking-tight mb-4">
              Trending Deals Right Now
            </h2>
            <p className="text-[var(--color-text-secondary)] text-[16px] md:text-[18px] leading-[1.7] max-w-[540px]">
              Hand-selected daily discounts with strictly verified inventory.
              Don't wait—these exclusive drops usually expire within 24 hours.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="#"
              className="hidden sm:inline-flex items-center gap-1.5 text-[var(--color-primary)] font-bold text-[16px] hover:text-[var(--color-primary-hover)] transition-colors group"
            >
              View All Deals
              <ArrowUpRight
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </a>

            {/* Navigation Controls */}
            <div className="flex gap-3">
              <button
                onClick={() => slide("prev")}
                disabled={currentPosition === 0}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 border-[1.5px] ${
                  currentPosition === 0
                    ? "border-[var(--color-border)] text-[var(--color-text-secondary)]/30 cursor-not-allowed bg-transparent"
                    : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer bg-[var(--color-surface)] shadow-sm hover:shadow-md"
                }`}
                aria-label="Previous items"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>
              <button
                onClick={() => slide("next")}
                disabled={currentPosition >= maxScroll}
                className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all duration-300 ${
                  currentPosition >= maxScroll
                    ? "bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]/50 cursor-not-allowed"
                    : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] cursor-pointer shadow-[0_8px_20px_rgba(124,92,252,0.25)] hover:shadow-[0_12px_24px_rgba(124,92,252,0.35)] hover:-translate-y-0.5"
                }`}
                aria-label="Next items"
              >
                <ChevronRight size={24} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── GSAP SLIDER VIEWPORT ─── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ margin: "-32px", padding: "32px" }} // Allows shadows to render without clipping
        >
          <div className="flex gap-[32px] w-max" ref={sliderRef}>
            {bestSellerProducts.map((product) => (
              <div key={product.id} className="w-[360px] shrink-0">
                {/* ─── PRODUCT CARD ─── */}
                <div className="bg-[var(--color-surface)] h-full flex flex-col rounded-[24px] border border-[var(--color-border)] shadow-[0_4px_20px_rgba(3,4,10,0.5)] overflow-hidden transition-all duration-500 ease-out hover:shadow-[0_24px_48px_rgba(124,92,252,0.15)] hover:border-[var(--color-primary)]/50 hover:-translate-y-1 group">
                  {/* Image Container */}
                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-[var(--color-navy-900)]">
                    {product.discount && (
                      <div className="absolute top-[16px] left-[16px] bg-[var(--color-danger)] text-white text-[12px] font-bold px-[12px] py-[6px] rounded-[8px] z-10 shadow-[0_4px_12px_rgba(248,113,113,0.3)] tracking-wide flex items-center gap-1.5">
                        <Sparkles size={14} />
                        {product.discount}
                      </div>
                    )}
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    {/* Inner shadow overlay for premium feel */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                  </div>

                  {/* Content Container */}
                  <div className="p-[28px] flex flex-col flex-grow">
                    {/* Merchant / Brand */}
                    <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-bold text-[12px] uppercase tracking-[0.1em] mb-[12px]">
                      <Store size={14} />
                      {product.merchant}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-[var(--color-text-primary)] font-bold text-[20px] leading-[1.3] mb-[12px] line-clamp-2 transition-colors group-hover:text-[var(--color-primary)]">
                      {product.name}
                    </h3>

                    {/* Ratings */}
                    <div className="flex items-center gap-2 mb-[24px]">
                      <div className="flex items-center text-[var(--color-warning)]">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={
                              i < Math.floor(product.rating)
                                ? "currentColor"
                                : "none"
                            }
                            className={
                              i < Math.floor(product.rating)
                                ? ""
                                : "text-[var(--color-border)] fill-[var(--color-border)]"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[var(--color-text-secondary)] text-[13px] font-semibold mt-0.5">
                        ({product.reviews.toLocaleString()})
                      </span>
                    </div>

                    {/* Pushes price & CTA to bottom if title is short */}
                    <div className="mt-auto"></div>

                    {/* Pricing & CTA Wrapper */}
                    <div className="pt-[24px] border-t border-[var(--color-border)] mt-[8px]">
                      <div className="flex items-end justify-between mb-[20px]">
                        <div>
                          <p className="text-[var(--color-text-secondary)] text-[12px] font-semibold uppercase tracking-wider mb-1">
                            Price Drop
                          </p>
                          <div className="flex items-baseline gap-2.5">
                            <span className="text-[var(--color-text-primary)] font-extrabold text-[28px] leading-none">
                              {product.price}
                            </span>
                            {product.oldPrice && (
                              <span className="text-[var(--color-text-secondary)] opacity-60 text-[16px] font-bold line-through decoration-2">
                                {product.oldPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Primary CTA Button */}
                      <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white py-[14px] rounded-[12px] font-bold text-[16px] transition-all duration-300 ease-out group/btn">
                        Claim Deal
                        <ArrowUpRight
                          size={18}
                          className="transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
