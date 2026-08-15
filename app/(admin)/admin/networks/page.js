/* app/admin/networks/page.jsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  Network,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Link as LinkIcon,
  Percent,
  Clock,
  DollarSign,
  UserCircle,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const COLORS = {
  ink: "#1A1340",
  indigo: "#2D2380",
  violet: "#4A3DBF",
  gold: "#F4A836",
  coral: "#FF6B35",
  mist: "#F7F6FF",
  lilac: "#EEEDFE",
  iris: "#E0DEF5",
  slate: "#7775A0",
  success: "#22B07D",
  error: "#E24B4A",
};

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Setup" },
  { value: "inactive", label: "Inactive" },
];

function getArrayFromApi(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.networks)) return payload.data.networks;
  if (Array.isArray(payload?.networks)) return payload.networks;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getPaginationFromApi(payload, fallback = {}) {
  return (
    payload?.data?.pagination ||
    payload?.pagination || {
      total: Number(payload?.total || fallback.total || 0),
      page: Number(payload?.page || fallback.page || 1),
      limit: Number(payload?.limit || fallback.limit || 20),
      totalPages: Number(payload?.totalPages || fallback.totalPages || 1),
      hasNextPage: Boolean(payload?.hasNextPage),
      hasPrevPage: Boolean(payload?.hasPrevPage),
    }
  );
}

async function getApiErrorMessage(res, fallback = "Something went wrong.") {
  try {
    const data = await res.json();

    if (Array.isArray(data?.details)) {
      return data.details
        .map((item) => item?.message || item)
        .filter(Boolean)
        .join("\n");
    }

    return data?.error || data?.message || data?.details || fallback;
  } catch {
    return fallback;
  }
}

function buildQueryParams({ page, limit, status, search }) {
  const params = new URLSearchParams();

  params.set("page", String(page || 1));
  params.set("limit", String(limit || 20));

  if (status && status !== "all") params.set("status", status);
  if (search?.trim()) params.set("search", search.trim());

  return params.toString();
}

function getStatusBadge(status) {
  switch (status) {
    case "active":
      return (
        <span className="flex items-center gap-1.5 rounded-md border border-[#22B07D]/20 bg-[#22B07D]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#22B07D]">
          <CheckCircle size={12} /> Active
        </span>
      );

    case "pending":
      return (
        <span className="flex items-center gap-1.5 rounded-md border border-[#F4A836]/30 bg-[#F4A836]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#BA7517]">
          <AlertCircle size={12} /> Pending
        </span>
      );

    case "inactive":
      return (
        <span className="flex items-center gap-1.5 rounded-md border border-[#7775A0]/20 bg-[#7775A0]/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7775A0]">
          Inactive
        </span>
      );

    default:
      return (
        <span className="flex items-center gap-1.5 rounded-md border border-[#7775A0]/20 bg-[#7775A0]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7775A0]">
          Unknown
        </span>
      );
  }
}

function formatTrackingParams(params = "") {
  if (!params) {
    return (
      <span className="text-[12px] italic text-[#7775A0]">
        No tracking template set
      </span>
    );
  }

  const parts = String(params).split(/(\{.*?\})/g);

  return (
    <span className="break-all font-mono text-[12px]">
      {parts.map((part, i) =>
        part.startsWith("{") && part.endsWith("}") ? (
          <span
            key={`${part}-${i}`}
            className="mx-0.5 rounded bg-[#F4A836]/10 px-1 font-bold text-[#F4A836]"
          >
            {part}
          </span>
        ) : (
          <span key={`${part}-${i}`} className="text-[#2D2380]">
            {part}
          </span>
        ),
      )}
    </span>
  );
}

export default function AffiliateNetworksPage() {
  const [networks, setNetworks] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  const fetchNetworks = async () => {
    setLoading(true);

    try {
      const query = buildQueryParams({
        page,
        limit,
        status,
        search,
      });

      const res = await fetch(`/api/admin/affiliate-networks?${query}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to fetch affiliate networks.",
        );
      }

      setNetworks(getArrayFromApi(data));
      setPagination(
        getPaginationFromApi(data, {
          page,
          limit,
          total: 0,
          totalPages: 1,
        }),
      );
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Could not load networks",
        text: error?.message || "Please try again.",
        confirmButtonColor: COLORS.error,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleStatusChange = (e) => {
    setPage(1);
    setStatus(e.target.value);
  };

  const handleDelete = async (network) => {
    if (!network?._id) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete affiliate network?",
      html: `
        <div style="text-align:left">
          <p>This will permanently delete <strong>${network.name}</strong>.</p>
          <p style="margin-top:8px;font-size:13px;color:#7775A0">
            If this network is assigned to any store, the API will block deletion.
          </p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: COLORS.error,
      cancelButtonColor: COLORS.slate,
    });

    if (!result.isConfirmed) return;

    setDeletingId(network._id);

    try {
      const res = await fetch(`/api/admin/affiliate-networks/${network._id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, "Failed to delete network.");
        throw new Error(msg);
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Affiliate network deleted successfully.",
        confirmButtonColor: COLORS.violet,
      });

      await fetchNetworks();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error?.message || "Could not delete affiliate network.",
        confirmButtonColor: COLORS.error,
      });
    } finally {
      setDeletingId("");
    }
  };

  const visibleFrom = useMemo(() => {
    if (!pagination.total) return 0;
    return (pagination.page - 1) * pagination.limit + 1;
  }, [pagination]);

  const visibleTo = useMemo(() => {
    return Math.min(pagination.page * pagination.limit, pagination.total || 0);
  }, [pagination]);

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-[32px] font-bold leading-tight text-[#1A1340]">
              <Network className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Affiliate Networks
            </h1>
            <p className="mt-1 text-[16px] text-[#7775A0]">
              Manage partner networks, tracking templates, and commission terms.
            </p>
          </div>

          <Link
            href="/admin/networks/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-3 text-[15px] font-bold text-white shadow-sm transition-colors duration-150 ease-out hover:bg-[#e05520]"
          >
            <Plus size={18} strokeWidth={2.5} />
            Connect Network
          </Link>
        </div>

        <div className="flex flex-col items-center gap-4 rounded-xl border border-[#E0DEF5] bg-white p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] md:flex-row">
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full md:w-[400px]"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search networks, owners, contacts..."
              className="w-full rounded-lg border-[1.5px] border-[#E0DEF5] bg-[#F7F6FF] py-2.5 pl-10 pr-4 text-[14px] text-[#1A1340] placeholder:text-[#7775A0] transition-all focus:border-[#2D2380] focus:outline-none focus:ring-2 focus:ring-[#2D2380]/10"
            />
          </form>

          <div className="ml-auto flex w-full items-center gap-3 overflow-x-auto md:w-auto [&::-webkit-scrollbar]:hidden">
            <select
              value={status}
              onChange={handleStatusChange}
              className="rounded-lg border-[1.5px] border-[#E0DEF5] bg-white px-4 py-2.5 text-[14px] font-medium text-[#1A1340] focus:border-[#2D2380] focus:outline-none"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatus("all");
                setPage(1);
              }}
              className="flex shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-[#E0DEF5] bg-[#F7F6FF] px-4 py-2.5 text-[14px] font-semibold text-[#7775A0] transition-colors hover:border-[#4A3DBF] hover:text-[#2D2380]"
            >
              <Filter size={18} />
              Reset
            </button>

            <button
              type="button"
              onClick={fetchNetworks}
              disabled={loading}
              className="flex shrink-0 items-center gap-2 rounded-lg border-[1.5px] border-[#E0DEF5] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#7775A0] transition-colors hover:border-[#4A3DBF] hover:text-[#2D2380] disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E0DEF5] bg-white shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E0DEF5] bg-[#F7F6FF] text-[12px] font-semibold uppercase tracking-wider text-[#7775A0]">
                  <th className="w-[25%] px-6 py-4">Network & Contact</th>
                  <th className="w-[25%] px-6 py-4">Tracking Template</th>
                  <th className="w-[25%] px-6 py-4">Terms & Payouts</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E0DEF5]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="flex items-center justify-center gap-3 text-[#7775A0]">
                        <Loader2 className="animate-spin" size={22} />
                        Loading affiliate networks...
                      </div>
                    </td>
                  </tr>
                ) : networks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <div className="space-y-2">
                        <p className="text-[15px] font-semibold text-[#1A1340]">
                          No affiliate networks found
                        </p>
                        <p className="text-sm text-[#7775A0]">
                          Try changing your filters or connect a new network.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  networks.map((network) => (
                    <tr
                      key={network._id}
                      className={`group transition-colors duration-150 hover:bg-[#EEEDFE]/40 ${
                        network.status === "inactive" ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <Link
                            href={`/admin/networks/${network._id}`}
                            className="text-[15px] font-bold text-[#1A1340] transition-colors hover:text-[#2D2380]"
                          >
                            {network.name || "Untitled Network"}
                          </Link>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[#7775A0]">
                              {network.owner || "No owner set"}
                            </span>

                            {network.websiteUrl ? (
                              <a
                                href={network.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#7775A0] hover:text-[#FF6B35]"
                                title="Open website"
                              >
                                <ExternalLink size={12} />
                              </a>
                            ) : null}
                          </div>

                          {network.accountManagerName ||
                          network.contactEmail ? (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#7775A0]">
                              <UserCircle
                                size={14}
                                className="text-[#2D2380]"
                              />
                              <span className="max-w-[180px] truncate">
                                {network.accountManagerName ||
                                  network.contactEmail}
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#7775A0]">
                              <UserCircle
                                size={14}
                                className="text-[#7775A0]"
                              />
                              <span>No contact assigned</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2 rounded-lg border border-[#E0DEF5] bg-[#F7F6FF] p-2.5 shadow-inner">
                            <LinkIcon
                              size={14}
                              className="mt-0.5 shrink-0 text-[#7775A0]"
                            />
                            {formatTrackingParams(network.trackingParams)}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#22B07D]/10 text-[#22B07D]">
                              <Percent size={12} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#1A1340]">
                                {Number(network.commissionRate || 0)}%
                              </span>
                              <span className="text-[10px] font-semibold uppercase text-[#7775A0]">
                                Baseline
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#F4A836]/10 text-[#BA7517]">
                              <Clock size={12} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#1A1340]">
                                {Number(network.cookieDays || 0)} Days
                              </span>
                              <span className="text-[10px] font-semibold uppercase text-[#7775A0]">
                                Cookie
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#2D2380]/10 text-[#2D2380]">
                              <DollarSign size={12} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[13px] font-bold text-[#1A1340]">
                                ${Number(network.minPayoutUsd || 0)}
                              </span>
                              <span className="text-[10px] font-semibold uppercase text-[#7775A0]">
                                {network.paymentTerms || "Payout"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 align-top">
                        {getStatusBadge(network.status)}
                      </td>

                      <td className="px-6 py-4 pt-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                          <Link
                            href={`/admin/networks/${network._id}`}
                            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#EEEDFE] hover:text-[#2D2380]"
                            title="Edit Settings"
                          >
                            <Edit size={16} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(network)}
                            disabled={deletingId === network._id}
                            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#FCEBEB] hover:text-[#E24B4A] disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === network._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#EEEDFE] hover:text-[#2D2380]"
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

          <div className="flex flex-col gap-3 border-t border-[#E0DEF5] bg-white px-6 py-4 md:flex-row md:items-center md:justify-between">
            <span className="text-[13px] font-medium text-[#7775A0]">
              Showing <strong className="text-[#1A1340]">{visibleFrom}</strong>{" "}
              to <strong className="text-[#1A1340]">{visibleTo}</strong> of{" "}
              <strong className="text-[#1A1340]">
                {pagination.total || 0}
              </strong>{" "}
              Networks
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage && page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E0DEF5] bg-white px-3 py-2 text-sm font-semibold text-[#7775A0] transition-colors hover:border-[#4A3DBF] hover:text-[#2D2380] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <span className="rounded-lg bg-[#F7F6FF] px-3 py-2 text-sm font-bold text-[#1A1340]">
                Page {pagination.page || page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                disabled={
                  !pagination.hasNextPage &&
                  page >= Number(pagination.totalPages || 1)
                }
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E0DEF5] bg-white px-3 py-2 text-sm font-semibold text-[#7775A0] transition-colors hover:border-[#4A3DBF] hover:text-[#2D2380] disabled:cursor-not-allowed disabled:opacity-50"
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
}
