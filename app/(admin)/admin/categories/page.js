"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Layers,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CornerDownRight,
  GripVertical,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  FolderTree,
  Loader2,
  RefreshCw,
  Star,
  ChevronLeft,
  ChevronRight,
  Network, // Added for module type icon
} from "lucide-react";

const API_BASE = "/api/admin/categories";

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [level, setLevel] = useState("all");
  const [isFeatured, setIsFeatured] = useState("all");
  const [type, setType] = useState("all"); // 🔥 ADDED: Module Type state
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "50");

    if (status !== "all") params.set("status", status);
    if (level !== "all") params.set("level", level);
    if (isFeatured !== "all") params.set("isFeatured", isFeatured);
    if (type !== "all") params.set("type", type); // 🔥 ADDED: Type filter to API query
    if (search.trim()) params.set("search", search.trim());

    return params.toString();
  }, [page, status, level, isFeatured, type, search]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE}?${queryString}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.details || result?.error || "Failed to fetch categories.",
        );
      }

      setCategories(result.data?.categories || []);
      setPagination(
        result.data?.pagination || {
          total: 0,
          page,
          limit: 50,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      );
    } catch (error) {
      console.error("Categories fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Categories Load Failed",
        text:
          error.message ||
          "Categories could not be loaded. Please check API/database connection.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setLoading(false);
    }
  }, [queryString, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async (category) => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete Category?",
      html: `
        <div style="text-align:left">
          <p>You are about to delete <b>${category.name}</b>.</p>
          <p style="margin-top:8px;color:#7775A0">
            If this category has children or is used by stores, coupons, blogs, Amazon deals, or affiliate products, deletion will be blocked.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#7775A0",
    });

    if (!confirmation.isConfirmed) return;

    try {
      setDeletingId(category._id);

      const response = await fetch(`${API_BASE}/${category._id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const usage = result?.usage
          ? Object.entries(result.usage)
              .filter(([, used]) => used)
              .map(([key]) => key)
              .join(", ")
          : "";

        throw new Error(
          usage
            ? `${result.error} Used in: ${usage}.`
            : result?.details || result?.error || "Failed to delete category.",
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: result.message || "Category deleted successfully.",
        confirmButtonColor: "#2D2380",
      });

      fetchCategories();
    } catch (error) {
      console.error("Category delete error:", error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message || "Category could not be deleted.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (categoryStatus) => {
    if (categoryStatus === "active") {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
          <CheckCircle size={12} /> Active
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#7775A0]/20">
        <XCircle size={12} /> Inactive
      </span>
    );
  };

  const getLevelBadge = (categoryLevel) => {
    switch (Number(categoryLevel)) {
      case 0:
        return (
          <span className="px-2 py-0.5 bg-[#1A1340] text-[#F4A836] text-[10px] font-bold uppercase tracking-wider rounded">
            Root (L0)
          </span>
        );
      case 1:
        return (
          <span className="px-2 py-0.5 bg-[#EEEDFE] text-[#2D2380] text-[10px] font-bold uppercase tracking-wider rounded">
            Child (L1)
          </span>
        );
      case 2:
        return (
          <span className="px-2 py-0.5 bg-[#F7F6FF] text-[#7775A0] border border-[#E0DEF5] text-[10px] font-bold uppercase tracking-wider rounded">
            Leaf (L2)
          </span>
        );
      default:
        return null;
    }
  };

  // 🔥 ADDED: Type Badge Generator
  const getTypeBadge = (categoryType) => {
    switch (categoryType) {
      case "store":
        return (
          <span className="px-2 py-0.5 bg-[#EEEDFE] text-[#2D2380] text-[10px] font-bold uppercase tracking-wider rounded">
            Store
          </span>
        );
      case "blog":
        return (
          <span className="px-2 py-0.5 bg-[rgba(244,168,54,0.15)] text-[#F4A836] text-[10px] font-bold uppercase tracking-wider rounded">
            Blog
          </span>
        );
      case "product":
        return (
          <span className="px-2 py-0.5 bg-[#FCEBEB] text-[#E24B4A] text-[10px] font-bold uppercase tracking-wider rounded">
            Product
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-[#F7F6FF] text-[#7775A0] border border-[#E0DEF5] text-[10px] font-bold uppercase tracking-wider rounded">
            General
          </span>
        );
    }
  };

  const hasImage = (category) =>
    Boolean(category?.image?.url || category?.uiConfig?.heroBanner?.url);

  const rootCount = categories.filter(
    (item) => Number(item.level) === 0,
  ).length;
  const subCount = categories.filter((item) => Number(item.level) > 0).length;

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <FolderTree
                className="text-[#F4A836]"
                size={32}
                strokeWidth={2.5}
              />
              Taxonomy Categories
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage the 3-level site hierarchy for organizing stores, deals,
              and blogs.
            </p>
          </div>

          <Link
            href="/admin/categories/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Category
          </Link>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="relative w-full xl:w-[320px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search taxonomy..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] focus:ring-2 focus:ring-[#2D2380]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full xl:w-auto xl:ml-auto overflow-x-auto pb-2 xl:pb-0 [&::-webkit-scrollbar]:hidden">
            {/* 🔥 ADDED: Module Type Filter */}
            <select
              value={type}
              onChange={(event) => {
                setPage(1);
                setType(event.target.value);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Modules</option>
              <option value="general">General</option>
              <option value="store">Store</option>
              <option value="blog">Blog</option>
              <option value="product">Product</option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={level}
              onChange={(event) => {
                setPage(1);
                setLevel(event.target.value);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Levels</option>
              <option value="0">Root (L0)</option>
              <option value="1">Child (L1)</option>
              <option value="2">Leaf (L2)</option>
            </select>

            <select
              value={isFeatured}
              onChange={(event) => {
                setPage(1);
                setIsFeatured(event.target.value);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Featured</option>
              <option value="true">Featured Only</option>
              <option value="false">Non-Featured</option>
            </select>

            <button
              onClick={fetchCategories}
              disabled={loading}
              className="flex items-center gap-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[13px] transition-colors shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[35%]">Category Structure</th>
                  <th className="px-6 py-4">URL Slug</th>
                  <th className="px-6 py-4 flex items-center gap-1.5">
                    <Network size={14} /> Module Type
                  </th>
                  <th className="px-6 py-4">Hierarchy Level</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E0DEF5]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[#7775A0]">
                        <Loader2 className="animate-spin text-[#2D2380]" />
                        <p className="font-medium">Loading categories...</p>
                      </div>
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <FolderTree size={36} className="text-[#7775A0]" />
                        <p className="text-[#1A1340] font-bold">
                          No categories found
                        </p>
                        <p className="text-[#7775A0] text-sm">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category._id}
                      className={`hover:bg-[#EEEDFE]/40 transition-colors duration-150 group ${
                        category.status === "inactive" ? "opacity-70" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="cursor-grab text-[#E0DEF5] hover:text-[#2D2380] opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical size={18} />
                          </div>

                          <div
                            className="flex items-center gap-2"
                            style={{
                              paddingLeft: `${Number(category.level || 0) * 2}rem`,
                            }}
                          >
                            {Number(category.level) > 0 && (
                              <CornerDownRight
                                size={18}
                                className="text-[#E0DEF5] -mt-2 shrink-0"
                              />
                            )}

                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                Number(category.level) === 0
                                  ? "bg-[#1A1340] text-white"
                                  : "bg-[#F7F6FF] border border-[#E0DEF5] text-[#1A1340]"
                              }`}
                            >
                              {category.icon ? (
                                <span className="text-[14px]">
                                  {category.icon}
                                </span>
                              ) : (
                                <Layers size={16} />
                              )}
                            </div>

                            <div className="flex flex-col">
                              <span
                                className={`text-[15px] transition-colors ${
                                  Number(category.level) === 0
                                    ? "font-bold text-[#1A1340]"
                                    : "font-semibold text-[#2D2380]"
                                }`}
                              >
                                <Link
                                  href={`/admin/categories/${category._id}`}
                                  className="hover:underline"
                                >
                                  {category.name}
                                </Link>
                              </span>

                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                {hasImage(category) && (
                                  <span className="flex items-center gap-1 text-[#7775A0] text-[11px] font-medium">
                                    <ImageIcon size={10} /> Image
                                  </span>
                                )}

                                {category.isFeatured && (
                                  <span className="flex items-center gap-1 text-[#F4A836] text-[11px] font-bold uppercase tracking-wider">
                                    <Star size={10} fill="currentColor" />
                                    Featured
                                  </span>
                                )}

                                {category.parentId?.name && (
                                  <span className="text-[#7775A0] text-[11px]">
                                    Parent: {category.parentId.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top pt-5">
                        <span className="text-[#7775A0] font-mono text-[13px] bg-[#F7F6FF] border border-[#E0DEF5] px-2 py-0.5 rounded">
                          /{category.slug}
                        </span>
                      </td>

                      {/* 🔥 ADDED: Module Type Column */}
                      <td className="px-6 py-4 align-top pt-5">
                        {getTypeBadge(category.type || "general")}
                      </td>

                      <td className="px-6 py-4 align-top pt-5">
                        {getLevelBadge(category.level)}
                      </td>

                      <td className="px-6 py-4 align-top pt-5">
                        {getStatusBadge(category.status)}
                      </td>

                      <td className="px-6 py-4 align-top pt-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          {Number(category.level) < 2 && (
                            <Link
                              href={`/admin/categories/new?parentId=${category._id}`}
                              className="p-2 text-[#7775A0] hover:text-[#22B07D] hover:bg-[#E1F5EE] rounded-lg transition-colors"
                              title="Add Subcategory"
                            >
                              <Plus size={16} />
                            </Link>
                          )}

                          <Link
                            href={`/admin/categories/${category._id}`}
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </Link>

                          <button
                            onClick={() => handleDelete(category)}
                            disabled={deletingId === category._id}
                            className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === category._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>

                          <button
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                            title="More Options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-[#7775A0] text-[13px] font-medium flex flex-wrap items-center gap-2">
              <span>
                Showing <strong className="text-[#1A1340]">{startItem}</strong>{" "}
                to <strong className="text-[#1A1340]">{endItem}</strong> of{" "}
                <strong className="text-[#1A1340]">{pagination.total}</strong>
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1A1340] ml-2" />
              Root: {rootCount}
              <span className="w-2 h-2 rounded-full bg-[#2D2380] ml-2" />
              Subcategories: {subCount}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!pagination.hasPrevPage || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] disabled:opacity-40 disabled:hover:border-[#E0DEF5] disabled:hover:text-[#7775A0]"
              >
                <ChevronLeft size={16} />
                Prev
              </button>

              <span className="px-3 py-2 text-sm font-bold text-[#1A1340]">
                Page {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages || 1, current + 1),
                  )
                }
                disabled={!pagination.hasNextPage || loading}
                className="flex items-center gap-1 px-3 py-2 rounded-lg border border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] disabled:opacity-40 disabled:hover:border-[#E0DEF5] disabled:hover:text-[#7775A0]"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
