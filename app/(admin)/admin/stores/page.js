/* /app/(admin)/admin/stores/page.js */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Store,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  ExternalLink,
  Star,
  Layers,
  Network,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const LIMIT = 10;

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const readPath = (object, path) => {
  return path.split(".").reduce((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return acc[key];
  }, object);
};

const extractArrayFromPayload = (payload, preferredPaths = []) => {
  if (Array.isArray(payload)) return payload;

  for (const path of preferredPaths) {
    const value = readPath(payload, path);

    if (Array.isArray(value)) {
      return value;
    }
  }

  const queue = [payload];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || typeof current !== "object" || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        return value;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return [];
};

const getRefId = (item) => {
  return String(item?._id || item?.id || item?.value || item?.key || "");
};

const normalizeReferenceItem = (item, fallbackName = "Unnamed") => {
  if (!item || typeof item !== "object") return null;

  const id = getRefId(item);

  if (!id) return null;

  return {
    _id: id,
    name:
      item.name ||
      item.title ||
      item.label ||
      item.displayName ||
      item.code ||
      fallbackName,
    slug: item.slug || "",
    code: item.code || "",
    status: item.status || "",
  };
};

const normalizeReferenceList = (payload, paths, fallbackName) => {
  return extractArrayFromPayload(payload, paths)
    .map((item) => normalizeReferenceItem(item, fallbackName))
    .filter(Boolean);
};

const safeHostname = (url) => {
  if (!url) return "";

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const formatCountryName = (country) => {
  if (!country) return "Unknown Country";

  if (country.name && country.code) {
    return `${country.name} (${country.code})`;
  }

  return country.name || country.code || "Unknown Country";
};

const getPrimaryCategoryName = (store) => {
  return (
    store?.primaryCategoryId?.name ||
    store?.primaryCategory?.name ||
    store?.category?.name ||
    "Uncategorized"
  );
};

const getNetworkName = (store) => {
  return (
    store?.affiliateNetworkId?.name ||
    store?.affiliateNetwork?.name ||
    store?.network?.name ||
    "Direct"
  );
};

const getCountryLabel = (store) => {
  const code = store?.countryId?.code || store?.countryCode || "GLOBAL";

  if (!code || code === "GLOBAL") {
    return "Global";
  }

  return code;
};

const getLogoUrl = (store) => {
  return store?.images?.logo?.url || "";
};

const StoresPage = () => {
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [networks, setNetworks] = useState([]);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [countryId, setCountryId] = useState("");
  const [networkId, setNetworkId] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isReferenceLoading, setIsReferenceLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [notice, setNotice] = useState(null);
  const [referenceError, setReferenceError] = useState("");

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      search ||
      categoryId ||
      countryId ||
      networkId ||
      activeFilter !== "all" ||
      featuredFilter !== "all",
    );
  }, [search, categoryId, countryId, networkId, activeFilter, featuredFilter]);

  const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem =
    total === 0 ? 0 : Math.min(total, startItem + stores.length - 1);

  const fetchReferenceData = useCallback(async () => {
    setIsReferenceLoading(true);
    setReferenceError("");

    const fetchReference = async (url) => {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || `Failed to fetch ${url}`,
        );
      }

      return payload;
    };

    const [categoryResult, countryResult, networkResult] =
      await Promise.allSettled([
        fetchReference("/api/admin/categories?limit=100"),
        fetchReference("/api/admin/countries?limit=250"),
        fetchReference("/api/admin/affiliate-networks?limit=100"),
      ]);

    const failed = [];

    if (categoryResult.status === "fulfilled") {
      const normalizedCategories = normalizeReferenceList(
        categoryResult.value,
        [
          "categories",
          "categoryList",
          "data.categories",
          "data.categoryList",
          "data.items",
          "data.results",
          "items",
          "results",
          "docs",
        ],
        "Unnamed Category",
      );

      setCategories(normalizedCategories);
    } else {
      console.error("Categories fetch failed:", categoryResult.reason);
      failed.push("categories");
    }

    if (countryResult.status === "fulfilled") {
      const normalizedCountries = normalizeReferenceList(
        countryResult.value,
        [
          "countries",
          "countryList",
          "data.countries",
          "data.countryList",
          "data.items",
          "data.results",
          "items",
          "results",
          "docs",
        ],
        "Unnamed Country",
      );

      setCountries(normalizedCountries);
    } else {
      console.error("Countries fetch failed:", countryResult.reason);
      failed.push("countries");
    }

    if (networkResult.status === "fulfilled") {
      const normalizedNetworks = normalizeReferenceList(
        networkResult.value,
        [
          "networks",
          "affiliateNetworks",
          "affiliateNetworkList",
          "data.networks",
          "data.affiliateNetworks",
          "data.affiliateNetworkList",
          "data.items",
          "data.results",
          "items",
          "results",
          "docs",
        ],
        "Unnamed Network",
      );

      setNetworks(normalizedNetworks);
    } else {
      console.error("Affiliate networks fetch failed:", networkResult.reason);
      failed.push("affiliate networks");
    }

    if (failed.length > 0) {
      setReferenceError(`Could not load ${failed.join(", ")}.`);
    }

    setIsReferenceLoading(false);
  }, []);

  const fetchStores = useCallback(
    async (signal) => {
      setNotice(null);

      if (stores.length === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const params = new URLSearchParams();

        params.set("page", String(page));
        params.set("limit", String(LIMIT));

        if (search) {
          params.set("search", search);
        }

        if (categoryId) {
          params.set("primaryCategoryId", categoryId);
        }

        if (countryId) {
          params.set("countryId", countryId);
        }

        if (networkId) {
          params.set("affiliateNetworkId", networkId);
        }

        if (activeFilter !== "all") {
          params.set("isActive", activeFilter);
        }

        if (featuredFilter !== "all") {
          params.set("isFeatured", featuredFilter);
        }

        const response = await fetch(`/api/admin/stores?${params.toString()}`, {
          method: "GET",
          cache: "no-store",
          signal,
        });

        const payload = await safeJson(response);

        if (!response.ok) {
          throw new Error(
            payload?.error || payload?.message || "Failed to fetch stores.",
          );
        }

        const list = extractArrayFromPayload(payload, [
          "stores",
          "data.stores",
          "data.items",
          "data.results",
          "items",
          "results",
          "docs",
        ])
          .map((store) => ({
            ...store,
            _id: getRefId(store),
          }))
          .filter((store) => store._id);

        const pagination =
          payload?.pagination ||
          payload?.data?.pagination ||
          payload?.meta?.pagination ||
          {};

        const nextTotal = Number(
          pagination.total ??
            payload.total ??
            payload.totalCount ??
            payload.count ??
            list.length,
        );

        const nextTotalPages = Number(
          pagination.totalPages ??
            payload.totalPages ??
            Math.max(
              1,
              Math.ceil((Number.isFinite(nextTotal) ? nextTotal : 0) / LIMIT),
            ),
        );

        setStores(list);
        setTotal(Number.isFinite(nextTotal) ? nextTotal : list.length);
        setTotalPages(
          Number.isFinite(nextTotalPages) && nextTotalPages > 0
            ? nextTotalPages
            : 1,
        );
      } catch (error) {
        if (error?.name === "AbortError") return;

        console.error("Stores fetch failed:", error);

        setNotice({
          type: "error",
          message: error.message || "Failed to fetch stores.",
        });

        setStores([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      page,
      search,
      categoryId,
      countryId,
      networkId,
      activeFilter,
      featuredFilter,
      stores.length,
    ],
  );

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchDraft.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchDraft]);

  useEffect(() => {
    const controller = new AbortController();

    fetchStores(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchStores]);

  const resetFilters = () => {
    setSearchDraft("");
    setSearch("");
    setCategoryId("");
    setCountryId("");
    setNetworkId("");
    setActiveFilter("all");
    setFeaturedFilter("all");
    setPage(1);
  };

  const handleDelete = async (store) => {
    const storeId = getRefId(store);

    if (!storeId) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${store.name}"? If this store has coupons, the API may block deletion.`,
    );

    if (!confirmed) return;

    setDeletingId(storeId);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "DELETE",
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Failed to delete store.",
        );
      }

      setNotice({
        type: "success",
        message: payload?.message || "Store deleted successfully.",
      });

      if (stores.length === 1 && page > 1) {
        setPage((prev) => Math.max(1, prev - 1));
      } else {
        await fetchStores();
      }
    } catch (error) {
      console.error("Store delete failed:", error);

      setNotice({
        type: "error",
        message: error.message || "Failed to delete store.",
      });
    } finally {
      setDeletingId("");
    }
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="px-2.5 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
          Active
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#7775A0]/20">
        Inactive
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
              <Store className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Brands & Stores
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage retail partners, affiliate tracking setups, and brand SEO
              pages.
            </p>
          </div>

          <Link
            href="/admin/stores/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add New Store
          </Link>
        </div>

        {notice && (
          <div
            className={`flex items-start gap-3 rounded-xl border p-4 text-[14px] font-medium ${
              notice.type === "success"
                ? "bg-[#22B07D]/10 border-[#22B07D]/25 text-[#167A57]"
                : "bg-[#E24B4A]/10 border-[#E24B4A]/25 text-[#B63837]"
            }`}
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{notice.message}</span>
          </div>
        )}

        {referenceError && (
          <div className="flex items-start gap-3 rounded-xl border border-[#F4A836]/30 bg-[#F4A836]/10 p-4 text-[14px] font-medium text-[#BA7517]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{referenceError}</span>
          </div>
        )}

        {/* ─── TOOLBAR (Search & Filters) ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-[400px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search stores by name or domain..."
              value={searchDraft}
              onChange={(e) => {
                setSearchDraft(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] focus:ring-2 focus:ring-[#2D2380]/10 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto ml-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="">
                {isReferenceLoading
                  ? "Loading Categories..."
                  : "All Categories"}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={countryId}
              onChange={(e) => {
                setCountryId(e.target.value);
                setPage(1);
              }}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="">
                {isReferenceLoading
                  ? "Loading Countries..."
                  : "Global & All Countries"}
              </option>
              {countries.map((country) => (
                <option key={country._id} value={country._id}>
                  {formatCountryName(country)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowMoreFilters((prev) => !prev)}
              className="flex items-center gap-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shrink-0"
            >
              <Filter size={18} />
              More
            </button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center gap-3">
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>

            <select
              value={featuredFilter}
              onChange={(e) => {
                setFeaturedFilter(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Featured</option>
              <option value="true">Featured Only</option>
              <option value="false">Not Featured</option>
            </select>

            <select
              value={networkId}
              onChange={(e) => {
                setNetworkId(e.target.value);
                setPage(1);
              }}
              className="w-full md:w-auto bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="">
                {isReferenceLoading ? "Loading Networks..." : "All Networks"}
              </option>
              {networks.map((network) => (
                <option key={network._id} value={network._id}>
                  {network.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className={`w-full md:w-auto flex items-center justify-center gap-2 border-[1.5px] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors ${
                hasActiveFilters
                  ? "bg-[#F7F6FF] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF]"
                  : "bg-[#F7F6FF] border-[#E0DEF5] text-[#C1BFD9] cursor-not-allowed"
              }`}
            >
              <RefreshCw size={16} />
              Reset
            </button>
          </div>
        )}

        {/* ─── DATA TABLE ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[35%]">Brand / Store</th>
                  <th className="px-6 py-4">Taxonomy</th>
                  <th className="px-6 py-4">Geo & Network</th>
                  <th className="px-6 py-4">Status & Stats</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E0DEF5]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-[#7775A0] font-semibold">
                        <Loader2 size={18} className="animate-spin" />
                        Loading stores...
                      </div>
                    </td>
                  </tr>
                ) : stores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-[#7775A0] font-semibold">
                        No stores found.
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 text-[#2D2380] hover:text-[#FF6B35] text-[13px] font-bold transition-colors"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  stores.map((store) => {
                    const storeId = getRefId(store);
                    const logoUrl = getLogoUrl(store);

                    return (
                      <tr
                        key={storeId}
                        className="hover:bg-[#EEEDFE]/40 transition-colors duration-150 group"
                      >
                        {/* Brand / Store Name & Logo */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            {/* Store Logo Thumbnail */}
                            <div className="w-12 h-12 rounded-full bg-white border border-[#E0DEF5] p-1 flex-shrink-0 shadow-sm flex items-center justify-center overflow-hidden">
                              {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={logoUrl}
                                  alt={store?.images?.logo?.alt || store.name}
                                  className="w-full h-full object-contain rounded-full"
                                />
                              ) : (
                                <Store size={20} className="text-[#E0DEF5]" />
                              )}
                            </div>

                            <div>
                              <p className="text-[#1A1340] font-bold text-[15px] leading-snug hover:text-[#2D2380] transition-colors">
                                <Link href={`/admin/stores/${storeId}`}>
                                  {store.name || "Untitled Store"}
                                </Link>
                              </p>

                              {store.officialUrl ? (
                                <a
                                  href={store.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 mt-1 text-[#7775A0] hover:text-[#FF6B35] text-[12px] transition-colors"
                                >
                                  {safeHostname(store.officialUrl)}
                                  <ExternalLink size={10} />
                                </a>
                              ) : (
                                <span className="block mt-1 text-[#7775A0] text-[12px]">
                                  No official URL
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Taxonomy (Categories) */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-2 pt-1">
                            <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                              <Layers size={14} className="text-[#2D2380]" />
                              {getPrimaryCategoryName(store)}
                            </span>
                            <span className="text-[#7775A0] text-[12px]">
                              /{store.slug || "no-slug"}
                            </span>
                          </div>
                        </td>

                        {/* Geo & Affiliate Network */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-2 pt-1">
                            <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                              <Globe size={14} className="text-[#7775A0]" />
                              {getCountryLabel(store)}
                            </span>
                            <span className="flex items-center gap-1.5 text-[#7775A0] text-[13px]">
                              <Network size={14} />
                              {getNetworkName(store)}
                            </span>
                          </div>
                        </td>

                        {/* Status & Stats */}
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col items-start gap-2 pt-1">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(store.isActive)}
                              {store.isFeatured && (
                                <span
                                  className="flex items-center gap-1 px-2.5 py-1 bg-[#F4A836]/15 text-[#BA7517] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#F4A836]/30"
                                  title="Featured Store"
                                >
                                  <Star size={12} fill="currentColor" />{" "}
                                  Featured
                                </span>
                              )}
                            </div>
                            <span className="text-[#7775A0] text-[12px] font-medium mt-1">
                              {store.couponsCount ??
                                store.activeCouponsCount ??
                                0}{" "}
                              active offers
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 align-top text-right pt-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/stores/${storeId}`}
                              className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                              title="Edit Store"
                            >
                              <Edit size={16} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(store)}
                              disabled={deletingId === storeId}
                              className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Store"
                            >
                              {deletingId === storeId ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>

                            <Link
                              href={store.slug ? `/store/${store.slug}` : "#"}
                              target={store.slug ? "_blank" : undefined}
                              className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                              title="View Public Store Page"
                            >
                              <MoreVertical size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION ─── */}
          <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-[#7775A0] text-[13px] font-medium">
              Showing <strong className="text-[#1A1340]">{startItem}</strong> to{" "}
              <strong className="text-[#1A1340]">{endItem}</strong> of{" "}
              <strong className="text-[#1A1340]">{total}</strong> Stores
              {isRefreshing && (
                <span className="inline-flex items-center gap-1 ml-3 text-[#2D2380]">
                  <Loader2 size={12} className="animate-spin" />
                  Refreshing
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || isLoading}
                className={`px-4 py-2 rounded-lg border border-[#E0DEF5] text-[13px] font-bold transition-colors ${
                  page <= 1 || isLoading
                    ? "text-[#C1BFD9] cursor-not-allowed bg-[#F7F6FF]"
                    : "text-[#7775A0] hover:text-[#2D2380] hover:bg-[#F7F6FF]"
                }`}
              >
                Previous
              </button>

              <span className="text-[#7775A0] text-[13px] font-semibold px-2">
                Page <strong className="text-[#1A1340]">{page}</strong> of{" "}
                <strong className="text-[#1A1340]">{totalPages}</strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={page >= totalPages || isLoading}
                className={`px-4 py-2 rounded-lg border border-[#E0DEF5] text-[13px] font-bold transition-colors ${
                  page >= totalPages || isLoading
                    ? "text-[#C1BFD9] cursor-not-allowed bg-[#F7F6FF]"
                    : "text-[#7775A0] hover:text-[#2D2380] hover:bg-[#F7F6FF]"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoresPage;
