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
        text: "We couldn't load the products right now. Please try again.",
        confirmButtonColor: "var(--purple-500)",
        background: "var(--navy-800)",
        color: "var(--white)",
        customClass: {
          confirmButton: "rounded-lg font-bold px-6 py-2",
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
    <section className="bg-navy-900 min-h-screen py-[60px] md:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-[var(--indigo-line)] pb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[12px] font-bold uppercase tracking-wider mb-4 shadow-sm">
              <LayoutGrid size={14} strokeWidth={2.5} />
              Complete Catalog
            </div>

            <h1 className="text-white font-bold text-[36px] md:text-[48px] leading-[1.1] tracking-tight mb-4">
              Explore All Deals & Products
            </h1>
            <p className="text-lavender-400 text-[16px] md:text-[18px] leading-relaxed">
              Browse our fully verified collection of premium products, flash
              sales, and exclusive discounts from top-rated stores globally.
            </p>
          </div>

          <div className="text-lavender-400 font-medium text-[14px]">
            Showing all verified deals
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Skeleton Loaders */}
          {loading &&
            [1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
              <div key={`skeleton-${skeleton}`} className="w-full">
                <div className="bg-navy-800 h-[460px] rounded-2xl border border-[var(--indigo-line)] overflow-hidden flex flex-col shadow-sm">
                  <div className="aspect-square bg-gradient-to-r from-navy-700 to-navy-600 animate-pulse" />
                  <div className="p-5 flex-grow flex flex-col gap-3">
                    <div className="h-3 bg-navy-700 rounded w-1/3 animate-pulse" />
                    <div className="h-5 bg-navy-700 rounded w-full animate-pulse" />
                    <div className="h-5 bg-navy-700 rounded w-2/3 animate-pulse" />
                    <div className="mt-auto h-11 bg-navy-700 rounded-xl animate-pulse" />
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
                <div key={product._id} className="w-full">
                  <div className="bg-navy-800 h-full flex flex-col rounded-2xl border border-[var(--indigo-line)] shadow-[0_4px_20px_rgba(6,7,19,0.3)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgba(124,92,252,0.25)] hover:border-purple-500 hover:-translate-y-1 group">
                    {/* Image Container (Aspect Square + Contain for Portrait & Variable Ratio Images) */}
                    <Link
                      href={pdpUrl}
                      className="aspect-square w-full overflow-hidden relative bg-navy-950 block p-4"
                    >
                      {product.discountPercentage > 0 && (
                        <div className="absolute top-3 left-3 bg-purple-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md z-10 shadow-md uppercase tracking-wide">
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
                    <div className="p-5 flex flex-col flex-grow bg-navy-800">
                      {/* Store / Brand */}
                      <div className="flex items-center gap-1.5 text-lavender-400 font-semibold text-[11px] uppercase tracking-wider mb-2.5">
                        <Store size={14} className="text-purple-400" />
                        <span className="truncate">
                          {product.brandName ||
                            product.storeId?.name ||
                            "Premium Store"}
                        </span>
                      </div>

                      {/* Product Title */}
                      <Link href={pdpUrl} className="block">
                        <h3
                          className="text-white font-bold text-[16px] leading-[1.35] mb-3 line-clamp-2 hover:text-purple-400 transition-colors"
                          title={product.title}
                        >
                          {product.title}
                        </h3>
                      </Link>

                      {/* Rating Stars */}
                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
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
                        <span className="text-lavender-400 text-[12px] font-medium">
                          ({product.reviewCount || 0})
                        </span>
                      </div>

                      <div className="mt-auto"></div>

                      {/* Pricing & Outbound Affiliate CTA */}
                      <div className="pt-4 border-t border-[var(--indigo-line)] mt-2 flex flex-col gap-4">
                        <div className="flex flex-wrap items-baseline gap-2.5">
                          <span className="text-white font-black text-[20px] md:text-[22px]">
                            {product.currency === "USD" ? "$" : ""}
                            {Number(product.price || 0).toFixed(2)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-lavender-500 text-[13px] md:text-[14px] font-medium line-through decoration-1">
                              {product.currency === "USD" ? "$" : ""}
                              {Number(product.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <a
                          href={product.affiliateLink}
                          target="_blank"
                          rel="sponsored nofollow noopener"
                          className="w-full flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white py-3 rounded-xl font-bold text-[14px] transition-all duration-200 ease-out border border-purple-500/30 hover:border-purple-500 group/btn"
                        >
                          {product.ctaText || "View Deal"}
                          <ExternalLink
                            size={16}
                            className="text-purple-400 group-hover/btn:text-white transition-colors"
                          />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-navy-800 rounded-2xl border border-[var(--indigo-line)] mt-6">
            <AlertCircle size={48} className="text-lavender-500 mb-4" />
            <h3 className="text-white font-bold text-[22px] mb-2">
              No products found
            </h3>
            <p className="text-lavender-400 max-w-md">
              We couldn't find any products at the moment. Please check back
              later or browse our categories.
            </p>
          </div>
        )}

        {/* Pagination Trigger */}
        {!loading && products.length > 0 && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] transition-all duration-200 ${
                loadingMore
                  ? "bg-navy-800 text-lavender-500 border border-[var(--indigo-line)] cursor-wait"
                  : "bg-navy-800 border-2 border-purple-500 text-purple-300 hover:bg-purple-500 hover:text-white"
              }`}
            >
              {loadingMore ? (
                <>
                  <span className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></span>
                  Loading...
                </>
              ) : (
                "Load More Products"
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Products;