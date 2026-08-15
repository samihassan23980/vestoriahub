"use client";
import React, { useState, useEffect } from "react";
import {
  Star,
  ExternalLink,
  Store,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination States
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (pageNumber = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      // Standard paginated API call instead of 'grouped' view
      const response = await fetch(
        `/api/public/affiliate-products?page=${pageNumber}&limit=12&sort=newest`,
      );

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const json = await response.json();

      if (json.success) {
        if (isLoadMore) {
          setProducts((prev) => [...prev, ...json.data]);
        } else {
          setProducts(json.data || []);
        }

        // Update pagination state based on backend response
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
        confirmButtonColor: "#2D2380",
        background: "#FFFFFF",
        color: "#1A1340",
        customClass: {
          confirmButton: "rounded-lg font-bold px-6 py-2",
        },
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    fetchProducts(1, false);
  }, []);

  // Load More Handler
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, true);
  };

  return (
    <section className="bg-[#F7F6FF] min-h-screen py-[60px] md:py-[80px]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Shop Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 border-b border-[#E0DEF5] pb-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#EEEDFE] text-[#2D2380] text-[12px] font-bold uppercase tracking-wider mb-4 shadow-sm">
              <LayoutGrid size={14} strokeWidth={2.5} />
              Complete Catalog
            </div>

            <h1 className="text-[#1A1340] font-bold text-[36px] md:text-[48px] leading-[1.1] tracking-tight mb-4">
              Explore All Deals & Products
            </h1>
            <p className="text-[#7775A0] text-[16px] md:text-[18px] leading-relaxed">
              Browse our fully verified collection of premium products, flash
              sales, and exclusive discounts from top-rated stores globally.
            </p>
          </div>

          {/* Optional: Add a total count here if available from API, or just a simple label */}
          <div className="text-[#7775A0] font-medium text-[14px]">
            Showing all verified deals
          </div>
        </div>

        {/* Product Grid (Responsive: 1 col Mobile, 2 col Tablet, 3 col Desktop, 4 col Wide Desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Initial Loading Skeletons */}
          {loading &&
            [1, 2, 3, 4, 5, 6, 7, 8].map((skeleton) => (
              <div key={`skeleton-${skeleton}`} className="w-full">
                <div className="bg-[#FFFFFF] h-[440px] rounded-2xl border border-[#E0DEF5] overflow-hidden flex flex-col shadow-sm">
                  <div className="h-[220px] bg-gradient-to-r from-[#EEEDFE] to-[#E0DEF5] animate-pulse" />
                  <div className="p-5 flex-grow flex flex-col gap-3">
                    <div className="h-3 bg-[#EEEDFE] rounded w-1/3 animate-pulse" />
                    <div className="h-5 bg-[#EEEDFE] rounded w-full animate-pulse" />
                    <div className="h-5 bg-[#EEEDFE] rounded w-2/3 animate-pulse" />
                    <div className="mt-auto h-11 bg-[#EEEDFE] rounded-xl animate-pulse" />
                  </div>
                </div>
              </div>
            ))}

          {/* Render Products */}
          {!loading &&
            products.map((product) => (
              <div key={product._id} className="w-full">
                <div className="bg-[#FFFFFF] h-full flex flex-col rounded-2xl border border-[#E0DEF5] shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_24px_rgba(26,19,64,0.14)] hover:border-[#4A3DBF] hover:-translate-y-1 group">
                  {/* Image Container */}
                  <div className="aspect-[4/3] w-full overflow-hidden relative bg-[#F8F9FA]">
                    {/* Discount Badge */}
                    {product.discountPercentage > 0 && (
                      <div className="absolute top-4 left-4 bg-[#FF6B35] text-white text-[12px] font-bold px-3 py-1 rounded-md z-10 shadow-md uppercase tracking-wide">
                        {product.discountPercentage}% OFF
                      </div>
                    )}

                    <img
                      src={product.images?.[0]?.url || "/placeholder-image.jpg"}
                      alt={product.images?.[0]?.alt || product.title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 border-[0.5px] border-black/5 pointer-events-none rounded-t-2xl" />
                  </div>

                  {/* Content Container */}
                  <div className="p-5 md:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-1.5 text-[#7775A0] font-semibold text-[11px] uppercase tracking-wider mb-2.5">
                      <Store size={14} />
                      <span className="truncate">
                        {product.brandName ||
                          product.storeId?.name ||
                          "Premium Store"}
                      </span>
                    </div>

                    <h3
                      className="text-[#1A1340] font-bold text-[17px] md:text-[18px] leading-[1.35] mb-3 line-clamp-2"
                      title={product.title}
                    >
                      {product.title}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-4">
                      <div className="flex items-center text-[#F4A836]">
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
                              star <= (product.rating || 5) ? "" : "opacity-40"
                            }
                          />
                        ))}
                      </div>
                      <span className="text-[#7775A0] text-[12px] md:text-[13px] font-medium">
                        ({product.reviewCount || 0})
                      </span>
                    </div>

                    <div className="mt-auto"></div>

                    {/* Pricing & CTA */}
                    <div className="pt-4 border-t border-[#E0DEF5] mt-2 flex flex-col gap-4">
                      <div className="flex flex-wrap items-baseline gap-2.5">
                        <span className="text-[#1A1340] font-black text-[22px] md:text-[24px]">
                          {product.currency === "USD" ? "$" : ""}
                          {product.price.toFixed(2)}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[#7775A0] text-[14px] md:text-[15px] font-medium line-through decoration-1">
                            {product.currency === "USD" ? "$" : ""}
                            {product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <a
                        href={product.affiliateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#EEEDFE] hover:bg-[#2D2380] text-[#2D2380] hover:text-white py-3 rounded-xl font-bold text-[14px] md:text-[15px] transition-all duration-200 ease-out group/btn"
                      >
                        {product.ctaText || "View Deal"}
                        <ExternalLink
                          size={16}
                          className="text-[#4A3DBF] group-hover/btn:text-white transition-colors"
                        />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Fallback Empty State */}
        {!loading && products.length === 0 && (
          <div className="w-full py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-[#E0DEF5] mt-6">
            <AlertCircle size={48} className="text-[#A09EC0] mb-4" />
            <h3 className="text-[#1A1340] font-bold text-[22px] mb-2">
              No products found
            </h3>
            <p className="text-[#7775A0] max-w-md">
              We couldn't find any products at the moment. Please check back
              later or browse our categories.
            </p>
          </div>
        )}

        {/* Load More Button */}
        {!loading && products.length > 0 && hasMore && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-[15px] transition-all duration-200 ${
                loadingMore
                  ? "bg-[#EEEDFE] text-[#A09EC0] cursor-wait"
                  : "bg-transparent border-2 border-[#2D2380] text-[#2D2380] hover:bg-[#EEEDFE]"
              }`}
            >
              {loadingMore ? (
                <>
                  <span className="w-5 h-5 border-2 border-[#A09EC0] border-t-transparent rounded-full animate-spin"></span>
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

export default ShopPage;
