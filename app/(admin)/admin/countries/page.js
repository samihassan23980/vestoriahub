"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Globe,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE = "/api/admin/countries";

const CountriesPage = () => {
  const [countries, setCountries] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isPopular, setIsPopular] = useState("all");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", "20");

    if (status !== "all") params.set("status", status);
    if (isPopular !== "all") params.set("isPopular", isPopular);
    if (search.trim()) params.set("search", search.trim());

    return params.toString();
  }, [page, status, isPopular, search]);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}?${queryString}`, {
        method: "GET",
        cache: "no-store",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(
          result?.details || result?.error || "Failed to fetch countries.",
        );
      }

      setCountries(result.data?.countries || []);
      setPagination(
        result.data?.pagination || {
          total: 0,
          page,
          limit: 20,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      );
    } catch (error) {
      console.error("Countries fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Countries Load Failed",
        text:
          error.message ||
          "Countries could not be loaded. Please check API/database connection.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setLoading(false);
    }
  }, [queryString, page]);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleStatusChange = (value) => {
    setPage(1);
    setStatus(value);
  };

  const handlePopularChange = (value) => {
    setPage(1);
    setIsPopular(value);
  };

  const handleDelete = async (country) => {
    const confirmation = await Swal.fire({
      icon: "warning",
      title: "Delete Country?",
      html: `
        <div style="text-align:left">
          <p>You are about to delete <b>${country.name}</b> (${country.code}).</p>
          <p style="margin-top:8px;color:#7775A0">
            If this country is used by stores, coupons, Amazon deals, or hero slides, the API will block deletion.
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
      setDeletingId(country._id);

      const res = await fetch(`${API_BASE}/${country._id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        const usage = result?.usage
          ? Object.entries(result.usage)
              .filter(([, used]) => used)
              .map(([key]) => key)
              .join(", ")
          : "";

        throw new Error(
          usage
            ? `${result.error} Used in: ${usage}.`
            : result?.details || result?.error || "Failed to delete country.",
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: result.message || "Country deleted successfully.",
        confirmButtonColor: "#2D2380",
      });

      fetchCountries();
    } catch (error) {
      console.error("Country delete error:", error);

      Swal.fire({
        icon: "error",
        title: "Delete Failed",
        text: error.message || "Country could not be deleted.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (countryStatus) => {
    if (countryStatus === "active") {
      return (
        <span className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
          <CheckCircle size={12} /> Active
        </span>
      );
    }

    return (
      <span className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#7775A0]/20">
        <XCircle size={12} /> Inactive
      </span>
    );
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <Globe className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Countries & Geo-Targeting
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage regions, currencies, and local timezones for platform
              targeting.
            </p>
          </div>

          <Link
            href="/admin/countries/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out"
          >
            <Plus size={18} strokeWidth={2.5} />
            Add Country
          </Link>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-[400px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by country name, ISO code, currency..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] focus:ring-2 focus:ring-[#2D2380]/10 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto ml-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            <select
              value={isPopular}
              onChange={(event) => handlePopularChange(event.target.value)}
              className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Rankings</option>
              <option value="true">Popular Only</option>
              <option value="false">Non-Popular Only</option>
            </select>

            <button
              onClick={fetchCountries}
              disabled={loading}
              className="flex items-center gap-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shrink-0 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCw size={18} />
              )}
              Refresh
            </button>

            <button className="flex items-center gap-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] px-4 py-2.5 rounded-lg font-semibold text-[14px] shrink-0">
              <Filter size={18} />
              Filter
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[30%]">Country & ISO Code</th>
                  <th className="px-6 py-4">Currency</th>
                  <th className="px-6 py-4">Timezone</th>
                  <th className="px-6 py-4 text-center">Status & Priority</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E0DEF5]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-[#7775A0]">
                        <Loader2 className="animate-spin text-[#2D2380]" />
                        <p className="font-medium">Loading countries...</p>
                      </div>
                    </td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Globe size={36} className="text-[#7775A0]" />
                        <p className="text-[#1A1340] font-bold">
                          No countries found
                        </p>
                        <p className="text-[#7775A0] text-sm">
                          Try changing your search or filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  countries.map((country) => (
                    <tr
                      key={country._id}
                      className={`hover:bg-[#EEEDFE]/40 transition-colors duration-150 group ${
                        country.status === "inactive" ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#F7F6FF] border border-[#E0DEF5] flex items-center justify-center text-[20px] shadow-sm shrink-0">
                            {country.flag || "🌐"}
                          </div>
                          <div className="flex flex-col">
                            <p className="text-[#1A1340] font-bold text-[15px] hover:text-[#2D2380] transition-colors">
                              <Link href={`/admin/countries/${country._id}`}>
                                {country.name}
                              </Link>
                            </p>
                            <span className="mt-1 w-fit font-mono text-[11px] font-bold bg-[#EEEDFE] text-[#2D2380] px-2 py-0.5 rounded uppercase tracking-widest border border-[#E0DEF5]">
                              {country.code}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-2 pt-1">
                          <div className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                            <DollarSign size={14} className="text-[#7775A0]" />
                            {country.currencyCode || "USD"}{" "}
                            <span className="text-[#7775A0]">
                              ({country.currencySymbol || "$"})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top pt-5">
                        <div className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                          <Clock size={14} className="text-[#2D2380]" />
                          {country.timezone || "UTC"}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top pt-4">
                        <div className="flex flex-col items-center gap-2">
                          {getStatusBadge(country.status)}

                          {country.isPopular && (
                            <span
                              className="flex items-center gap-1 text-[#F4A836] text-[11px] font-bold uppercase tracking-wider"
                              title="Shown at top of dropdowns"
                            >
                              <Star size={12} fill="currentColor" /> Popular
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top pt-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/countries/${country._id}`}
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                            title="Edit Country"
                          >
                            <Edit size={16} />
                          </Link>

                          <button
                            onClick={() => handleDelete(country)}
                            disabled={deletingId === country._id}
                            className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Country"
                          >
                            {deletingId === country._id ? (
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
            <span className="text-[#7775A0] text-[13px] font-medium">
              Showing <strong className="text-[#1A1340]">{startItem}</strong> to{" "}
              <strong className="text-[#1A1340]">{endItem}</strong> of{" "}
              <strong className="text-[#1A1340]">{pagination.total}</strong>{" "}
              Countries
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

export default CountriesPage;
