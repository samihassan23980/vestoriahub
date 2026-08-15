"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  FileText,
  Search,
  Plus,
  Filter,
  Edit,
  Trash2,
  Eye,
  Clock,
  Calendar,
  CheckCircle,
  FileEdit,
  TrendingUp,
  Loader2,
  AlertCircle,
} from "lucide-react";

// --- Helper to extract array safely based on API response structures ---
const getArrayFromApi = (data, key) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data?.data && Array.isArray(data.data[key])) return data.data[key];
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function BlogManagementPage() {
  // ─── STATES ─────────────────────────────────────────────────────────────
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // ─── DEBOUNCE SEARCH ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ─── FETCH CATEGORIES ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/admin/categories");
        const json = await res.json();
        setCategories(getArrayFromApi(json, "categories"));
      } catch (error) {
        console.error("Failed to load categories", error);
      }
    };
    fetchCategories();
  }, []);

  // ─── FETCH BLOGS ────────────────────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query string dynamically
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedStatus) params.append("status", selectedStatus);

      const res = await fetch(`/api/admin/blogs?${params.toString()}`);
      const json = await res.json();

      if (res.ok) {
        // Handle both standard formats: { data: [...] } or { blogs: [...] }
        const fetchedBlogs = json.data || json.blogs || [];
        setBlogs(fetchedBlogs);

        // Update pagination if provided by backend
        if (json.pagination) {
          setPagination(json.pagination);
        } else if (json.total) {
          setPagination((prev) => ({
            ...prev,
            total: json.total,
            totalPages: json.totalPages || Math.ceil(json.total / prev.limit),
          }));
        }
      } else {
        throw new Error(json.error || "Failed to fetch blogs");
      }
    } catch (error) {
      console.error("Fetch Blogs Error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to load blogs",
        text: error.message,
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    selectedCategory,
    selectedStatus,
  ]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  // ─── DELETE HANDLER ─────────────────────────────────────────────────────
  const handleDelete = async (id, title, slug) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      html: `You are about to delete <strong>"${title}"</strong>.<br/>This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E24B4A", // Alert Red
      cancelButtonColor: "#7775A0", // Muted Slate
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    setIsDeleting(true);
    try {
      // Pass the ID to the API instead of the slug
      const res = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete blog post.");
      }

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The blog post has been deleted.",
        timer: 2000,
        showConfirmButton: false,
      });

      // Refresh the list
      fetchBlogs();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message,
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── HELPERS ────────────────────────────────────────────────────────────
  const getStatusBadge = (status) => {
    if (status === "published") {
      return (
        <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
          <CheckCircle size={12} /> Published
        </span>
      );
    }
    return (
      <span className="flex items-center w-fit gap-1.5 px-2.5 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#7775A0]/20">
        <FileEdit size={12} /> Draft
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* ─── PAGE HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <FileText
                className="text-[#F4A836]"
                size={32}
                strokeWidth={2.5}
              />
              Blog Editor
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Create SEO-optimized buying guides and articles to drive traffic.
            </p>
          </div>

          <Link
            href="/admin/blogs/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out"
          >
            <Plus size={18} strokeWidth={2.5} /> Write New Post
          </Link>
        </div>

        {/* ─── TOOLBAR (SEARCH & FILTERS) ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-[400px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles by title or content..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:ml-auto">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-white border border-[#E0DEF5] text-[14px] font-semibold py-2 px-4 rounded-lg outline-none flex-grow md:flex-grow-0"
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="bg-white border border-[#E0DEF5] text-[14px] font-semibold py-2 px-4 rounded-lg outline-none flex-grow md:flex-grow-0"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={fetchBlogs}
              className="p-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340]"
              title="Refresh"
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* ─── BLOG LIST TABLE ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-hidden relative">
          {/* Deleting Overlay */}
          {isDeleting && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-[#2D2380]" size={40} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[40%]">Article Detail</th>
                  <th className="px-6 py-4">Status & Date</th>
                  <th className="px-6 py-4">Author</th>
                  <th className="px-6 py-4">Engagement</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0DEF5]">
                {isLoading ? (
                  // Skeleton Rows
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="flex gap-4">
                          <div className="w-20 h-14 bg-gray-200 rounded-lg"></div>
                          <div className="space-y-2">
                            <div className="w-48 h-4 bg-gray-200 rounded"></div>
                            <div className="w-24 h-3 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="w-20 h-5 bg-gray-200 rounded"></div>
                          <div className="w-24 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex gap-2">
                          <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                          <div className="w-20 h-4 bg-gray-200 rounded mt-1"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-2">
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                          <div className="w-20 h-3 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : blogs.length === 0 ? (
                  // Empty State
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <AlertCircle
                        className="mx-auto text-[#7775A0] mb-3"
                        size={32}
                      />
                      <p className="text-[16px] font-bold text-[#1A1340]">
                        No articles found
                      </p>
                      <p className="text-[14px] text-[#7775A0]">
                        Try adjusting your search or filters, or create a new
                        post.
                      </p>
                    </td>
                  </tr>
                ) : (
                  // Real Data Rows
                  blogs.map((post) => (
                    <tr
                      key={post._id}
                      className="hover:bg-[#EEEDFE]/30 transition-colors group"
                    >
                      {/* Title & Preview */}
                      <td className="px-6 py-5">
                        <div className="flex items-start gap-4">
                          <div className="w-20 h-14 rounded-lg overflow-hidden bg-[#F7F6FF] border border-[#E0DEF5] shrink-0">
                            <img
                              src={
                                post.featuredImage?.url || "/fallback-blog.jpg"
                              }
                              alt={post.featuredImage?.alt || post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/blogs/${post.slug}`}
                              className="text-[#1A1340] font-bold text-[15px] hover:text-[#2D2380] line-clamp-1"
                            >
                              {post.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-[#EEEDFE] text-[#2D2380]">
                                {post.category?.name || "Uncategorized"}
                              </span>
                              <span className="flex items-center gap-1 text-[#7775A0] text-[11px] font-medium">
                                <Clock size={12} /> {post.readTimeMinutes || 1}{" "}
                                min read
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Date */}
                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          {getStatusBadge(post.status)}
                          <div className="flex items-center gap-1.5 text-[#7775A0] text-[12px]">
                            <Calendar size={13} />
                            {post.publishedAt
                              ? new Date(post.publishedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )
                              : "Not Scheduled"}
                          </div>
                        </div>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          {post.author?.avatar ? (
                            <img
                              src={post.author.avatar}
                              alt="Author"
                              className="w-7 h-7 rounded-full object-cover border border-[#E0DEF5]"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#2D2380] flex items-center justify-center text-white text-[10px] font-bold">
                              {(post.author?.name || "S")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                          <span className="text-[#1A1340] font-semibold text-[13px]">
                            {post.author?.name || "Sociantech Team"}
                          </span>
                        </div>
                      </td>

                      {/* Engagement Stats */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[#1A1340] font-bold text-[14px]">
                            <TrendingUp size={14} className="text-[#22B07D]" />
                            {(post.viewCount || 0).toLocaleString()}
                          </div>
                          <span className="text-[#7775A0] text-[11px] uppercase font-bold tracking-tight">
                            Total Views
                          </span>
                        </div>
                      </td>

                      {/* Quick Actions */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {post.status === "published" && (
                            <a
                              href={`/blogs/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-[#7775A0] hover:text-[#22B07D] hover:bg-[#E1F5EE] rounded-lg transition-colors"
                              title="View Live"
                            >
                              <Eye size={18} />
                            </a>
                          )}
                          <Link
                            href={`/admin/blogs/${post.slug}`}
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(post._id, post.title, post.slug)
                            } // Pass post._id here!
                            className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {!isLoading && blogs.length > 0 && (
            <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[13px] text-[#7775A0] font-medium">
                Showing{" "}
                <strong className="text-[#1A1340]">
                  {(pagination.page - 1) * pagination.limit + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-[#1A1340]">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </strong>{" "}
                of{" "}
                <strong className="text-[#1A1340]">{pagination.total}</strong>{" "}
                Articles
              </p>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className="px-4 py-1.5 border border-[#E0DEF5] rounded-md text-[13px] font-bold text-[#7775A0] hover:bg-[#F7F6FF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className="px-4 py-1.5 bg-[#2D2380] border border-[#2D2380] rounded-md text-[13px] font-bold text-white shadow-sm hover:bg-[#4A3DBF] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
