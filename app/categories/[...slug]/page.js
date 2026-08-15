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
  Sparkles,
  Tag,
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

    const currentSlug = String(slugArray[slugArray.length - 1])
      .trim()
      .toLowerCase();

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

    const ancestorsFiltered = (currentCategory.ancestors || []).filter(
      (anc) =>
        String(anc._id) !== String(currentCategory._id) &&
        anc.slug !== currentCategory.slug
    );

    const subCategories = await Category.find({
      parentId: currentCategory._id,
      status: "active",
    })
      .select("name slug icon uiConfig.themeColor")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

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

    const categoryProducts = await AffiliateProduct.find({
      categoryId: { $in: categoryIds },
      showInCategoryPage: true,
    })
      .populate("storeId", "name slug images logo")
      .sort({ isTopPick: -1, sortOrder: 1, createdAt: -1 })
      .limit(24)
      .lean();

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
    category.seo?.metaTitle || `${category.name} Deals, Coupons & Top Picks | VestoriaHub`;
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

      <div className="bg-[#F8F0E5] min-h-screen pb-24 font-sans text-[#16241F]">
        
        {/* ── Breadcrumb Navigation ── */}
        <nav aria-label="Breadcrumb" className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-3.5">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[12px] font-mono text-[#8A8F8C] overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-[#1C352D] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
            <Link
              href="/categories"
              className="hover:text-[#1C352D] transition-colors"
            >
              Categories
            </Link>

            {category.ancestors?.map((ancestor, index) => {
              const ancestorPath = slugArray.slice(0, index + 1).join("/");
              return (
                <React.Fragment key={ancestor._id}>
                  <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
                  <Link
                    href={`/categories/${ancestorPath}`}
                    className="hover:text-[#1C352D] transition-colors"
                  >
                    {ancestor.name}
                  </Link>
                </React.Fragment>
              );
            })}

            <ChevronRight size={12} className="text-[#BDD6C4] shrink-0" />
            <span className="text-[#10201B] font-bold truncate">{category.name}</span>
          </div>
        </nav>

        {/* ── HERO SECTION WITH S-WAVE ACCENT ── */}
        <section className="relative bg-[#10201B] overflow-hidden border-b border-[#25473C] text-[#FDFBF7] py-14 md:py-20">
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

          {heroBanner && (
            <div className="absolute inset-0 z-0 opacity-15">
              <Image
                src={heroBanner}
                alt={category.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#10201B] via-[#10201B]/90 to-transparent" />
            </div>
          )}

          <div className="relative max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#162B24] border border-[#25473C] text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest shadow-xs">
                <LayoutGrid size={13} />
                <span>Level {category.level} • {category.type || "General"}</span>
              </div>

              {category.aggregateRating?.ratingValue > 0 && (
                <div className="flex items-center gap-2 bg-[#162B24] px-3.5 py-1.5 rounded-full border border-[#25473C]">
                  <div className="flex text-[#D9A441]">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={13}
                        fill={
                          star <= Math.round(category.aggregateRating.ratingValue)
                            ? "currentColor"
                            : "none"
                        }
                        strokeWidth={
                          star <= Math.round(category.aggregateRating.ratingValue)
                            ? 0
                            : 1.5
                        }
                      />
                    ))}
                  </div>
                  <span className="text-[12.5px] font-mono font-bold text-[#FDFBF7]">
                    {category.aggregateRating.ratingValue.toFixed(1)}
                  </span>
                  <span className="text-[11px] font-mono text-[#A8C3B0]">
                    ({category.aggregateRating.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            <h1 className="text-[32px] sm:text-[44px] md:text-[52px] font-heading font-black text-[#FDFBF7] leading-[1.1] mb-4 tracking-tight max-w-4xl">
              {headline}
            </h1>

            <p className="text-[#D5E4D9] text-[15px] md:text-[16.5px] max-w-3xl leading-relaxed mb-6 font-normal">
              {subtitle}
            </p>

            {keyFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2.5 mb-6">
                {keyFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#162B24] border border-[#25473C] text-[12.5px] font-semibold text-[#A8C3B0]"
                  >
                    <CheckCircle2 size={14} className="text-[#34D399]" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Subcategories Filter */}
            {subCategories.length > 0 && (
              <div className="pt-5 border-t border-[#25473C]">
                <div className="text-[10.5px] font-mono font-extrabold uppercase text-[#D9A441] tracking-widest mb-3">
                  Filter Subcategories
                </div>
                <div className="flex flex-wrap gap-2">
                  {subCategories.map((sub) => {
                    const currentPath = slugArray.join("/");
                    return (
                      <Link
                        key={sub._id}
                        href={`/categories/${currentPath}/${sub.slug}`}
                        className="px-4 py-1.5 rounded-full bg-[#162B24] hover:bg-[#1C352D] border border-[#25473C] hover:border-[#D9A441] text-[#FDFBF7] text-[13px] font-heading font-bold transition-all shadow-xs"
                      >
                        {sub.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          
          {/* Curated Stores Section */}
          {bestStores && bestStores.length > 0 && (
            <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#E2D9CC] p-6 mb-10 shadow-xs">
              <div className="flex items-center gap-2 text-[#8A8F8C] font-mono font-bold text-[11px] uppercase tracking-wider mb-4">
                <StoreIcon size={15} className="text-[#D9A441]" />
                Top Verified Stores in {category.name}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {bestStores.map((store) => {
                  const logoUrl =
                    store.images?.logo?.url || store.logo?.url || store.logo;
                  return (
                    <Link
                      key={store._id}
                      href={`/stores/${store.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-[#FDFBF7] border border-[#E2D9CC] hover:border-[#BDD6C4] hover:bg-[#EBF3EE] transition-all group"
                    >
                      {logoUrl ? (
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white border border-[#E2D9CC] flex-shrink-0">
                          <Image
                            src={logoUrl}
                            alt={store.name}
                            fill
                            className="object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#1C352D] border border-[#BDD6C4] flex items-center justify-center flex-shrink-0 font-heading font-black text-xs">
                          {store.name?.[0]}
                        </div>
                      )}
                      <span className="text-[13px] font-heading font-bold text-[#10201B] group-hover:text-[#D9A441] truncate transition-colors">
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
            <div className="flex items-center justify-between mb-6 border-b border-[#E2D9CC] pb-4">
              <div>
                <h2 className="text-[20px] md:text-[24px] font-heading font-extrabold text-[#10201B] tracking-tight">
                  {category.name} Deals & Products
                </h2>
                <p className="text-[13px] text-[#6B7280]">
                  Showing all active products for this category level
                </p>
              </div>
              <span className="text-[11.5px] font-mono font-bold text-[#1C352D] bg-[#EBF3EE] px-3 py-1 rounded-full border border-[#BDD6C4]">
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
                    <article
                      key={product._id}
                      className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] shadow-xs hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)] overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 group p-4"
                    >
                      <Link
                        href={pdpUrl}
                        className="relative aspect-square w-full block bg-[#FDFBF7] rounded-[18px] border border-[#E2D9CC] overflow-hidden p-4 mb-4 shrink-0"
                      >
                        {product.discountPercentage > 0 && (
                          <div className="absolute top-3 left-3 bg-[#D9A441] text-[#16241F] text-[10.5px] font-heading font-black px-2.5 py-1 rounded-full z-10 shadow-xs uppercase tracking-wider">
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

                      <div className="flex flex-col flex-grow justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#8A8F8C] font-mono font-bold text-[11px] uppercase tracking-wider mb-2">
                            <StoreIcon size={13} className="text-[#D9A441]" />
                            <span className="truncate">{storeName}</span>
                          </div>

                          <Link href={pdpUrl}>
                            <h3 className="font-heading font-bold text-[16px] text-[#10201B] line-clamp-2 mb-3 group-hover:text-[#D9A441] transition-colors leading-[1.3]">
                              {product.title}
                            </h3>
                          </Link>
                        </div>

                        <div className="mt-auto pt-3.5 border-t border-[#E2D9CC] flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[19px] font-heading font-black text-[#10201B]">
                              ${Number(product.price || 0).toFixed(2)}
                            </span>
                            {product.originalPrice && (
                              <span className="ml-2 text-[12px] font-mono text-[#8A8F8C] line-through">
                                ${Number(product.originalPrice).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            className="p-2.5 rounded-xl bg-[#EBF3EE] hover:bg-[#1C352D] text-[#1C352D] hover:text-[#FDFBF7] border border-[#BDD6C4] hover:border-[#1C352D] transition-all shadow-2xs"
                            aria-label="View Deal"
                          >
                            <ExternalLink size={15} className="text-[#D9A441]" />
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E2D9CC] p-12 text-center text-[#6B7280] shadow-xs max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#F8F0E5] border border-[#E2D9CC] flex items-center justify-center mx-auto mb-4 text-[#8A8F8C]">
                  <Tag size={24} />
                </div>
                <h3 className="text-[20px] font-heading font-bold text-[#10201B] mb-1">
                  No products found in this category level
                </h3>
                <p className="text-[13.5px]">Check back later or explore subcategories above.</p>
              </div>
            )}
          </div>

          {/* Long Description Block */}
          {category.description && (
            <div className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#E2D9CC] p-6 md:p-8 mb-14 shadow-xs">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="block w-1.5 h-6 rounded-full bg-[#D9A441]" />
                <h2 className="text-[20px] font-heading font-bold text-[#10201B]">
                  About {category.name}
                </h2>
              </div>
              <div className="text-[#6B7280] text-[14.5px] leading-relaxed space-y-4 font-normal">
                {category.description}
              </div>
            </div>
          )}

          {/* Cross-Category Discovery */}
          {otherProducts.length > 0 && (
            <div className="pt-8 border-t border-[#E2D9CC]">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
                  <Compass size={18} />
                </div>
                <div>
                  <h2 className="text-[20px] md:text-[22px] font-heading font-extrabold text-[#10201B] tracking-tight">
                    Explore Popular Deals From Other Categories
                  </h2>
                  <p className="text-[13px] text-[#6B7280]">
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
                    <article
                      key={product._id}
                      className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] shadow-xs overflow-hidden flex flex-col hover:-translate-y-1 transition-all duration-300 group p-4"
                    >
                      <Link
                        href={pdpUrl}
                        className="relative aspect-square w-full block bg-[#FDFBF7] rounded-[18px] border border-[#E2D9CC] p-4 mb-3 shrink-0"
                      >
                        {product.categoryId?.name && (
                          <div className="absolute top-3 left-3 bg-[#10201B]/85 backdrop-blur-md text-[#D9A441] text-[9.5px] font-heading font-extrabold uppercase px-2.5 py-1 rounded-full z-10 border border-[#25473C]">
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

                      <div className="flex flex-col flex-grow justify-between">
                        <Link href={pdpUrl}>
                          <h3 className="font-heading font-bold text-[14.5px] text-[#10201B] line-clamp-2 mb-2 group-hover:text-[#D9A441] transition-colors leading-[1.3]">
                            {product.title}
                          </h3>
                        </Link>

                        <div className="mt-auto pt-3 border-t border-[#E2D9CC] flex items-center justify-between">
                          <span className="text-[17px] font-heading font-black text-[#10201B]">
                            ${Number(product.price || 0).toFixed(2)}
                          </span>
                          <a
                            href={product.affiliateLink}
                            target="_blank"
                            rel="sponsored nofollow noopener"
                            className="p-2 rounded-lg bg-[#EBF3EE] hover:bg-[#1C352D] text-[#1C352D] hover:text-[#FDFBF7] border border-[#BDD6C4] hover:border-[#1C352D] transition-all"
                            aria-label="View Deal"
                          >
                            <ExternalLink size={13} className="text-[#D9A441]" />
                          </a>
                        </div>
                      </div>
                    </article>
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