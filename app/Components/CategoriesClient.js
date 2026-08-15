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
  ShieldCheck,
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
    return <StoreIcon size={26} className="text-[#D9A441]" />;
  if (category.type === "blog")
    return <FileText size={26} className="text-[#D9A441]" />;
  if (category.type === "product")
    return <ShoppingBag size={26} className="text-[#D9A441]" />;

  const nameStr = category.name.toLowerCase();
  const iconStr = (category.icon || "").toLowerCase();

  if (
    nameStr.includes("tech") ||
    nameStr.includes("electronic") ||
    iconStr.includes("tech")
  ) {
    return <MonitorSmartphone size={26} className="text-[#D9A441]" />;
  }
  if (
    nameStr.includes("home") ||
    nameStr.includes("garden") ||
    iconStr.includes("home")
  ) {
    return <Sofa size={26} className="text-[#D9A441]" />;
  }
  if (
    nameStr.includes("travel") ||
    nameStr.includes("flight") ||
    iconStr.includes("travel")
  ) {
    return <Plane size={26} className="text-[#D9A441]" />;
  }
  if (
    nameStr.includes("fashion") ||
    nameStr.includes("apparel") ||
    iconStr.includes("fashion")
  ) {
    return <Shirt size={26} className="text-[#D9A441]" />;
  }

  return <LayoutGrid size={26} className="text-[#D9A441]" />;
};

export default function CategoriesClient({ initialCategories = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeType, setActiveType] = useState("all");

  // Client-side filtering (Zero latency for the user)
  const filteredCategories = initialCategories.filter((cat) => {
    // 1. Filter by Module Type Tab
    if (activeType !== "all" && cat.type !== activeType) return false;

    // 2. Filter by Search Query (Checks parent and children)
    if (!debouncedSearch) return true;

    const searchLower = debouncedSearch.toLowerCase();
    const matchesParent = cat.name?.toLowerCase().includes(searchLower);
    const matchesChild =
      cat.children &&
      cat.children.some((child) =>
        child.name?.toLowerCase().includes(searchLower)
      );

    return matchesParent || matchesChild;
  });

  return (
    <div className="min-h-screen bg-[#F8F0E5] font-sans pb-24 text-[#16241F]">
      
      {/* ─── HERO SECTION (VESTORIAHUB SIGNATURE S-WAVE THEME) ─── */}
      <section className="relative w-full bg-[#10201B] border-b border-[#25473C] pt-16 pb-20 overflow-hidden text-[#FDFBF7]">
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

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-[#162B24] border border-[#25473C] text-[#D9A441] text-[11px] font-heading font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-xs">
            <Grid size={13} />
            <span>Category Directory</span>
          </div>

          <h1 className="text-[34px] sm:text-[46px] md:text-[54px] font-heading font-black tracking-tight text-[#FDFBF7] leading-[1.08] mb-4">
            Explore All Categories & <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
              Curated Deal Topics.
            </span>
          </h1>

          <p className="text-[#D5E4D9] text-[15px] md:text-[16.5px] max-w-[620px] mx-auto leading-relaxed font-normal mb-8">
            Browse our comprehensive department directory to discover verified promo codes, curated marketplace discounts, and editorial reviews for every category.
          </p>

          {/* Minimal Search Input */}
          <div className="w-full max-w-[560px] relative group">
            <div className="bg-[#162B24] p-1.5 rounded-2xl border border-[#25473C] shadow-md flex items-center focus-within:border-[#D9A441] transition-all">
              <Search
                size={18}
                className="ml-3 text-[#8A8F8C] group-focus-within:text-[#D9A441] transition-colors shrink-0"
              />
              <input
                type="text"
                placeholder="Search categories (e.g., electronics, apparel, home)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[46px] px-3 bg-transparent text-[14px] text-[#FDFBF7] placeholder:text-[#8A8F8C] font-medium focus:outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK METRICS BAR ─── */}
      <div className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-5">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-6 sm:gap-12 lg:gap-16">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
              <Tag size={17} className="text-[#D9A441]" />
            </div>
            <div>
              <div className="text-[17px] font-heading font-extrabold text-[#10201B] leading-none mb-1">
                15,000+
              </div>
              <div className="text-[11px] font-mono text-[#8A8F8C] font-semibold uppercase tracking-wider">
                Active Deals
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-7 bg-[#E2D9CC]" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
              <Sparkles size={17} className="text-[#34D399]" />
            </div>
            <div>
              <div className="text-[17px] font-heading font-extrabold text-[#10201B] leading-none mb-1">
                500+
              </div>
              <div className="text-[11px] font-mono text-[#8A8F8C] font-semibold uppercase tracking-wider">
                Top Brands
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-[1px] h-7 bg-[#E2D9CC]" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EBF3EE] border border-[#BDD6C4] flex items-center justify-center text-[#1C352D]">
              <TrendingUp size={17} className="text-[#D9A441]" />
            </div>
            <div>
              <div className="text-[17px] font-heading font-extrabold text-[#10201B] leading-none mb-1">
                $4.2M+
              </div>
              <div className="text-[11px] font-mono text-[#8A8F8C] font-semibold uppercase tracking-wider">
                Community Savings
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── CATEGORY DIRECTORY GRID CONTAINER ─── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Module Type Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {["all", "product", "store", "blog", "general"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-5 py-2 rounded-full font-heading font-bold text-[12.5px] transition-all capitalize shadow-2xs ${
                activeType === type
                  ? "bg-[#1C352D] text-[#FDFBF7] border border-[#1C352D]"
                  : "bg-[#FFFFFF] border border-[#E2D9CC] text-[#16241F] hover:border-[#1C352D] hover:bg-[#EBF3EE]"
              }`}
            >
              {type === "all" ? "All Departments" : `${type}s`}
            </button>
          ))}
        </div>

        {/* Empty Search Results */}
        {filteredCategories.length === 0 && (
          <div className="text-center py-16 bg-[#FFFFFF] rounded-3xl border border-[#E2D9CC] shadow-xs max-w-lg mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#F8F0E5] border border-[#E2D9CC] mb-4 text-[#8A8F8C]">
              <Search size={26} />
            </div>
            <h3 className="text-[20px] font-heading font-bold text-[#10201B] mb-1">
              No categories found
            </h3>
            <p className="text-[13.5px] text-[#6B7280] max-w-sm mx-auto">
              We couldn&apos;t find any {activeType !== "all" ? activeType : ""}{" "}
              categories matching &ldquo;{searchTerm}&rdquo;.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setActiveType("all");
              }}
              className="mt-6 px-6 py-2.5 bg-[#1C352D] text-[#FDFBF7] font-heading font-bold rounded-full hover:bg-[#10201B] transition-colors text-[13px]"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Dynamic Category Data Grid */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredCategories.map((category) => (
              <article
                key={category._id}
                className="group bg-[#FFFFFF] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] rounded-[24px] p-6 sm:p-7 hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shadow-xs relative overflow-hidden"
              >
                <div>
                  {/* Card Header Top */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FDFBF7] border border-[#E2D9CC] group-hover:border-[#BDD6C4] flex items-center justify-center transition-colors shrink-0 shadow-2xs">
                        <CategoryIcon category={category} />
                      </div>
                      <div>
                        <h2
                          className="text-[20px] sm:text-[22px] font-heading font-extrabold text-[#10201B] group-hover:text-[#D9A441] transition-colors line-clamp-1"
                          title={category.name}
                        >
                          <Link
                            href={`/categories/${category.slug}`}
                            className="focus:outline-none"
                          >
                            {category.name}
                          </Link>
                        </h2>
                        <span className="inline-block text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#1C352D] bg-[#EBF3EE] border border-[#BDD6C4] px-2.5 py-0.5 rounded-md mt-1">
                          {category.type || "Department"}
                        </span>
                      </div>
                    </div>

                    {/* Arrow Action Icon */}
                    <div className="w-8 h-8 rounded-full bg-[#EBF3EE] text-[#1C352D] flex items-center justify-center group-hover:bg-[#1C352D] group-hover:text-[#FDFBF7] transition-all shrink-0">
                      <ChevronRight size={16} />
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-[13.5px] text-[#6B7280] leading-relaxed mb-6 line-clamp-2 font-normal">
                    {category.shortDescription ||
                      category.description ||
                      `Explore verified promo codes, tested coupons, and buying reviews in ${category.name}.`}
                  </p>
                </div>

                {/* Sub-categories (Child L1 Links) */}
                <div className="w-full pt-4 border-t border-[#E2D9CC] mt-auto">
                  {category.children && category.children.length > 0 ? (
                    <div>
                      <div className="text-[10.5px] font-mono font-bold text-[#8A8F8C] uppercase tracking-wider mb-2.5">
                        Popular Sub-Topics
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {category.children.slice(0, 4).map((child) => (
                          <Link
                            key={child._id}
                            href={`/categories/${child.slug}`}
                            className="text-[12px] font-heading font-semibold text-[#1C352D] bg-[#FDFBF7] border border-[#E2D9CC] px-3 py-1.5 rounded-lg hover:border-[#1C352D] hover:bg-[#EBF3EE] transition-all"
                          >
                            {child.name}
                          </Link>
                        ))}
                        {category.children.length > 4 && (
                          <Link
                            href={`/categories/${category.slug}`}
                            className="text-[12px] font-heading font-bold text-[#1C352D] px-2.5 py-1.5 hover:text-[#D9A441] transition-colors flex items-center gap-1"
                          >
                            +{category.children.length - 4} more
                            <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="text-[12px] font-heading font-bold text-[#1C352D] hover:text-[#D9A441] inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Browse all {category.name} deals</span>
                        <ChevronRight size={13} />
                      </Link>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}