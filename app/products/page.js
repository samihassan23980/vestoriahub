"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  ExternalLink,
  Store,
  LayoutGrid,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = useCallback(async (pageNumber = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const response = await fetch(
        `/api/public/affiliate-products?page=${pageNumber}&limit=12&sort=newest`
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const json = await response.json();

      if (json.success) {
        const fetchedList = json.data || [];

        if (isLoadMore) {
          // Prevent duplicates on continuous loading
          setProducts((prev) => {
            const existingIds = new Set(prev.map((item) => item._id));
            const newItems = fetchedList.filter((item) => !existingIds.has(item._id));
            return [...prev, ...newItems];
          });
        } else {
          setProducts(fetchedList);
        }

        setHasMore(json.pagination?.hasNextPage || false);
      } else {
        throw new Error(json.error || "Failed to parse product data.");
      }
    } catch (error) {
      console.error("Error fetching shop products:", error);

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "We couldn't load the curated deals right now. Please try again.",
        confirmButtonColor: "#1C352D",
        background: "#FFFFFF",
        color: "#16241F",
        iconColor: "#C1432F",
        customClass: {
          popup: "rounded-2xl border border-[#E2D9CC] shadow-xl",
          confirmButton: "rounded-xl font-bold px-6 py-2.5 !text-[#FDFBF7]",
        },
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1, false);
  }, [fetchProducts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  return (
    <div className="bg-[#F8F0E5] min-h-screen font-sans pb-24">
      {/* ── HERO SECTION WITH S-WAVE ACCENT ── */}
      <section className="relative bg-[#10201B] overflow-hidden border-b border-[#25473C] text-[#FDFBF7] py-16 md:py-24">
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
        <div className="absolute top-0 right-10 w-[450px] h-[450px] bg-[#D9A441]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[380px] h-[380px] bg-[#1C352D] rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-[#162B24] text-[#D9A441] border border-[#25473C] text-[11px] font-heading font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5 shadow-xs">
            <Sparkles size={13} />
            <span>Curated Marketplace Catalog</span>
          </div>

          <h1 className="text-[#FDFBF7] text-[34px] sm:text-[46px] md:text-[54px] font-heading font-black tracking-tight leading-[1.08] mb-4">
            Curated Deals & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
              Verified Product Drops.
            </span>
          </h1>

          <p className="text-[#D5E4D9] text-[15px] md:text-[16.5px] max-w-[620px] mx-auto leading-relaxed font-normal mb-8">
            Explore strictly vetted products, verified flash sales, and price drops from premier merchant partners globally. Tested daily to ensure real savings.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] font-mono text-[#A8C3B0]">
            <span className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-3.5 py-1.5 rounded-full">
              <ShieldCheck size={14} className="text-[#34D399]" /> 100% Tested Prices
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-3.5 py-1.5 rounded-full">
              <Tag size={14} className="text-[#D9A441]" /> Direct Partner Links
            </span>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS GRID CONTAINER ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Results Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#E2D9CC]">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-[#D9A441]" />
            <h2 className="text-[18px] sm:text-[20px] font-heading font-extrabold text-[#10201B] tracking-tight uppercase">
              All Verified Drops
            </h2>
          </div>
          <span className="text-[12px] font-mono font-bold text-[#8A8F8C] bg-[#FFFFFF] border border-[#E2D9CC] px-3 py-1 rounded-full uppercase">
            Showing Live Deals
          </span>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Skeleton Loaders */}
          {loading &&
            [1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
              <div key={`skeleton-${skeleton}`} className="w-full">
                <div className="bg-[#FFFFFF] h-[460px] rounded-[24px] border-2 border-[#E2D9CC] overflow-hidden flex flex-col p-4 shadow-xs">
                  <div className="aspect-square bg-[#F1E7D8] rounded-[18px] animate-pulse mb-4" />
                  <div className="flex-grow flex flex-col gap-3">
                    <div className="h-3.5 bg-[#E2D9CC] rounded-full w-1/3 animate-pulse" />
                    <div className="h-5 bg-[#E2D9CC] rounded-lg w-full animate-pulse" />
                    <div className="h-5 bg-[#E2D9CC] rounded-lg w-2/3 animate-pulse" />
                    <div className="mt-auto h-11 bg-[#E2D9CC] rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}

          {/* Render Products */}
          {!loading &&
            products.map((product) => {
              const imageObj = product.images?.[0];
              const imageUrl = imageObj?.url || "/placeholder-image.jpg";
              const imageAlt = imageObj?.alt || product.title;
              const pdpUrl = `/products/${product.slug}`;

              return (
                <div key={product._id} className="w-full h-full">
                  <article className="bg-[#FFFFFF] h-full flex flex-col rounded-[24px] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] shadow-xs hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)] overflow-hidden transition-all duration-300 hover:-translate-y-1 p-4 group">
                    
                    {/* Image Container (Aspect Square + Contain) */}
                    <Link
                      href={pdpUrl}
                      className="aspect-square w-full overflow-hidden relative bg-[#FDFBF7] rounded-[18px] border border-[#E2D9CC] block p-4 mb-4 shrink-0"
                    >
                      {product.discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 bg-[#D9A441] text-[#16241F] text-[10.5px] font-heading font-black px-2.5 py-1 rounded-full z-10 shadow-xs uppercase tracking-wider">
                          {product.discountPercentage}% OFF
                        </div>
                      )}

                      <div className="relative w-full h-full">
                        <Image
                          src={imageUrl}
                          alt={imageAlt}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    </Link>

                    {/* Content Container */}
                    <div className="flex flex-col flex-grow justify-between">
                      <div>
                        {/* Store / Brand */}
                        <div className="flex items-center gap-1.5 text-[#8A8F8C] font-mono font-bold text-[11px] uppercase tracking-wider mb-2">
                          <Store size={13} className="text-[#D9A441]" />
                          <span className="truncate">
                            {product.brandName ||
                              product.storeId?.name ||
                              "Partner Store"}
                          </span>
                        </div>

                        {/* Product Title */}
                        <Link href={pdpUrl} className="block">
                          <h3
                            className="text-[#10201B] font-heading font-bold text-[16px] leading-[1.3] mb-2.5 line-clamp-2 group-hover:text-[#D9A441] transition-colors"
                            title={product.title}
                          >
                            {product.title}
                          </h3>
                        </Link>

                        {/* Rating Stars */}
                        <div className="flex items-center gap-1.5 mb-4">
                          <div className="flex items-center text-[#D9A441]">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={13}
                                fill={
                                  star <= (product.rating || 5)
                                    ? "currentColor"
                                    : "transparent"
                                }
                                strokeWidth={star <= (product.rating || 5) ? 0 : 1}
                                className={
                                  star <= (product.rating || 5) ? "" : "opacity-30"
                                }
                              />
                            ))}
                          </div>
                          <span className="text-[#6B7280] text-[11.5px] font-mono font-semibold">
                            ({product.reviewCount || 0})
                          </span>
                        </div>
                      </div>

                      {/* Pricing & Outbound Affiliate CTA */}
                      <div className="pt-3.5 border-t border-[#E2D9CC] mt-auto flex flex-col gap-3.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[#10201B] font-heading font-black text-[20px] leading-none">
                            {product.currency === "USD" ? "$" : ""}
                            {Number(product.price || 0).toFixed(2)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[#8A8F8C] text-[13px] font-mono font-medium line-through">
                              {product.currency === "USD" ? "$" : ""}
                              {Number(product.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="sponsored nofollow noopener"
                          className="w-full flex items-center justify-center gap-1.5 bg-[#EBF3EE] hover:bg-[#1C352D] text-[#1C352D] hover:text-[#FDFBF7] py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all duration-200 border border-[#BDD6C4] hover:border-[#1C352D] group/btn shadow-2xs"
                        >
                          <span>{product.ctaText || "View Deal"}</span>
                          <ExternalLink
                            size={14}
                            className="text-[#D9A441] transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                          />
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
        </div>

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-[#FFFFFF] rounded-[24px] border border-[#E2D9CC] shadow-xs mt-6">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F0E5] border border-[#E2D9CC] flex items-center justify-center mb-4 text-[#C1432F]">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-[#10201B] font-heading font-bold text-[20px] mb-2">
              No products found
            </h3>
            <p className="text-[#6B7280] text-[14px] max-w-md">
              We couldn&apos;t find any active deals in this catalog. Please check back later or explore our stores.
            </p>
          </div>
        )}

        {/* Pagination Trigger */}
        {!loading && products.length > 0 && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-heading font-bold text-[14px] transition-all duration-200 shadow-xs ${
                loadingMore
                  ? "bg-[#FFFFFF] text-[#8A8F8C] border border-[#E2D9CC] cursor-wait"
                  : "bg-[#1C352D] hover:bg-[#10201B] text-[#FDFBF7] active:scale-98"
              }`}
            >
              {loadingMore ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#D9A441] border-t-transparent rounded-full animate-spin"></span>
                  <span>Loading Deals...</span>
                </>
              ) : (
                "Load More Products"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;