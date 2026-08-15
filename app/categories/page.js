import React from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight, Layers, ArrowUpRight, Sparkles, FolderTree } from "lucide-react";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";

import "@/app/models/category";

export const revalidate = 60; // ISR 60 Seconds

export const metadata = {
  title: "Product Categories Directory | Explore Product Taxonomies – VestoriaHub",
  description:
    "Browse our organized taxonomy directory to discover product categories, departments, and curated deals across top global brands.",
  openGraph: {
    title: "Product Categories Directory – Product Taxonomies | VestoriaHub",
    description: "Explore product categories to find verified deals and top merchant savings.",
    url: "https://www.vestoriahub.com/categories",
    siteName: "VestoriaHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Product Categories Directory – Product Taxonomies | VestoriaHub",
    description: "Explore product categories to find verified deals and top merchant savings.",
  },
};

function getCategoryModel() {
  const Category = mongoose.models.Category;
  if (!Category) {
    throw new Error("Category model is not registered in Mongoose.");
  }
  return Category;
}

// ── Data Fetching Helper ──────────────────────────────────────────────────
async function getProductCategoriesDirectory() {
  try {
    await connectDB();
    const Category = getCategoryModel();

    // Fetch active categories filtering ONLY by "product" type
    const categories = await Category.find({
      status: "active",
      type: "product",
    })
      .select("name slug type level parentId icon shortDescription uiConfig")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const parentMap = new Map();
    const l0Parents = [];

    categories.forEach((cat) => {
      if (cat.level === 0) {
        const node = { ...cat, children: [] };
        parentMap.set(cat._id.toString(), node);
        l0Parents.push(node);
      }
    });

    categories.forEach((cat) => {
      if (cat.level === 1 && cat.parentId) {
        const parentNode = parentMap.get(cat.parentId.toString());
        if (parentNode) {
          parentNode.children.push(cat);
        }
      }
    });

    return JSON.parse(JSON.stringify(l0Parents));
  } catch (error) {
    console.error("Error fetching categories directory:", error);
    return [];
  }
}

export default async function AllCategoriesPage() {
  const categoryTree = await getProductCategoriesDirectory();

  return (
    <main className="min-h-screen bg-[#F8F0E5] font-sans pb-24 text-[#16241F]">
      
      {/* ── BREADCRUMB ── */}
      <nav aria-label="Breadcrumb" className="bg-[#FFFFFF] border-b border-[#E2D9CC] py-3.5">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-[12px] font-mono text-[#8A8F8C]">
          <Link href="/" className="hover:text-[#1C352D] transition-colors">
            Home
          </Link>
          <ChevronRight size={12} className="text-[#BDD6C4]" />
          <span className="text-[#10201B] font-bold">Categories Directory</span>
        </div>
      </nav>

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
            <LayoutGrid size={13} />
            <span>Product Taxonomy Hierarchy</span>
          </div>

          <h1 className="text-[#FDFBF7] text-[34px] sm:text-[46px] md:text-[54px] font-heading font-black tracking-tight leading-[1.08] mb-4">
            Browse Product <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
              Departments & Subcategories.
            </span>
          </h1>

          <p className="text-[#D5E4D9] text-[15px] md:text-[16.5px] max-w-[620px] mx-auto leading-relaxed font-normal mb-6">
            Explore organized product departments, explore specialized subcategories, and uncover verified discounts across global retail channels.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] font-mono text-[#A8C3B0]">
            <span className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-3.5 py-1.5 rounded-full">
              <FolderTree size={14} className="text-[#D9A441]" />
              <strong>{categoryTree.length}</strong> Main Departments
            </span>
            <span className="inline-flex items-center gap-1.5 bg-[#162B24] border border-[#25473C] px-3.5 py-1.5 rounded-full">
              <Sparkles size={14} className="text-[#34D399]" />
              Verified Deal Mappings
            </span>
          </div>
        </div>
      </section>

      {/* ── CATEGORY TREE GRID LAYOUT ── */}
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {categoryTree.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {categoryTree.map((parent) => {
              const parentUrl = `/categories/${parent.slug}`;

              return (
                <div
                  key={parent._id}
                  className="bg-[#FFFFFF] rounded-[24px] border-2 border-[#E2D9CC] hover:border-[#BDD6C4] p-6 sm:p-7 shadow-xs hover:shadow-[0_16px_36px_rgba(28,53,45,0.09)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Parent Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl bg-[#FDFBF7] border border-[#E2D9CC] group-hover:border-[#BDD6C4] flex items-center justify-center text-[#D9A441] shadow-2xs transition-colors shrink-0">
                          {parent.icon ? (
                            <span className="text-[22px] leading-none">{parent.icon}</span>
                          ) : (
                            <Layers size={22} className="text-[#D9A441]" />
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#427867] block mb-0.5">
                            Product Department
                          </span>
                          <Link href={parentUrl} className="focus:outline-none">
                            <h2 className="text-[19px] sm:text-[21px] font-heading font-extrabold text-[#10201B] group-hover:text-[#D9A441] transition-colors leading-tight line-clamp-1">
                              {parent.name}
                            </h2>
                          </Link>
                        </div>
                      </div>

                      <Link
                        href={parentUrl}
                        className="w-8 h-8 rounded-full bg-[#EBF3EE] text-[#1C352D] flex items-center justify-center group-hover:bg-[#1C352D] group-hover:text-[#FDFBF7] transition-all shrink-0"
                        aria-label={`View ${parent.name}`}
                      >
                        <ArrowUpRight size={15} strokeWidth={2.5} />
                      </Link>
                    </div>

                    {/* Short Description */}
                    {parent.shortDescription ? (
                      <p className="text-[#6B7280] text-[13.5px] line-clamp-2 mb-5 leading-relaxed font-normal">
                        {parent.shortDescription}
                      </p>
                    ) : (
                      <p className="text-[#6B7280] text-[13.5px] line-clamp-2 mb-5 leading-relaxed font-normal">
                        Explore verified deals, promotions, and top merchant offerings in {parent.name}.
                      </p>
                    )}

                    {/* Subcategories List */}
                    {parent.children?.length > 0 && (
                      <div className="pt-4 border-t border-[#E2D9CC] mb-6">
                        <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider text-[#8A8F8C] mb-3">
                          Popular Subcategories ({parent.children.length})
                        </div>
                        <ul className="space-y-1.5">
                          {parent.children.slice(0, 5).map((child) => (
                            <li key={child._id}>
                              <Link
                                href={`/categories/${child.slug}`}
                                className="flex items-center justify-between w-full text-[13px] font-heading font-semibold text-[#1C352D] hover:text-[#D9A441] bg-[#FDFBF7] hover:bg-[#EBF3EE] border border-[#E2D9CC] rounded-xl px-3 py-2 transition-all"
                              >
                                <span className="truncate">{child.name}</span>
                                <ChevronRight size={13} className="text-[#8A8F8C] shrink-0" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Primary CTA Link */}
                  <Link
                    href={parentUrl}
                    className="w-full mt-auto inline-flex items-center justify-center gap-1.5 bg-[#EBF3EE] hover:bg-[#1C352D] text-[#1C352D] hover:text-[#FDFBF7] border border-[#BDD6C4] hover:border-[#1C352D] py-2.5 rounded-xl font-heading font-bold text-[13px] transition-all duration-200 shadow-2xs group/cta"
                  >
                    <span>Explore All {parent.name} Deals</span>
                    <ChevronRight size={14} className="transition-transform group-hover/cta:translate-x-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-[#FFFFFF] rounded-[24px] border border-[#E2D9CC] p-12 text-center text-[#6B7280] shadow-xs max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#F8F0E5] border border-[#E2D9CC] flex items-center justify-center mx-auto mb-4 text-[#8A8F8C]">
              <Layers size={24} />
            </div>
            <h3 className="text-[20px] font-heading font-bold text-[#10201B] mb-1">
              No product categories found
            </h3>
            <p className="text-[13.5px]">
              Make sure categories with status &ldquo;active&rdquo;, level 0, and type &ldquo;product&rdquo; exist in your database.
            </p>
          </div>
        )}
      </div>

    </main>
  );
}