"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Grid3X3,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  StarHalf,
  Store as StoreIcon,
  Tag,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Best Discount", value: "discount" },
  { label: "Highest Rated", value: "rating" },
  { label: "Newest", value: "newest" },
];

const VARIANT_OPTIONS = [
  { label: "All Layouts", value: "" },
  { label: "Standard", value: "standard" },
  { label: "Featured Horizontal", value: "featured_horizontal" },
  { label: "Compact Grid", value: "compact_grid" },
  { label: "Hero Spotlight", value: "hero_spotlight" },
];

function renderStars(rating) {
  if (!rating || Number.isNaN(Number(rating))) return null;

  const value = Number(rating);
  const fullStars = Math.floor(value);
  const hasHalfStar = value % 1 !== 0;

  return Array.from({ length: 5 }).map((_, index) => {
    if (index < fullStars) {
      return (
        <Star key={index} size={14} className="fill-[#F4A836] text-[#F4A836]" />
      );
    }

    if (index === fullStars && hasHalfStar) {
      return (
        <StarHalf
          key={index}
          size={14}
          className="fill-[#F4A836] text-[#F4A836]"
        />
      );
    }

    return <Star key={index} size={14} className="text-[#E0DEF5]" />;
  });
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(value, currency = "USD") {
  const price = Number(value);
  if (!Number.isFinite(price)) return "";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `$${price.toFixed(2)}`;
  }
}

function getPrimaryImage(product) {
  if (!Array.isArray(product?.images)) return "";
  return (
    product.images.find((image) => image?.isPrimary)?.url ||
    product.images[0]?.url ||
    ""
  );
}

function buildQueryString(filters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (
      value !== "" &&
      value !== null &&
      value !== undefined &&
      value !== false
    ) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

function ProductCard({ product, featured = false }) {
  const imageUrl = getPrimaryImage(product);

  return (
    <article
      className={`group overflow-hidden rounded-xl border border-[#E0DEF5] bg-white shadow-[0_2px_12px_rgba(26,19,64,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#4A3DBF] hover:shadow-[0_8px_24px_rgba(26,19,64,0.14)] ${
        featured ? "md:flex" : "flex flex-col"
      }`}
    >
      <div
        className={`relative flex shrink-0 items-center justify-center border-[#E0DEF5] bg-[#F7F6FF] p-5 ${
          featured
            ? "h-[260px] md:h-auto md:w-[320px] md:border-r"
            : "h-[210px] border-b"
        }`}
      >
        {product.ribbonText && (
          <span className="absolute left-4 top-4 rounded-md bg-[#1A1340] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#F4A836]">
            {product.ribbonText}
          </span>
        )}

        {product.discountPercentage > 0 && (
          <span className="absolute right-4 top-4 rounded-md bg-[#FF6B35] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {product.discountPercentage}% OFF
          </span>
        )}

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title || "Product image"}
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EEEDFE] text-[#2D2380]">
            <Tag size={34} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {product.isTopPick && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#EEEDFE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#2D2380]">
              <Award size={13} /> Top Pick
            </span>
          )}

          {product.isHotDeal && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#FF6B35] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
              <Zap size={13} /> Hot Deal
            </span>
          )}

          {product.isTrending && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#22B07D]">
              <TrendingUp size={13} /> Trending
            </span>
          )}
        </div>

        <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[#7775A0]">
          {product.brandName || product.storeId?.name || "Recommended"}
        </p>

        <h3 className="mb-2 line-clamp-2 text-[18px] font-bold leading-snug text-[#1A1340] transition-colors group-hover:text-[#2D2380]">
          {product.title}
        </h3>

        {product.shortDescription && (
          <p className="mb-4 line-clamp-3 text-[14px] leading-relaxed text-[#7775A0]">
            {product.shortDescription}
          </p>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {product.rating ? (
            <>
              <div className="flex items-center gap-0.5">
                {renderStars(product.rating)}
              </div>
              <span className="text-[13px] font-semibold text-[#1A1340]">
                {Number(product.rating).toFixed(1)}
              </span>
              <span className="text-[12px] text-[#7775A0]">
                ({product.reviewCount || 0} reviews)
              </span>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#7775A0]">
              <ShieldCheck size={14} className="text-[#22B07D]" />
              Editorially reviewed
            </span>
          )}
        </div>

        {Array.isArray(product.pros) && product.pros.length > 0 && (
          <ul className="mb-5 space-y-1.5">
            {product.pros.slice(0, 3).map((pro, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[13px] text-[#1A1340]"
              >
                <CheckCircle2
                  size={15}
                  className="mt-0.5 shrink-0 text-[#22B07D]"
                />
                <span className="line-clamp-1">{pro}</span>
              </li>
            ))}
          </ul>
        )}

        {product.bottomLine && featured && (
          <div className="mb-5 rounded-lg border border-[#E0DEF5] bg-[#F7F6FF] p-4">
            <p className="text-[13px] font-semibold leading-relaxed text-[#1A1340]">
              {product.bottomLine}
            </p>
          </div>
        )}

        <div className="mt-auto border-t border-[#E0DEF5] pt-4">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-bold text-[#1A1340]">
                  {formatPrice(product.price, product.currency)}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-[13px] font-semibold text-[#A09EC0] line-through">
                    {formatPrice(product.originalPrice, product.currency)}
                  </span>
                )}
              </div>

              {product.lastVerifiedAt && (
                <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#22B07D]">
                  <Clock size={12} />
                  Verified {formatDate(product.lastVerifiedAt)}
                </p>
              )}
            </div>
          </div>

          <a
            href={product.affiliateLink || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-5 py-3 text-[14px] font-bold text-white transition-all hover:bg-[#e05520]"
          >
            {product.ctaText || "Check Current Price"}
            <ExternalLink size={16} />
          </a>
        </div>
      </div>
    </article>
  );
}

function StoreCard({ store }) {
  if (!store || typeof store === "string") return null;

  return (
    <Link href={`/store/${store.slug}`}>
      <div className="group flex h-full flex-col items-center justify-center rounded-xl border border-[#E0DEF5] bg-white p-5 text-center transition-all hover:-translate-y-1 hover:border-[#4A3DBF] hover:shadow-[0_8px_24px_rgba(26,19,64,0.12)]">
        <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-[#E0DEF5] bg-[#F7F6FF]">
          {store.images?.logo?.url ? (
            <img
              src={store.images.logo.url}
              alt={store.images.logo.alt || store.name}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <span className="text-[26px] font-bold text-[#2D2380]">
              {store.name?.charAt(0)}
            </span>
          )}
        </div>

        <h3 className="mb-1 text-[15px] font-bold text-[#1A1340] group-hover:text-[#2D2380]">
          {store.name}
        </h3>

        {store.content?.shortDescription && (
          <p className="line-clamp-2 text-[12px] leading-relaxed text-[#7775A0]">
            {store.content.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function CategoryDetailsPageProductsAndStores() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const slug = params?.slug;

  const [data, setData] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [formFilters, setFormFilters] = useState({
    q: searchParams.get("q") || "",
    brand: searchParams.get("brand") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    minRating: searchParams.get("minRating") || "",
    minDiscount: searchParams.get("minDiscount") || "",
    hotDeals: searchParams.get("hotDeals") === "true",
    topPicks: searchParams.get("topPicks") === "true",
    variant: searchParams.get("variant") || "",
    sort: searchParams.get("sort") || "featured",
    deep: searchParams.get("deep") === "true",
    page: searchParams.get("page") || "1",
    limit: searchParams.get("limit") || "20",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = useMemo(() => {
    const query = searchParams.toString();
    return `/api/public/categories/${slug}${query ? `?${query}` : ""}`;
  }, [slug, searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategoryData() {
      try {
        setLoading(true);
        setError("");

        if (!slug) {
          throw new Error("Category slug is missing.");
        }

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to load category data.");
        }

        if (!result.data?.category) {
          throw new Error("Category payload is missing from API response.");
        }

        if (isMounted) {
          setData(result.data);
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "A server error occurred while loading this category.";

        if (isMounted) {
          setError(message);
          setData(null);
        }

        Swal.fire({
          icon: "error",
          title: "Category Unavailable",
          text: message,
          confirmButtonColor: "#2D2380",
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCategoryData();

    return () => {
      isMounted = false;
    };
  }, [apiUrl, slug]);

  function updateUrl(nextFilters) {
    const query = buildQueryString(nextFilters);
    router.push(`/categories/${slug}${query}`);
  }

  function applyFilters(event) {
    event.preventDefault();
    updateUrl({ ...formFilters, page: "1" });
    setFiltersOpen(false);
  }

  function clearFilters() {
    const reset = {
      q: "",
      brand: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      minDiscount: "",
      hotDeals: false,
      topPicks: false,
      variant: "",
      sort: "featured",
      deep: false,
      page: "1",
      limit: "20",
    };

    setFormFilters(reset);
    updateUrl(reset);
  }

  function changePage(nextPage) {
    updateUrl({ ...formFilters, page: String(nextPage) });
  }

  if (loading) {
    return (
      <div className="min-h-screen animate-pulse bg-[#F7F6FF] pb-20">
        <div className="h-[420px] bg-[#1A1340]" />
        <div className="mx-auto mt-10 max-w-[1280px] space-y-6 px-6">
          <div className="h-10 w-64 rounded bg-[#EEEDFE]" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
            <div className="h-[520px] rounded-xl bg-white" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <div className="h-[420px] rounded-xl bg-white" />
              <div className="h-[420px] rounded-xl bg-white" />
              <div className="h-[420px] rounded-xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data?.category) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F6FF] px-6 text-center">
        <AlertCircle size={64} className="mb-4 text-[#E24B4A]" />
        <h1 className="mb-2 text-[28px] font-bold text-[#1A1340]">
          Category Not Found
        </h1>
        <p className="mb-6 max-w-md text-[#7775A0]">
          {error || "We couldn't load the requested category."}
        </p>
        <Link
          href="/categories"
          className="rounded-lg bg-[#2D2380] px-6 py-3 font-semibold text-white hover:bg-[#4A3DBF]"
        >
          Back to Categories
        </Link>
      </div>
    );
  }

  const {
    category,
    hierarchy,
    heroProducts = [],
    products,
    stores,
    meta,
  } = data;

  const productItems = products?.items || [];
  const pagination = products?.pagination || {};
  const availableFilters = products?.filters?.available || {};
  const appliedFilters = products?.filters?.applied || {};
  const hasActiveFilters = products?.filters?.hasActiveFilters || false;

  const curatedStores = stores?.curated || [];
  const relatedStores = stores?.related || [];
  const allStores = [...curatedStores, ...relatedStores].filter(
    (store, index, arr) =>
      store && arr.findIndex((item) => item?._id === store?._id) === index,
  );

  return (
    <main className="min-h-screen bg-[#F7F6FF] pb-20">
      <section className="relative overflow-hidden bg-[#1A1340]">
        <div className="absolute inset-0">
          {category.uiConfig?.heroBanner?.url && (
            <img
              src={category.uiConfig.heroBanner.url}
              alt={category.uiConfig.heroBanner.alt || category.name}
              className="h-full w-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1340]/80 to-[#1A1340]" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] px-6 py-16 text-center md:py-24">
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[13px] font-semibold text-white/65">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight size={14} />
            <Link href="/categories" className="hover:text-white">
              Categories
            </Link>

            {Array.isArray(category.ancestors) &&
              category.ancestors.map((ancestor) => (
                <React.Fragment key={ancestor._id}>
                  <ChevronRight size={14} />
                  <Link
                    href={`/categories/${ancestor.slug}`}
                    className="hover:text-white"
                  >
                    {ancestor.name}
                  </Link>
                </React.Fragment>
              ))}

            <ChevronRight size={14} />
            <span className="text-[#F4A836]">{category.name}</span>
          </div>

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[13px] font-bold text-white backdrop-blur">
            <Layers3 size={16} className="text-[#F4A836]" />
            Level {category.level} Category • {meta?.scope || "exact"} scope
          </div>

          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            {category.uiConfig?.heroHeadline || category.name}
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-[18px] leading-relaxed text-white/70">
            {category.uiConfig?.heroSubtitle || category.shortDescription}
          </p>

          {Array.isArray(category.uiConfig?.keyFeatures) &&
            category.uiConfig.keyFeatures.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                {category.uiConfig.keyFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[13px] font-semibold text-white"
                  >
                    <ShieldCheck size={15} className="text-[#22B07D]" />
                    {feature}
                  </span>
                ))}
              </div>
            )}
        </div>
      </section>

      {category.aggregateRating?.reviewCount > 0 && (
        <section className="border-b border-[#E0DEF5] bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-6 py-4 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <TrendingUp size={20} className="text-[#2D2380]" />
              <span className="font-bold text-[#1A1340]">Category Rating</span>
              <div className="flex items-center gap-0.5">
                {renderStars(category.aggregateRating.ratingValue)}
              </div>
              <span className="text-[14px] font-semibold text-[#7775A0]">
                {Number(category.aggregateRating.ratingValue).toFixed(1)} / 5
              </span>
            </div>

            <p className="text-[13px] font-medium text-[#7775A0]">
              Based on{" "}
              <span className="font-bold text-[#1A1340]">
                {category.aggregateRating.reviewCount.toLocaleString()}
              </span>{" "}
              verified reviews
            </p>
          </div>
        </section>
      )}

      <div className="mx-auto mt-10 max-w-[1280px] px-6">
        {Array.isArray(hierarchy?.childCategories) &&
          hierarchy.childCategories.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-2">
                <Grid3X3 size={22} className="text-[#2D2380]" />
                <h2 className="text-[22px] font-bold text-[#1A1340]">
                  Explore Subcategories
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {hierarchy.childCategories.map((child) => (
                  <Link
                    key={child._id}
                    href={`/categories/${child.slug}`}
                    className="rounded-full border border-[#E0DEF5] bg-white px-5 py-2.5 text-[14px] font-semibold text-[#7775A0] transition hover:border-[#4A3DBF] hover:bg-[#EEEDFE] hover:text-[#2D2380]"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

        {heroProducts.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <Award size={26} className="text-[#F4A836]" />
              <h2 className="text-[26px] font-bold text-[#1A1340]">
                Featured Picks
              </h2>
            </div>

            <div className="space-y-6">
              {heroProducts.map((product) => (
                <ProductCard key={product._id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {allStores.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex items-center gap-3">
              <StoreIcon size={26} className="text-[#2D2380]" />
              <h2 className="text-[26px] font-bold text-[#1A1340]">
                Top Stores for {category.name}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {allStores.map((store) => (
                <StoreCard key={store._id} store={store} />
              ))}
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          <aside className={`${filtersOpen ? "block" : "hidden"} lg:block`}>
            <form
              onSubmit={applyFilters}
              className="sticky top-6 rounded-xl border border-[#E0DEF5] bg-white p-5 shadow-[0_2px_12px_rgba(26,19,64,0.06)]"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={20} className="text-[#2D2380]" />
                  <h3 className="font-bold text-[#1A1340]">Filters</h3>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[12px] font-bold text-[#E24B4A]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                    Search Products
                  </span>
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
                    />
                    <input
                      value={formFilters.q}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          q: e.target.value,
                        }))
                      }
                      placeholder="Search by title or brand"
                      className="h-11 w-full rounded-lg border border-[#E0DEF5] pl-9 pr-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                    Brand
                  </span>
                  <select
                    value={formFilters.brand}
                    onChange={(e) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        brand: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                  >
                    <option value="">All Brands</option>
                    {(availableFilters.brands || []).map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                      Min Price
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formFilters.minPrice}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          minPrice: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                    />
                  </label>

                  <label>
                    <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                      Max Price
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={formFilters.maxPrice}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          maxPrice: e.target.value,
                        }))
                      }
                      className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                    Minimum Rating
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={formFilters.minRating}
                    onChange={(e) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        minRating: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                    Minimum Discount %
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formFilters.minDiscount}
                    onChange={(e) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        minDiscount: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-[#1A1340]">
                    Product Variant
                  </span>
                  <select
                    value={formFilters.variant}
                    onChange={(e) =>
                      setFormFilters((prev) => ({
                        ...prev,
                        variant: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-[#E0DEF5] px-3 text-[14px] outline-none focus:border-[#2D2380] focus:ring-4 focus:ring-[#2D2380]/10"
                  >
                    {VARIANT_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="space-y-3 rounded-lg bg-[#F7F6FF] p-4">
                  <label className="flex items-center justify-between gap-3 text-[14px] font-semibold text-[#1A1340]">
                    Hot Deals Only
                    <input
                      type="checkbox"
                      checked={formFilters.hotDeals}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          hotDeals: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 text-[14px] font-semibold text-[#1A1340]">
                    Top Picks Only
                    <input
                      type="checkbox"
                      checked={formFilters.topPicks}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          topPicks: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 text-[14px] font-semibold text-[#1A1340]">
                    Include Descendants
                    <input
                      type="checkbox"
                      checked={formFilters.deep}
                      onChange={(e) =>
                        setFormFilters((prev) => ({
                          ...prev,
                          deep: e.target.checked,
                        }))
                      }
                      className="h-4 w-4"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#2D2380] text-[14px] font-bold text-white transition hover:bg-[#4A3DBF]"
                >
                  <Filter size={16} />
                  Apply Filters
                </button>
              </div>
            </form>
          </aside>

          <div>
            <div className="mb-6 rounded-xl border border-[#E0DEF5] bg-white p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[24px] font-bold text-[#1A1340]">
                    <Grid3X3 size={24} className="text-[#2D2380]" />
                    Recommended Products
                  </h2>

                  <p className="mt-1 text-[13px] font-medium text-[#7775A0]">
                    Showing {pagination.from || 0}–{pagination.to || 0} of{" "}
                    {pagination.total || 0} products
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                    className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#E0DEF5] px-4 text-[14px] font-bold text-[#2D2380] lg:hidden"
                  >
                    {filtersOpen ? <X size={16} /> : <Filter size={16} />}
                    Filters
                  </button>

                  <select
                    value={formFilters.sort}
                    onChange={(e) => {
                      const next = {
                        ...formFilters,
                        sort: e.target.value,
                        page: "1",
                      };
                      setFormFilters(next);
                      updateUrl(next);
                    }}
                    className="h-11 rounded-lg border border-[#E0DEF5] px-3 text-[14px] font-semibold text-[#1A1340] outline-none focus:border-[#2D2380]"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-[#E0DEF5] pt-4">
                  {Object.entries(appliedFilters).map(([key, value]) => {
                    if (key === "sort") return null;

                    return (
                      <span
                        key={key}
                        className="rounded-full bg-[#EEEDFE] px-3 py-1 text-[12px] font-bold text-[#2D2380]"
                      >
                        {key}: {String(value)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {productItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {productItems.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E0DEF5] bg-white px-6 py-16 text-center">
                <AlertCircle
                  size={44}
                  className="mx-auto mb-4 text-[#F4A836]"
                />
                <h3 className="mb-2 text-[22px] font-bold text-[#1A1340]">
                  No Products Found
                </h3>
                <p className="mx-auto mb-6 max-w-md text-[#7775A0]">
                  Try clearing filters or changing the price, brand, rating, or
                  discount range.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg bg-[#2D2380] px-6 py-3 font-bold text-white hover:bg-[#4A3DBF]"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => changePage(Number(pagination.page) - 1)}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#E0DEF5] bg-white px-4 text-[14px] font-bold text-[#2D2380] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>

                <span className="rounded-lg bg-[#1A1340] px-4 py-2 text-[14px] font-bold text-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage}
                  onClick={() => changePage(Number(pagination.page) + 1)}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#E0DEF5] bg-white px-4 text-[14px] font-bold text-[#2D2380] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {category.description && (
        <section className="mt-16 border-t border-[#E0DEF5] bg-white">
          <div className="mx-auto max-w-[850px] px-6 py-16">
            <h2 className="mb-5 text-[28px] font-bold text-[#1A1340]">
              About {category.name}
            </h2>
            <div className="space-y-4 text-[15px] leading-[1.8] text-[#7775A0]">
              {category.description.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
