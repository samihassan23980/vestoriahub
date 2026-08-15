import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  LayoutGrid,
  Star,
  ExternalLink,
  Store as StoreIcon,
  CheckCircle2,
  Compass,
} from "lucide-react";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";

import "@/app/models/category";
import "@/app/models/affiliateProduct";
import "@/app/models/store";

export const revalidate = 60; // ISR 60 Seconds

function getModels() {
  const Category = mongoose.models.Category;
  const AffiliateProduct = mongoose.models.AffiliateProduct;
  const Store = mongoose.models.Store;

  if (!Category || !AffiliateProduct || !Store) {
    throw new Error("Mongoose models failed to register properly.");
  }

  return { Category, AffiliateProduct, Store };
}

// ── 1. Fetch Category Data Helper ──────────────────────────────────────────────
async function getCategoryPageData(slugArray) {
  try {
    await connectDB();
    const { Category, AffiliateProduct, Store } = getModels();

    if (!slugArray || slugArray.length === 0) return null;

    // Direct target slug (aakhri element of slug array)
    const currentSlug = String(slugArray[slugArray.length - 1])
      .trim()
      .toLowerCase();

    // 🔥 FIX: Search category purely by slug & status (Removing restrictive type checks)
    const currentCategory = await Category.findOne({
      slug: currentSlug,
      status: "active",
    })
      .populate("ancestors", "name slug level type")
      .populate("bestStores", "name slug images logo")
      .lean();

    if (!currentCategory) {
      console.warn(`[Category Page] Category not found for slug: ${currentSlug}`);
      return null;
    }

    // Filter duplicate ancestors from breadcrumb path
    const ancestorsFiltered = (currentCategory.ancestors || []).filter(
      (anc) =>
        String(anc._id) !== String(currentCategory._id) &&
        anc.slug !== currentCategory.slug
    );

    // Fetch immediate child subcategories
    const subCategories = await Category.find({
      parentId: currentCategory._id,
      status: "active",
    })
      .select("name slug icon uiConfig.themeColor")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    // Fetch lower-level descendant categories (L1/L2)
    const allDescendants = await Category.find({
      ancestors: currentCategory._id,
      status: "active",
    })
      .select("_id")
      .lean();

    const categoryIds = [
      currentCategory._id,
      ...allDescendants.map((c) => c._id),
    ];

    // Fetch Linked Stores with Fallback
    let bestStores = currentCategory.bestStores || [];
    if (!bestStores || bestStores.length === 0) {
      bestStores = await Store.find({
        $or: [
          { primaryCategoryId: { $in: categoryIds } },
          { subCategoryIds: { $in: categoryIds } },
        ],
        isActive: true,
      })
        .select("name slug images logo")
        .limit(10)
        .lean();
    }

    // Fetch Category Products
    const categoryProducts = await AffiliateProduct.find({
      categoryId: { $in: categoryIds },
      showInCategoryPage: true,
    })
      .populate("storeId", "name slug images logo")
      .sort({ isTopPick: -1, sortOrder: 1, createdAt: -1 })
      .limit(24)
      .lean();

    // Fetch Cross-Discovery Products from other categories
    const otherProducts = await AffiliateProduct.find({
      categoryId: { $nin: categoryIds },
      showInCategoryPage: true,
    })
      .populate("storeId", "name slug images logo")
      .populate("categoryId", "name slug")
      .sort({ isTrending: -1, discountPercentage: -1, createdAt: -1 })
      .limit(8)
      .lean();

    return JSON.parse(
      JSON.stringify({
        category: {
          ...currentCategory,
          ancestors: ancestorsFiltered,
        },
        subCategories,
        bestStores,
        categoryProducts,
        otherProducts,
      })
    );
  } catch (error) {
    console.error("Error loading category page data:", error);
    return null;
  }
}

// ── 2. SEO Dynamic Metadata ──────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const slugArray = resolvedParams?.slug || [];
  const data = await getCategoryPageData(slugArray);

  if (!data?.category) {
    return { title: "Category Not Found" };
  }

  const { category } = data;
  const title =
    category.seo?.metaTitle || `${category.name} Deals, Coupons & Top Picks`;
  const description =
    category.seo?.metaDescription ||
    category.shortDescription ||
    `Browse fully verified deals, discounts, and products in ${category.name}.`;

  const bannerImage =
    category.uiConfig?.heroBanner?.url || category.image?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: bannerImage ? [{ url: bannerImage, alt: category.name }] : [],
    },
  };
}

// ── 3. Main Category Page Component ──────────────────────────────────────────
export default async function CategoryPage({ params }) {
  const resolvedParams = await params;
  const slugArray = resolvedParams?.slug || [];
  const data = await getCategoryPageData(slugArray);

  if (!data?.category) {
    notFound();
  }

  const { category, subCategories, bestStores, categoryProducts, otherProducts } = data;

  const headline = category.uiConfig?.heroHeadline || category.name;
  const subtitle =
    category.uiConfig?.heroSubtitle ||
    category.shortDescription ||
    `Explore handpicked products and verified deals in ${category.name}.`;
  const keyFeatures = category.uiConfig?.keyFeatures || [];
  const heroBanner =
    category.uiConfig?.heroBanner?.url || category.image?.url;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: subtitle,
    url: `/categories/${slugArray.join("/")}`,
    ...(category.aggregateRating?.ratingValue > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: category.aggregateRating.ratingValue,
        reviewCount: category.aggregateRating.reviewCount || 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-navy-900 min-h-screen py-8 md:py-12 text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[13px] font-medium text-lavender-400 mb-6 overflow-x-auto whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-lavender-500" />
            <Link
              href="/categories"
              className="hover:text-purple-400 transition-colors"
            >
              Categories
            </Link>

            {category.ancestors?.map((ancestor, index) => {
              const ancestorPath = slugArray.slice(0, index + 1).join("/");
              return (
                <React.Fragment key={ancestor._id}>
                  <ChevronRight size={14} className="text-lavender-500" />
                  <Link
                    href={`/categories/${ancestorPath}`}
                    className="hover:text-purple-400 transition-colors"
                  >
                    {ancestor.name}
                  </Link>
                </React.Fragment>
              );
            })}

            <ChevronRight size={14} className="text-lavender-500" />
            <span className="text-white font-semibold">{category.name}</span>
          </nav>

          {/* Hero Header */}
          <div className="relative bg-navy-800 rounded-3xl border border-[var(--indigo-line)] overflow-hidden mb-10 shadow-[0_8px_30px_rgba(6,7,19,0.5)]">
            {heroBanner && (
              <div className="absolute inset-0 z-0 opacity-15">
                <Image
                  src={heroBanner}
                  alt={category.name}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-800/90 to-transparent" />
              </div>
            )}

            <div className="relative z-10 p-6 md:p-10">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[12px] font-extrabold uppercase tracking-wider">
                  <LayoutGrid size={14} />
                  Level {category.level} • {category.type || "General"}
                </div>

                {category.aggregateRating?.ratingValue > 0 && (
                  <div className="flex items-center gap-2 bg-navy-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[var(--indigo-line)]">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={
                            star <=
                            Math.round(category.aggregateRating.ratingValue)
                              ? "currentColor"
                              : "none"
                          }
                          strokeWidth={
                            star <=
                            Math.round(category.aggregateRating.ratingValue)
                              ? 0
                              : 1.5
                          }
                        />
                      ))}
                    </div>
                    <span className="text-[13px] font-bold text-white">
                      {category.aggregateRating.ratingValue.toFixed(1)}
                    </span>
                    <span className="text-[12px] text-lavender-400">
                      ({category.aggregateRating.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-[32px] md:text-[48px] font-black text-white leading-[1.15] mb-4 tracking-tight max-w-4xl">
                {headline}
              </h1>

              <p className="text-lavender-400 text-[16px] md:text-[18px] max-w-3xl leading-relaxed mb-6">
                {subtitle}
              </p>

              {keyFeatures.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {keyFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-navy-700/80 border border-[var(--indigo-line)] text-[13px] font-semibold text-lavender-300"
                    >
                      <CheckCircle2 size={14} className="text-purple-400" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Subcategories Filter */}
              {subCategories.length > 0 && (
                <div className="pt-6 border-t border-[var(--indigo-line)]">
                  <div className="text-[11px] font-extrabold uppercase text-lavender-400 tracking-wider mb-3">
                    Filter Subcategories
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {subCategories.map((sub) => {
                      const currentPath = slugArray.join("/");
                      return (
                        <Link
                          key={sub._id}
                          href={`/categories/${currentPath}/${sub.slug}`}
                          className="px-4 py-2 rounded-xl bg-navy-700 hover:bg-purple-500 border border-[var(--indigo-line)] hover:border-purple-500 text-white text-[14px] font-bold transition-all shadow-sm"
                        >
                          {sub.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Curated Stores Section */}
          {bestStores && bestStores.length > 0 && (
            <div className="bg-navy-800 rounded-2xl border border-[var(--indigo-line)] p-6 mb-10">
              <div className="flex items-center gap-2 text-lavender-400 font-extrabold text-[12px] uppercase tracking-wider mb-4">
                <StoreIcon size={16} className="text-purple-400" />
                Top Verified Stores in {category.name}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {bestStores.map((store) => {
                  const logoUrl =
                    store.images?.logo?.url || store.logo?.url || store.logo;
                  return (
                    <Link
                      key={store._id}
                      href={`/stores/${store.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-navy-900 border border-[var(--indigo-line)] hover:border-purple-500 transition-all group"
                    >
                      {logoUrl ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white flex-shrink-0">
                          <Image
                            src={logoUrl}
                            alt={store.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          {store.name?.[0]}
                        </div>
                      )}
                      <span className="text-[13px] font-bold text-white group-hover:text-purple-400 truncate">
                        {store.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Grid */}
          <div className="mb-14">
            <div className="flex items-center justify-between mb-6 border-b border-[var(--indigo-line)] pb-4">
              <div>
                <h2 className="text-[22px] md:text-[26px] font-black text-white tracking-tight">
                  {category.name} Deals & Products
                </h2>
                <p className="text-[14px] text-lavender-400">
                  Showing all active products for this category level
                </p>
              </div>
              <span className="text-[13px] font-semibold text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                {categoryProducts.length} Products
              </span>
            </div>

            {categoryProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryProducts.map((product) => {
                  const imageUrl =
                    product.images?.[0]?.url || "/placeholder-image.jpg";
                  const pdpUrl = `/products/${product.slug}`;
                  const storeName =
                    product.brandName ||
                    product.storeId?.name ||
                    "Verified Store";

                  return (
                    <div
                      key={product._id}
                      className="bg-navy-800 rounded-2xl border border-[var(--indigo-line)] shadow-[0_4px_20px_rgba(6,7,19,0.3)] overflow-hidden flex flex-col hover:border-purple-500 hover:shadow-[0_8px_30px_rgba(124,92,252,0.25)] hover:-translate-y-1 transition-all duration-300 group"
                    >
                      <Link
                        href={pdpUrl}
                        className="relative aspect-square w-full block bg-navy-950 overflow-hidden p-4"
                      >
                        {product.discountPercentage > 0 && (
                          <div className="absolute top-3 left-3 bg-purple-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md z-10 shadow-md uppercase tracking-wide">
                            {product.discountPercentage}% OFF
                          </div>
                        )}
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="p-5 flex flex-col flex-grow bg-navy-800">
                        <div className="flex items-center gap-1.5 text-lavender-400 text-[11px] font-bold uppercase mb-2">
                          <StoreIcon size={14} className="text-purple-400" />
                          <span className="truncate">{storeName}</span>
                        </div>

                        <Link href={pdpUrl}>
                          <h3 className="font-bold text-[16px] text-white line-clamp-2 mb-3 hover:text-purple-400 transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="mt-auto pt-4 border-t border-[var(--indigo-line)] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[20px] font-black text-white">
                              ${Number(product.price || 0).toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="ml-2 text-[12px] text-lavender-500 line-through">
                                ${Number(product.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            className="p-2.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500 transition-all"
                            aria-label="View Deal"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-12 text-center text-lavender-400">
                <h3 className="text-[20px] font-bold text-white mb-2">
                  No products found in this category level
                </h3>
                <p>Check back later or explore subcategories above.</p>
              </div>
            )}
          </div>

          {/* Long Description Block */}
          {category.description && (
            <div className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-8 mb-14">
              <h2 className="text-[20px] font-black text-white mb-4">
                About {category.name}
              </h2>
              <div className="text-lavender-400 text-[15px] leading-relaxed space-y-4">
                {category.description}
              </div>
            </div>
          )}

          {/* Cross-Category Discovery */}
          {otherProducts.length > 0 && (
            <div className="pt-8 border-t border-[var(--indigo-line)]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Compass size={18} />
                </div>
                <div>
                  <h2 className="text-[22px] font-black text-white tracking-tight">
                    Explore Popular Deals From Other Categories
                  </h2>
                  <p className="text-[13px] text-lavender-400">
                    Trending deals handpicked across the platform
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {otherProducts.map((product) => {
                  const imageUrl =
                    product.images?.[0]?.url || "/placeholder-image.jpg";
                  const pdpUrl = `/products/${product.slug}`;

                  return (
                    <div
                      key={product._id}
                      className="bg-navy-800 rounded-2xl border border-[var(--indigo-line)] overflow-hidden flex flex-col hover:border-purple-500 transition-all duration-300 group"
                    >
                      <Link
                        href={pdpUrl}
                        className="relative aspect-square w-full block bg-navy-950 p-4"
                      >
                        {product.categoryId?.name && (
                          <div className="absolute top-3 left-3 bg-navy-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md z-10 border border-[var(--indigo-line)]">
                            {product.categoryId.name}
                          </div>
                        )}
                        <Image
                          src={imageUrl}
                          alt={product.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 25vw"
                          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      <div className="p-4 flex flex-col flex-grow bg-navy-800">
                        <Link href={pdpUrl}>
                          <h3 className="font-bold text-[14px] text-white line-clamp-2 mb-2 hover:text-purple-400 transition-colors">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="mt-auto pt-3 border-t border-[var(--indigo-line)] flex items-center justify-between">
                          <span className="text-[16px] font-black text-white">
                            ${Number(product.price || 0).toFixed(2)}
                          </span>
                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            className="p-2 rounded-lg bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white transition-all border border-purple-500/30"
                            aria-label="View Deal"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}