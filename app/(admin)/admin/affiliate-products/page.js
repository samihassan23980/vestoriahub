/* app/(admin)/admin/affiliate-products/page.js */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  ExternalLink,
  Star,
  Package,
} from "lucide-react";

const getArrayFromApi = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
};

const getProductId = (product) => product?._id || product?.id;

const getPrimaryImage = (product) => {
  const primary = product?.images?.find((img) => img?.isPrimary);
  return (
    primary?.url ||
    product?.images?.[0]?.url ||
    "https://via.placeholder.com/150"
  );
};

const getCategoryName = (product) => {
  if (typeof product?.categoryId === "object") {
    return product.categoryId?.name || "Uncategorized";
  }

  return product?.categoryName || "Uncategorized";
};

const formatPrice = (amount, currency = "USD") => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "-";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
};

const ManageAffiliateProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "10");

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    return params.toString();
  }, [page, statusFilter, debouncedSearch]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/admin/affiliate-products?${queryString}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to fetch affiliate products.");
      }

      const productsArray = getArrayFromApi(data, "products");

      setProducts(productsArray);
      setPagination(
        data?.pagination || {
          total: data?.total || productsArray.length,
          page: data?.page || page,
          limit: 10,
          totalPages: data?.totalPages || 1,
        },
      );
    } catch (err) {
      setError(err.message || "Failed to fetch affiliate products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [queryString]);

  const handleDelete = async (product) => {
    const id = getProductId(product);

    if (!id) return;

    const result = await Swal.fire({
      title: "Delete affiliate product?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#7775A0",
    });

    if (!result.isConfirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/admin/affiliate-products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to delete product.");
      }

      await Swal.fire({
        title: "Deleted!",
        text: data?.message || "Affiliate product deleted successfully.",
        icon: "success",
        confirmButtonColor: "#2D2380",
      });

      fetchProducts();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Failed to delete product.",
        icon: "error",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <span className="px-2.5 py-1 bg-[#E1F5EE] text-[#22B07D] text-[12px] font-bold rounded-md">
            Published
          </span>
        );
      case "draft":
        return (
          <span className="px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[12px] font-bold rounded-md">
            Draft
          </span>
        );
      case "out_of_stock":
        return (
          <span className="px-2.5 py-1 bg-[#FCEBEB] text-[#E24B4A] text-[12px] font-bold rounded-md">
            Out of Stock
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
              <Package size={24} className="text-[#F4A836]" />
              Affiliate Products
            </h1>
            <p className="text-[#7775A0] text-[14px] mt-1">
              Manage curated products, editorial reviews, and affiliate
              tracking.
            </p>
          </div>
          <Link
            href="/admin/affiliate-products/new"
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#FF6B35] hover:bg-[#e05520] text-white rounded-lg font-bold text-[14px] shadow-sm transition-all"
          >
            <Plus size={18} /> Add New Product
          </Link>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-t-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search products, brands, or badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <Filter size={16} className="text-[#7775A0] mr-1 shrink-0" />
            {["all", "published", "draft", "out_of_stock"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === status
                    ? "bg-[#2D2380] text-white"
                    : "bg-[#F7F6FF] text-[#7775A0] hover:bg-[#EEEDFE] hover:text-[#2D2380] border border-[#E0DEF5]"
                }`}
              >
                {status.charAt(0).toUpperCase() +
                  status.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border-x border-b border-[#E0DEF5] rounded-b-xl overflow-x-auto shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F6FF] border-b border-[#E0DEF5]">
                <th className="px-6 py-4 text-[12px] font-bold text-[#7775A0] uppercase tracking-wider">
                  Product Info
                </th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#7775A0] uppercase tracking-wider">
                  Pricing
                </th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#7775A0] uppercase tracking-wider">
                  Category & Rating
                </th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#7775A0] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-[12px] font-bold text-[#7775A0] uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E0DEF5]">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[#7775A0] text-[14px]"
                  >
                    Loading affiliate products...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[#E24B4A] text-[14px] font-semibold"
                  >
                    {error}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-[#7775A0] text-[14px]"
                  >
                    No affiliate products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const id = getProductId(product);
                  const categoryName = getCategoryName(product);

                  return (
                    <tr
                      key={id}
                      className="hover:bg-[#F7F6FF]/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg border border-[#E0DEF5] overflow-hidden shrink-0 bg-white">
                            <img
                              src={getPrimaryImage(product)}
                              alt={product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-[#1A1340] text-[14px] line-clamp-1">
                              {product.title}
                            </div>
                            <div className="text-[#7775A0] text-[12px] mt-0.5 flex items-center gap-2">
                              <span className="font-medium">
                                {product.brandName || "No brand"}
                              </span>
                              {(product.awardBadge || product.ribbonText) && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-[#E0DEF5]"></span>
                                  <span className="text-[#F4A836] font-bold">
                                    {product.awardBadge || product.ribbonText}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1A1340] text-[14px]">
                            {formatPrice(product.price, product.currency)}
                          </span>
                          {product.originalPrice && (
                            <span className="text-[#A09EC0] text-[12px] line-through">
                              {formatPrice(
                                product.originalPrice,
                                product.currency,
                              )}
                            </span>
                          )}
                          {product.discountPercentage > 0 && (
                            <span className="text-[#22B07D] text-[12px] font-bold mt-0.5">
                              {product.discountPercentage}% off
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[#1A1340] text-[13px] font-medium">
                            {categoryName}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star
                              size={12}
                              className="text-[#F4A836] fill-[#F4A836]"
                            />
                            <span className="text-[#7775A0] text-[12px] font-bold">
                              {product.rating || product.expertScore || "-"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {getStatusBadge(product.status)}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {product.slug && (
                            <Link
                              href={`/affiliate-products/${product.slug}`}
                              className="p-1.5 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded transition-colors"
                              title="View Live"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                            </Link>
                          )}

                          <Link
                            href={`/admin/affiliate-products/${id}`}
                            className="p-1.5 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </Link>

                          <button
                            onClick={() => handleDelete(product)}
                            disabled={deletingId === id}
                            className="p-1.5 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-[13px] text-[#7775A0]">
            <span>
              Page {pagination.page} of {pagination.totalPages} ·{" "}
              {pagination.total} products
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="px-4 py-2 bg-white border border-[#E0DEF5] rounded-lg font-bold disabled:opacity-50"
              >
                Previous
              </button>

              <button
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, pagination.totalPages))
                }
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 bg-white border border-[#E0DEF5] rounded-lg font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAffiliateProducts;
