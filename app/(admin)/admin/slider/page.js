"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  LayoutTemplate,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Globe,
  CalendarClock,
  GripVertical,
  ImageIcon,
  Type,
  MousePointerClick,
  CheckCircle,
  Clock,
  PauseCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Video,
  Monitor,
  Smartphone,
  FileEdit,
  Loader2,
  RefreshCw,
} from "lucide-react";

const API_URL = "/api/admin/hero-slides";

const SliderManagementPage = () => {
  const [slides, setSlides] = useState([]);
  const [selectedSlides, setSelectedSlides] = useState([]);

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("ALL");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [savingOrder, setSavingOrder] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search.trim()) params.set("search", search.trim());
    if (country !== "ALL") params.set("country", country);
    if (status !== "all") params.set("status", status);

    return params.toString();
  }, [page, limit, search, country, status]);

  const fetchSlides = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}?${queryString}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch hero slides.");
      }

      setSlides(Array.isArray(data.slides) ? data.slides : []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setSelectedSlides([]);
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to load hero slides.",
        icon: "error",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [queryString]);

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSlides(slides.map((s) => s._id));
    } else {
      setSelectedSlides([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedSlides((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleDeleteSlide = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This slide will be deleted permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "transparent",
      confirmButtonText: "Yes, delete it!",
      customClass: {
        popup: "rounded-[12px]",
        cancelButton: "text-[#7775A0] border border-[#E0DEF5]",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete hero slide.");
      }

      setSlides((prev) => prev.filter((slide) => slide._id !== id));
      setSelectedSlides((prev) => prev.filter((slideId) => slideId !== id));

      Swal.fire({
        title: "Deleted!",
        text: data.message || "Hero slide deleted successfully.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to delete hero slide.",
        icon: "error",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete ${selectedSlides.length} slides permanently!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "transparent",
      confirmButtonText: "Yes, delete them!",
      customClass: {
        popup: "rounded-[12px]",
        cancelButton: "text-[#7775A0] border border-[#E0DEF5]",
      },
    });

    if (!result.isConfirmed) return;

    try {
      const results = await Promise.allSettled(
        selectedSlides.map((id) =>
          fetch(`${API_URL}/${id}`, {
            method: "DELETE",
          }),
        ),
      );

      const failed = results.filter(
        (result) => result.status === "rejected" || !result.value.ok,
      );

      if (failed.length > 0) {
        throw new Error(`${failed.length} slide(s) could not be deleted.`);
      }

      setSlides((prev) =>
        prev.filter((slide) => !selectedSlides.includes(slide._id)),
      );
      setSelectedSlides([]);

      Swal.fire({
        title: "Deleted!",
        text: "Selected slides have been removed.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to delete selected slides.",
        icon: "error",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    }
  };

  const handleSortOrderChange = (id, value) => {
    setSlides((prev) =>
      prev.map((slide) =>
        slide._id === id ? { ...slide, sortOrder: Number(value) } : slide,
      ),
    );
  };

  const handleSaveOrder = async () => {
    try {
      setSavingOrder(true);

      const sortedSlides = [...slides].map((slide, index) => ({
        ...slide,
        sortOrder: Number.isFinite(Number(slide.sortOrder))
          ? Number(slide.sortOrder)
          : index,
      }));

      const results = await Promise.allSettled(
        sortedSlides.map((slide) =>
          fetch(`${API_URL}/${slide._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: slide.sortOrder }),
          }),
        ),
      );

      const failed = results.filter(
        (result) => result.status === "rejected" || !result.value.ok,
      );

      if (failed.length > 0) {
        throw new Error(`${failed.length} slide order update(s) failed.`);
      }

      await fetchSlides();

      Swal.fire({
        title: "Success!",
        text: "Slider sequence updated successfully.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to save slider sequence.",
        icon: "error",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
    } finally {
      setSavingOrder(false);
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "image_only":
        return (
          <span className="flex items-center gap-1.5 text-[#7775A0] text-[12px] font-bold uppercase tracking-wider">
            <ImageIcon size={14} className="text-[#2D2380]" /> Image Only
          </span>
        );
      case "text_overlay":
        return (
          <span className="flex items-center gap-1.5 text-[#7775A0] text-[12px] font-bold uppercase tracking-wider">
            <Type size={14} className="text-[#2D2380]" /> Text Overlay
          </span>
        );
      case "full_cta":
        return (
          <span className="flex items-center gap-1.5 text-[#F4A836] text-[12px] font-bold uppercase tracking-wider">
            <MousePointerClick size={14} /> Full CTA Block
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#E1F5EE] text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20 w-fit">
            <CheckCircle size={12} /> Active
          </span>
        );
      case "scheduled":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAEEDA] text-[#BA7517] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#F4A836]/30 w-fit">
            <Clock size={12} /> Scheduled
          </span>
        );
      case "inactive":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F7F6FF] text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5] w-fit">
            <PauseCircle size={12} /> Inactive
          </span>
        );
      case "draft":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#A09EC0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5] w-fit shadow-sm">
            <FileEdit size={12} /> Draft
          </span>
        );
      default:
        return null;
    }
  };

  const getDeviceIcon = (visibility) => {
    if (visibility === "desktop_only")
      return (
        <Monitor size={14} className="text-[#4A3DBF]" title="Desktop Only" />
      );

    if (visibility === "mobile_only")
      return (
        <Smartphone size={14} className="text-[#4A3DBF]" title="Mobile Only" />
      );

    return <Monitor size={14} className="text-[#7775A0]" title="All Devices" />;
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 font-sans">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <LayoutTemplate
                className="text-[#F4A836]"
                size={32}
                strokeWidth={2.5}
              />
              Homepage Slider
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage hero banners, video overlays, and intelligent
              geo-scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSlides}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-white border border-[#E0DEF5] text-[#2D2380] hover:bg-[#EEEDFE] px-4 py-3 rounded-lg font-bold text-[14px] transition-all disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>

            <Link
              href="/admin/slider/new"
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] hover:-translate-y-0.5 text-white px-6 py-3 rounded-lg font-bold text-[15px] shadow-[0_4px_14px_rgba(255,107,53,0.3)] transition-all duration-150"
            >
              <Plus size={18} strokeWidth={2.5} />
              Design New Slide
            </Link>
          </div>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by internal name..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {selectedSlides.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-[#FCEBEB] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white px-4 py-2.5 rounded-lg font-semibold text-[13px] transition-colors shrink-0"
              >
                <Trash2 size={16} /> Delete ({selectedSlides.length})
              </button>
            )}

            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPage(1);
              }}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="ALL">All Regions</option>
              <option value="US">Targeting US</option>
              <option value="PK">Targeting PK</option>
              <option value="GB">Targeting GB</option>
              <option value="UK">Targeting UK</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2.5 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Drafts</option>
            </select>

            <button
              onClick={handleSaveOrder}
              disabled={savingOrder || loading || slides.length === 0}
              className="flex items-center gap-2 bg-[#EEEDFE] border-[1.5px] border-[#4A3DBF] text-[#2D2380] hover:bg-[#2D2380] hover:text-white px-5 py-2.5 rounded-lg font-bold text-[13px] transition-colors shrink-0 disabled:opacity-60"
            >
              {savingOrder ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              Save Sequence
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F7F6FF] border-b border-[#E0DEF5]">
                  <th className="px-4 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5] cursor-pointer"
                      onChange={toggleSelectAll}
                      checked={
                        selectedSlides.length === slides.length &&
                        slides.length > 0
                      }
                    />
                  </th>
                  <th className="px-2 py-4 w-10"></th>
                  <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold w-[25%]">
                    Media Asset
                  </th>
                  <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                    Identity & Type
                  </th>
                  <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                    Targeting & Schedule
                  </th>
                  <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                    Sequence
                  </th>
                  <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E0DEF5]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex items-center justify-center gap-3 text-[#7775A0] font-semibold">
                        <Loader2 size={22} className="animate-spin" />
                        Loading hero slides...
                      </div>
                    </td>
                  </tr>
                ) : slides.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="text-[#7775A0] font-semibold">
                        No hero slides found.
                      </div>
                    </td>
                  </tr>
                ) : (
                  slides.map((slide) => {
                    const isVideo = slide.media?.mediaType === "video";
                    const displayImage = isVideo
                      ? slide.media?.posterUrl || slide.media?.desktopUrl
                      : slide.media?.desktopUrl;

                    return (
                      <tr
                        key={slide._id}
                        className={`hover:bg-[#EEEDFE]/30 transition-colors duration-150 group ${
                          selectedSlides.includes(slide._id)
                            ? "bg-[#EEEDFE]/50"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4 text-center align-middle">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5] cursor-pointer"
                            checked={selectedSlides.includes(slide._id)}
                            onChange={() => toggleSelect(slide._id)}
                          />
                        </td>

                        <td className="px-2 py-4 align-middle text-[#A09EC0] cursor-grab hover:text-[#1A1340]">
                          <GripVertical size={20} />
                        </td>

                        <td className="px-6 py-4">
                          <div className="w-full max-w-[200px] aspect-[21/9] rounded-lg border border-[#E0DEF5] bg-[#F7F6FF] overflow-hidden relative shadow-sm group-hover:border-[#4A3DBF] transition-colors">
                            {displayImage ? (
                              <>
                                <img
                                  src={displayImage}
                                  alt={slide.media?.altText || "Preview"}
                                  className="w-full h-full object-cover"
                                />
                                {isVideo && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                    <Video
                                      className="text-white opacity-80"
                                      size={24}
                                    />
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#A09EC0]">
                                <ImageIcon size={24} />
                              </div>
                            )}

                            <div className="absolute top-1.5 right-1.5">
                              {getStatusBadge(slide.status)}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <p className="text-[#1A1340] font-bold text-[14px] leading-snug line-clamp-2 mb-2">
                            {slide.internalName}
                          </p>
                          {getTypeBadge(slide.slideType)}
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <div className="flex flex-col gap-2">
                            <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-bold">
                              <Globe size={14} className="text-[#7775A0]" />
                              {slide.targeting?.countries?.length === 0
                                ? "Global"
                                : slide.targeting?.countries?.join(", ") ||
                                  "Global"}
                              <span className="mx-1 text-[#E0DEF5]">|</span>
                              {getDeviceIcon(
                                slide.targeting?.deviceVisibility || "all",
                              )}
                            </span>

                            {slide.schedule?.startDate ? (
                              <span className="flex flex-col text-[11px] font-medium text-[#7775A0] bg-[#F7F6FF] p-1.5 rounded border border-[#E0DEF5]">
                                <span className="flex items-center gap-1.5">
                                  <CalendarClock size={12} /> Starts:{" "}
                                  {new Date(
                                    slide.schedule.startDate,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <CalendarClock size={12} /> Ends:{" "}
                                  {slide.schedule?.endDate
                                    ? new Date(
                                        slide.schedule.endDate,
                                      ).toLocaleDateString()
                                    : "No end date"}
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[#7775A0] text-[12px]">
                                <CalendarClock size={14} /> Evergreen (No
                                Schedule)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4 align-middle">
                          <input
                            type="number"
                            value={slide.sortOrder ?? 0}
                            onChange={(e) =>
                              handleSortOrderChange(slide._id, e.target.value)
                            }
                            className="w-16 px-2 py-1.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] font-bold text-center text-[#1A1340] focus:border-[#2D2380] outline-none transition-colors"
                          />
                        </td>

                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link
                              href={`/admin/slider/edit/${slide._id}`}
                              className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                              title="Edit Slide"
                            >
                              <Edit size={16} />
                            </Link>

                            <button
                              onClick={() => handleDeleteSlide(slide._id)}
                              className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>

                            <button
                              className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                              title="Options"
                            >
                              <MoreVertical size={16} />
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

          <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[#7775A0] text-[13px] font-medium">
              Showing <strong className="text-[#1A1340]">{startItem}</strong> to{" "}
              <strong className="text-[#1A1340]">{endItem}</strong> of{" "}
              <strong className="text-[#1A1340]">{total}</strong> slides
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <button className="w-8 h-8 rounded bg-[#2D2380] text-white text-[13px] font-bold flex items-center justify-center">
                {page}
              </button>

              {page < totalPages && (
                <button
                  onClick={() => setPage((prev) => prev + 1)}
                  className="w-8 h-8 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] text-[13px] font-bold flex items-center justify-center transition-colors"
                >
                  {page + 1}
                </button>
              )}

              <button
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Understanding Your DealVerse Table
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <Video size={16} /> Media Previews
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                If you created a video slide, the table automatically displays
                the <b>Poster Image Fallback</b> with a dark play icon overlay.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <Globe size={16} /> Array Geo-Targeting
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                If the database array is empty, it reads as <b>Global</b>. If
                multiple regions exist, they are listed like{" "}
                <code>US, GB, PK</code>.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <FileEdit size={16} /> Draft Status
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Drafts are safely hidden from the frontend until switched to
                Active or Scheduled.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SliderManagementPage;
