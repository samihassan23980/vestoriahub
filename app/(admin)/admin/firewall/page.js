"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  MapPin,
  Lock,
  Route,
  Network,
  CheckCircle,
  PauseCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";

export default function GeoFirewallManager() {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRules, setTotalRules] = useState(0);
  const [limit] = useState(10);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedRules, setSelectedRules] = useState([]);

  // ─── DEBOUNCE SEARCH ───────────────────────────────────────────────────
  // Prevents API spam by waiting 500ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [typeFilter, statusFilter]);

  // ─── DATA FETCHING ─────────────────────────────────────────────────────
  const fetchRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build query string
      const params = new URLSearchParams({ page, limit });
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (typeFilter !== "all") params.append("blockType", typeFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`/api/admin/geo-firewall?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setRules(json.data.rules);
        setTotalPages(json.data.totalPages);
        setTotalRules(json.data.total);
      } else {
        throw new Error(json.error || "Failed to fetch rules");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, typeFilter, statusFilter]);

  // ─── ACTIONS ───────────────────────────────────────────────────────────
  const handleDelete = async (idsToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${idsToDelete.length} rule(s)?`,
      )
    )
      return;

    try {
      const res = await fetch("/api/admin/geo-firewall", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      const json = await res.json();

      if (json.success) {
        setSelectedRules([]);
        fetchRules(); // Refresh list
      } else {
        alert(json.error || "Failed to delete.");
      }
    } catch (err) {
      alert("A network error occurred.");
    }
  };

  // ─── SELECTION HELPERS ─────────────────────────────────────────────────
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRules(rules.map((r) => r._id));
    } else {
      setSelectedRules([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedRules((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ─── UI RENDER HELPERS ─────────────────────────────────────────────────
  const getTargetBadge = (type, value) => {
    if (type === "country") {
      return (
        <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-bold">
          <Globe size={14} className="text-[#2D2380]" /> Country: {value}
        </span>
      );
    }
    if (type === "ip_address") {
      return (
        <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-bold font-mono">
          <MapPin size={14} className="text-[#E24B4A]" /> IP: {value}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-bold font-mono">
        <Network size={14} className="text-[#F4A836]" /> ASN: {value}
      </span>
    );
  };

  const getEnforcementUI = (action, scope, targetRoutes = []) => {
    return (
      <div className="flex flex-col gap-1.5 items-start">
        {action === "block" ? (
          <span className="px-2 py-0.5 bg-[#FCEBEB] text-[#E24B4A] text-[11px] font-bold uppercase tracking-wider rounded border border-[#E24B4A]/20 flex items-center gap-1">
            <Lock size={10} /> Hard Block
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wider rounded border border-[#4A3DBF]/20 flex items-center gap-1">
            <ArrowRightLeft size={10} /> Redirect
          </span>
        )}
        <span className="text-[#7775A0] text-[12px] flex items-center gap-1 font-medium">
          {scope === "global" ? (
            <>
              <Globe size={12} /> Entire Website
            </>
          ) : (
            <>
              <Route size={12} /> {targetRoutes.length} Specific Route(s)
            </>
          )}
        </span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    return status === "active" ? (
      <span className="px-2.5 py-1 bg-[#E1F5EE] text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20 flex items-center gap-1 w-fit">
        <CheckCircle size={12} /> Active
      </span>
    ) : (
      <span className="px-2.5 py-1 bg-[#F7F6FF] text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5] flex items-center gap-1 w-fit">
        <PauseCircle size={12} /> Inactive
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
              <ShieldAlert
                className="text-[#E24B4A]"
                size={32}
                strokeWidth={2.5}
              />
              Geo-Firewall & Access
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage IP bans, country-level blocking, and edge routing rules.
            </p>
          </div>
          <Link
            href="/admin/firewall/new"
            className="flex items-center justify-center gap-2 bg-[#1A1340] hover:bg-[#2D2380] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150"
          >
            <Plus size={18} strokeWidth={2.5} />
            Create Firewall Rule
          </Link>
        </div>

        {/* ─── TOOLBAR (Search & Filters) ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search by rule name or IP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {selectedRules.length > 0 && (
              <button
                onClick={() => handleDelete(selectedRules)}
                className="flex items-center gap-2 bg-[#FCEBEB] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white px-4 py-2 rounded-lg font-semibold text-[13px] transition-colors shrink-0"
              >
                <Trash2 size={16} /> Delete ({selectedRules.length})
              </button>
            )}
            <div className="w-px h-6 bg-[#E0DEF5] mx-1 hidden md:block"></div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Targets</option>
              <option value="country">Countries Only</option>
              <option value="ip_address">IP Addresses Only</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Rules</option>
              <option value="inactive">Inactive Rules</option>
            </select>

            <button className="flex items-center justify-center bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] w-9 h-9 rounded-lg transition-colors shrink-0">
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* ─── DATA TABLE ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            {error && (
              <div className="p-8 text-center text-[#E24B4A] font-medium">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#7775A0]">
                <Loader2 size={32} className="animate-spin text-[#2D2380]" />
                <p>Loading firewall rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="p-16 text-center text-[#7775A0]">
                <p className="text-lg font-semibold text-[#1A1340]">
                  No rules found.
                </p>
                <p className="mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-[#F7F6FF] border-b border-[#E0DEF5]">
                    <th className="px-6 py-4 w-12">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5]"
                        onChange={toggleSelectAll}
                        checked={
                          selectedRules.length === rules.length &&
                          rules.length > 0
                        }
                      />
                    </th>
                    <th className="px-4 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold w-[35%]">
                      Rule Identity & Reason
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Block Target
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Enforcement & Scope
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DEF5]">
                  {rules.map((rule) => (
                    <tr
                      key={rule._id}
                      className={`hover:bg-[#EEEDFE]/30 transition-colors duration-150 group ${
                        selectedRules.includes(rule._id)
                          ? "bg-[#EEEDFE]/50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5]"
                          checked={selectedRules.includes(rule._id)}
                          onChange={() => toggleSelect(rule._id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-[#1A1340] font-bold text-[14px] leading-snug">
                            {rule.ruleName}
                          </p>
                          <p className="text-[#7775A0] text-[12px] mt-1 line-clamp-1 italic">
                            "{rule.reason || "No reason provided."}"
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {getTargetBadge(rule.blockType, rule.value)}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {getEnforcementUI(
                          rule.action,
                          rule.scope,
                          rule.targetRoutes,
                        )}
                      </td>
                      <td className="px-6 py-4 align-middle">
                        {getStatusBadge(rule.status)}
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete([rule._id])}
                            className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors">
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ─── PAGINATION ─── */}
          {!isLoading && rules.length > 0 && (
            <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex items-center justify-between">
              <span className="text-[#7775A0] text-[13px] font-medium">
                Showing{" "}
                <strong className="text-[#1A1340]">{rules.length}</strong> of{" "}
                <strong className="text-[#1A1340]">{totalRules}</strong> rules
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 py-1 text-[13px] font-bold text-[#1A1340]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── QUICK FIELD GUIDE ─── */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Middleware Architecture Guide
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1 md:col-span-2 bg-[rgba(226,75,74,0.1)] border border-[#E24B4A]/30 p-4 rounded-lg">
              <h3 className="text-[#E24B4A] font-bold text-[14px] flex items-center gap-2">
                <ShieldAlert size={16} /> Important: Database Syncing
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                Rules created here are saved to MongoDB, but Next.js Middleware
                cannot securely connect to MongoDB directly without slowing down
                your site. Behind the scenes, the API pushes these Active rules
                to a high-speed Edge Cache.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
