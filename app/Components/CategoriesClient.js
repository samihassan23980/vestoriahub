"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  Grid,
  Tag,
  Sparkles,
  TrendingUp,
  MonitorSmartphone,
  Sofa,
  Plane,
  Shirt,
  LayoutGrid,
  Store as StoreIcon,
  FileText,
  ShoppingBag,
} from "lucide-react";

// Custom Hook: Debounce search to prevent UI freezing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// Smart Icon Renderer: Maps database image, icon string, or module type to a UI icon
const CategoryIcon = ({ category }) => {
  if (category.image?.url) {
    return (
      <img
        src={category.image.url}
        alt={category.name}
        loading="lazy"
        className="w-[28px] h-[28px] object-contain"
      />
    );
  }

  // Fallback to Module Type Icons if specific strings aren't found
  if (category.type === "store")
    return <StoreIcon size={28} className="text-purple-400" />;
  if (category.type === "blog")
    return <FileText size={28} className="text-purple-400" />;
  if (category.type === "product")
    return <ShoppingBag size={28} className="text-purple-400" />;

  const nameStr = category.name.toLowerCase();
  const iconStr = (category.icon || "").toLowerCase();

  if (
    nameStr.includes("tech") ||
    nameStr.includes("electronic") ||
    iconStr.includes("tech")
  ) {
    return <MonitorSmartphone size={28} className="text-purple-400" />;
  }
  if (
    nameStr.includes("home") ||
    nameStr.includes("garden") ||
    iconStr.includes("home")
  ) {
    return <Sofa size={28} className="text-purple-400" />;
  }
  if (
    nameStr.includes("travel") ||
    nameStr.includes("flight") ||
    iconStr.includes("travel")
  ) {
    return <Plane size={28} className="text-purple-400" />;
  }
  if (
    nameStr.includes("fashion") ||
    nameStr.includes("apparel") ||
    iconStr.includes("fashion")
  ) {
    return <Shirt size={28} className="text-purple-400" />;
  }

  return <LayoutGrid size={28} className="text-purple-400" />;
};

export default function CategoriesClient({ initialCategories }) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // 🔥 NEW: Filter State for Module Type (Approach 1 integration)
  const [activeType, setActiveType] = useState("all");

  // Client-side filtering (Zero latency for the user)
  const filteredCategories = initialCategories.filter((cat) => {
    // 1. Filter by Module Type Tab
    if (activeType !== "all" && cat.type !== activeType) return false;

    // 2. Filter by Search Query (Checks parent and children)
    if (!debouncedSearch) return true;

    const searchLower = debouncedSearch.toLowerCase();
    const matchesParent = cat.name.toLowerCase().includes(searchLower);
    const matchesChild =
      cat.children &&
      cat.children.some((child) =>
        child.name.toLowerCase().includes(searchLower),
      );

    return matchesParent || matchesChild;
  });

  return (
    <div className="min-h-screen bg-navy-800 selection:bg-purple-500/30 selection:text-white font-sans pb-24">
      {/* ─── HERO SECTION ─── */}
      <div className="bg-navy-800 border-b border-[var(--indigo-line)] pt-[80px] pb-[60px] relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-yellow-400/10 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-[250px] h-[250px] bg-purple-500/10 rounded-full blur-[50px] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-[24px] relative z-10 text-center">
          <div className="inline-flex items-center gap-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[12px] font-bold tracking-[0.1em] uppercase px-[16px] py-[8px] rounded-full mb-[24px]">
            <Grid size={14} /> Directory
          </div>

          <h1 className="text-[38px] md:text-[54px] font-bold text-white leading-[1.15] tracking-tight mb-[20px] max-w-[800px] mx-auto">
            Explore All Categories
          </h1>

          <p className="text-[18px] text-lavender-400 leading-[1.6] max-w-[600px] mx-auto mb-[40px]">
            Browse our comprehensive directory to find the best deals, verified
            coupons, and expert buying guides for every product imaginable.
          </p>

          <div className="max-w-[600px] mx-auto relative group">
            <div className="absolute inset-y-0 left-[20px] flex items-center pointer-events-none">
              <Search
                size={20}
                className="text-lavender-500 group-focus-within:text-purple-400 transition-colors"
              />
            </div>
            <input
              type="text"
              placeholder="Search for electronics, fashion, travel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-[60px] pl-[56px] pr-[24px] bg-navy-700 border-[2px] border-[var(--indigo-line)] rounded-full text-[16px] text-white shadow-sm outline-none focus:border-purple-500 focus:ring-[4px] focus:ring-purple-500/20 transition-all duration-300 placeholder:text-lavender-500"
            />
          </div>
        </div>
      </div>

      {/* ─── QUICK STATS BAR ─── */}
      <div className="bg-navy-900 border-b border-[var(--indigo-line)] py-[20px]">
        <div className="max-w-[1280px] mx-auto px-[24px] flex flex-wrap items-center justify-center gap-[24px] md:gap-[64px]">
          <div className="flex items-center gap-[12px] text-white">
            <div className="w-[40px] h-[40px] rounded-full bg-navy-700 flex items-center justify-center">
              <Tag size={18} className="text-yellow-400" />
            </div>
            <div>
              <div className="text-[18px] font-bold leading-none mb-[4px]">
                15,000+
              </div>
              <div className="text-[12px] text-lavender-500 font-semibold uppercase tracking-wider">
                Active Deals
              </div>
            </div>
          </div>
          <div className="hidden md:block w-[1px] h-[30px] bg-[var(--indigo-line)]" />
          <div className="flex items-center gap-[12px] text-white">
            <div className="w-[40px] h-[40px] rounded-full bg-navy-700 flex items-center justify-center">
              <Sparkles size={18} className="text-emerald-400" />
            </div>
            <div>
              <div className="text-[18px] font-bold leading-none mb-[4px]">
                250+
              </div>
              <div className="text-[12px] text-lavender-500 font-semibold uppercase tracking-wider">
                Top Brands
              </div>
            </div>
          </div>
          <div className="hidden md:block w-[1px] h-[30px] bg-[var(--indigo-line)]" />
          <div className="flex items-center gap-[12px] text-white">
            <div className="w-[40px] h-[40px] rounded-full bg-navy-700 flex items-center justify-center">
              <TrendingUp size={18} className="text-purple-400" />
            </div>
            <div>
              <div className="text-[18px] font-bold leading-none mb-[4px]">
                $4.2M
              </div>
              <div className="text-[12px] text-lavender-500 font-semibold uppercase tracking-wider">
                User Savings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CATEGORY GRID ─── */}
      <div className="max-w-[1280px] mx-auto px-[24px] pt-[48px]">
        {/* 🔥 NEW: MODULE TYPE FILTER TABS */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-[40px]">
          {["all", "product", "store", "blog", "general"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-6 py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 capitalize ${
                activeType === type
                  ? "bg-purple-500 text-white shadow-md"
                  : "bg-navy-700 border border-[var(--indigo-line)] text-lavender-400 hover:border-purple-500 hover:text-purple-400"
              }`}
            >
              {type === "all" ? "All Categories" : `${type}s`}
            </button>
          ))}
        </div>

        {/* Empty Search Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-[80px] bg-navy-600 rounded-[20px] border border-[var(--indigo-line)]">
            <div className="inline-flex items-center justify-center w-[80px] h-[80px] rounded-full bg-navy-700 border border-[var(--indigo-line)] mb-[20px]">
              <Search size={32} className="text-lavender-500" />
            </div>
            <h3 className="text-[24px] font-bold text-white mb-[8px]">
              No categories found
            </h3>
            <p className="text-[15px] text-lavender-400">
              We couldn't find any {activeType !== "all" ? activeType : ""}{" "}
              categories matching "{searchTerm}".
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveType("all");
              }}
              className="mt-6 px-6 py-2.5 bg-navy-700 text-white font-bold rounded-lg border border-[var(--indigo-line)] hover:bg-purple-500 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Dynamic Data Grid */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-[32px]">
            {filteredCategories.map((category) => (
              <div
                key={category._id}
                className="group bg-navy-600 border border-[var(--indigo-line)] rounded-[20px] p-[32px] hover:shadow-[0_16px_48px_rgba(124,92,252,0.15)] hover:border-purple-500/50 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-[20px]">
                  <div className="flex items-center gap-[16px]">
                    <div className="w-[64px] h-[64px] rounded-[16px] bg-navy-700 group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                      <CategoryIcon category={category} />
                    </div>
                    <div>
                      <h2
                        className="text-[24px] font-bold text-white mb-[4px] group-hover:text-purple-400 transition-colors line-clamp-1"
                        title={category.name}
                      >
                        <Link
                          href={`/category/${category.slug}`}
                          className="before:absolute before:inset-0"
                        >
                          {category.name}
                        </Link>
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-lavender-400 bg-navy-700 border border-[var(--indigo-line)] px-[10px] py-[4px] rounded-full capitalize">
                          {category.type || "General"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Action Button */}
                  <div className="w-[40px] h-[40px] shrink-0 rounded-full bg-navy-700 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white text-lavender-400 transition-colors z-10 relative">
                    <ChevronRight size={20} />
                  </div>
                </div>

                {/* Short Description */}
                <p className="text-[15px] text-lavender-400 leading-[1.65] mb-[24px] line-clamp-2">
                  {category.shortDescription ||
                    `Find the best deals and offers in the ${category.name} category.`}
                </p>

                {/* Divider */}
                <div className="w-full h-[1px] bg-[var(--indigo-line)] mb-[24px]" />

                {/* Sub-categories (L1 Children) */}
                {category.children && category.children.length > 0 ? (
                  <div className="mt-auto">
                    <div className="text-[11px] font-bold text-lavender-500 uppercase tracking-[0.08em] mb-[12px]">
                      Popular in {category.name}
                    </div>
                    <div className="flex flex-wrap gap-[10px] relative z-10">
                      {category.children.slice(0, 4).map((child) => (
                        <Link
                          key={child._id}
                          href={`/category/${child.slug}`}
                          className="text-[13px] font-semibold text-lavender-300 bg-navy-700 border border-[var(--indigo-line)] px-[14px] py-[8px] rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-all duration-200"
                        >
                          {child.name}
                        </Link>
                      ))}
                      {category.children.length > 4 && (
                        <Link
                          href={`/category/${category.slug}`}
                          className="text-[13px] font-bold text-purple-400 px-[14px] py-[8px] rounded-lg hover:bg-navy-500 transition-colors flex items-center gap-[4px]"
                        >
                          +{category.children.length - 4} more{" "}
                          <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-auto relative z-10">
                    <Link
                      href={`/category/${category.slug}`}
                      className="text-[13px] font-bold text-purple-400 bg-navy-700 border border-[var(--indigo-line)] px-[14px] py-[8px] rounded-lg hover:bg-navy-500 transition-colors inline-flex items-center gap-[4px]"
                    >
                      View All {category.name} <ChevronRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
