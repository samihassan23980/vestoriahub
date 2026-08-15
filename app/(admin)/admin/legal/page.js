"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  Plus,
  Edit,
  Trash2,
  Globe,
  Lock,
  Unlock,
  FileText,
  CalendarClock,
  ShieldCheck,
  EyeOff,
  BookOpen,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

const LegalPagesManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

  // ─── FETCH DATA FROM API ──────────────────────────────────────────────────
  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/legal?type=${filterType === "all" ? "" : filterType}`,
      );
      const data = await res.json();
      if (res.ok) {
        setPages(data.pages);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [filterType]);

  // ─── DELETE HANDLER (With Protection Check) ───────────────────────────────
  const handleDelete = async (id, isSystem, title) => {
    if (isSystem) {
      Swal.fire({
        icon: "error",
        title: "Action Blocked",
        text: "System pages (Privacy, Terms, etc.) are required for compliance and cannot be deleted.",
        confirmButtonColor: "#1A1340",
      });
      return;
    }

    const result = await Swal.fire({
      title: `Delete "${title}"?`,
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#7775A0",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/admin/legal/${id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("Deleted!", "Page has been removed.", "success");
          fetchPages();
        } else {
          const err = await res.json();
          Swal.fire("Error", err.error, "error");
        }
      } catch (error) {
        Swal.fire("Error", "Failed to delete page.", "error");
      }
    }
  };

  // ─── SEARCH FILTER ────────────────────────────────────────────────────────
  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // ─── BADGE HELPERS ────────────────────────────────────────────────────────
  const getStatusBadge = (status) =>
    status === "published" ? (
      <span className="px-2.5 py-1 bg-[#E1F5EE] text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
        Published
      </span>
    ) : (
      <span className="px-2.5 py-1 bg-[#F7F6FF] text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5]">
        Draft
      </span>
    );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <Scale className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Legal & Static Pages
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage core legal documents and E-E-A-T compliance pages.
            </p>
          </div>
          <Link
            href="/admin/legal/new"
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all"
          >
            <Plus size={18} strokeWidth={2.5} /> Create Custom Page
          </Link>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search title or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:outline-none focus:border-[#2D2380] transition-all"
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380] w-full md:w-auto cursor-pointer"
            >
              <option value="all">All Page Types</option>
              <option value="about_us">About Us</option>
              <option value="privacy_policy">Privacy Policy</option>
              <option value="terms">Terms & Conditions</option>
              <option value="affiliate_disclosure">Affiliate Disclosure</option>
              <option value="custom">Custom Pages</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-[#2D2380]" size={40} />
              <p className="text-[#7775A0] font-medium">
                Syncing with database...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#F7F6FF] border-b border-[#E0DEF5]">
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold w-[40%]">
                      Page Details
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      System Lock
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Last Revised
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
                  {filteredPages.map((page) => (
                    <tr
                      key={page._id}
                      className="hover:bg-[#EEEDFE]/30 transition-colors duration-150 group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex-shrink-0">
                            <FileText size={18} className="text-[#2D2380]" />
                          </div>
                          <div>
                            <p className="text-[#1A1340] font-bold text-[15px]">
                              {page.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[#7775A0] text-[12px] font-mono bg-[#F7F6FF] px-1.5 py-0.5 rounded border border-[#E0DEF5]">
                                /{page.slug}
                              </span>
                              {!page.seo?.indexable && (
                                <span className="flex items-center gap-1 text-[#E24B4A] text-[10px] font-bold uppercase tracking-wider">
                                  <EyeOff size={12} /> NoIndex
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {page.isSystemPage ? (
                          <div className="flex flex-col items-start gap-1">
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#4A3DBF]/30">
                              <ShieldCheck size={12} /> Core Page
                            </span>
                            <span className="text-[#7775A0] text-[11px] font-medium pl-1">
                              Protected
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5]">
                            <Unlock size={12} /> Custom
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#1A1340] font-bold text-[13px] flex items-center gap-1.5">
                          <CalendarClock size={14} className="text-[#F4A836]" />
                          {new Date(page.lastRevisedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(page.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            href={`/admin/legal/${page._id}`}
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          >
                            <Edit size={16} />
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(
                                page._id,
                                page.isSystemPage,
                                page.title,
                              )
                            }
                            className={`p-2 rounded-lg transition-colors ${page.isSystemPage ? "text-[#E0DEF5] cursor-not-allowed" : "text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB]"}`}
                          >
                            {page.isSystemPage ? (
                              <Lock size={16} />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                          <a
                            href={`/legal/${page.slug}`}
                            target="_blank"
                            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          >
                            <Globe size={16} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FIELD GUIDE (Static Footer Information) */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold">Legal Configuration Guide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-[13px] text-[#E0DEF5]">
            <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold flex items-center gap-2">
                <ShieldCheck size={16} /> The System Lock
              </h3>
              <p>
                Core pages are locked and cannot be deleted. This ensures your
                footer links like Privacy and Disclosure never break,
                maintaining FTC compliance.
              </p>
            </div>
            <div className="space-y-2 bg-white/5 border border-white/10 p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold flex items-center gap-2">
                <CalendarClock size={16} /> Revision Tracking
              </h3>
              <p>
                The <b>Last Revised</b> date updates automatically only when
                content is modified. This is required by data protection laws
                (GDPR/CCPA).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPagesManager;
