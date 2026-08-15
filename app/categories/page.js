import React from "react";
import Link from "next/link";
import { LayoutGrid, ChevronRight, Layers, ArrowUpRight, ShoppingBag } from "lucide-react";
import mongoose from "mongoose";
import { connectDB } from "@/app/lib/mongodb";

import "@/app/models/category";

export const revalidate = 60; // ISR 60 Seconds

export const metadata = {
  title: "Product Categories Directory | Explore Product Taxonomies",
  description:
    "Browse our organized taxonomy directory to discover product categories and curated deals.",
  openGraph: {
    title: "Product Categories Directory - Product Taxonomies",
    description: "Explore product categories to find top deals.",
    type: "website",
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
    <div className="bg-navy-900 min-h-screen py-10 md:py-16 text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-[13px] font-medium text-lavender-400 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <ChevronRight size={14} className="text-lavender-500" />
          <span className="text-white font-semibold">Categories</span>
        </nav>

        {/* Header Section */}
        <div className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 md:p-10 mb-8 shadow-[0_8px_30px_rgba(6,7,19,0.5)]">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[12px] font-bold uppercase tracking-wider mb-4 shadow-sm">
            <LayoutGrid size={14} strokeWidth={2.5} />
            Product Taxonomy
          </div>

          <h1 className="text-[34px] md:text-[48px] font-black text-white leading-tight mb-4 tracking-tight">
            Browse Product Categories
          </h1>

          <p className="text-lavender-400 text-[16px] md:text-[18px] max-w-3xl leading-relaxed">
            Discover product departments and subcategories to explore verified deals and discounts.
          </p>
        </div>

        {/* Category Tree Grid Layout */}
        {categoryTree.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categoryTree.map((parent) => {
              const themeColor = parent.uiConfig?.themeColor || "var(--purple-400)";
              const parentUrl = `/categories/${parent.slug}`;

              return (
                <div
                  key={parent._id}
                  className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-6 shadow-[0_4px_20px_rgba(6,7,19,0.3)] hover:shadow-[0_8px_30px_rgba(124,92,252,0.25)] hover:border-purple-500 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Parent Header */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {parent.icon ? (
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[22px] bg-purple-500/15 border border-purple-500/30"
                            style={{ color: themeColor }}
                          >
                            {parent.icon}
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Layers size={22} />
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                            Product Department
                          </span>
                          <Link href={parentUrl}>
                            <h2 className="text-[20px] font-extrabold text-white group-hover:text-purple-400 transition-colors leading-tight">
                              {parent.name}
                            </h2>
                          </Link>
                        </div>
                      </div>

                      <Link
                        href={parentUrl}
                        className="p-2 rounded-xl bg-navy-700 group-hover:bg-purple-500 text-lavender-400 group-hover:text-white transition-all border border-[var(--indigo-line)]"
                        aria-label={`View ${parent.name}`}
                      >
                        <ArrowUpRight size={20} />
                      </Link>
                    </div>

                    {/* Short Description */}
                    {parent.shortDescription && (
                      <p className="text-lavender-400 text-[14px] line-clamp-2 mb-6 leading-relaxed">
                        {parent.shortDescription}
                      </p>
                    )}

                    {/* Subcategories List */}
                    {parent.children?.length > 0 && (
                      <div className="pt-4 border-t border-[var(--indigo-line)] mb-6">
                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-lavender-400 mb-3">
                          Popular Subcategories ({parent.children.length})
                        </div>
                        <ul className="space-y-2">
                          {parent.children.slice(0, 5).map((child) => (
                            <li key={child._id}>
                              <Link
                                href={`/categories/${parent.slug}/${child.slug}`}
                                className="inline-flex items-center justify-between w-full text-[14px] font-semibold text-white hover:text-purple-400 hover:translate-x-1 transition-all py-1"
                              >
                                <span>{child.name}</span>
                                <ChevronRight size={14} className="text-lavender-500" />
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
                    className="w-full mt-auto inline-flex items-center justify-center gap-2 bg-purple-500/15 hover:bg-purple-500 text-purple-300 hover:text-white border border-purple-500/30 hover:border-purple-500 py-3 rounded-xl font-bold text-[14px] transition-all duration-200"
                  >
                    <span>Explore {parent.name}</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-navy-800 rounded-3xl border border-[var(--indigo-line)] p-12 text-center text-lavender-400">
            <h3 className="text-[20px] font-bold text-white mb-2">
              No product categories found
            </h3>
            <p>Make sure categories with status: "active", level: 0, and type: "product" exist in MongoDB.</p>
          </div>
        )}
      </div>
    </div>
  );
}