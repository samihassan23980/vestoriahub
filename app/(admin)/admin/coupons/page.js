"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Tag,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  CheckCircle,
  Globe,
  CalendarX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  GripVertical,
  Save,
  Loader2,
} from "lucide-react";

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── SORTABLE TABLE ROW COMPONENT ───
const SortableRow = ({
  coupon,
  selectedCoupons,
  toggleSelect,
  deletingId,
  handleDeleteCoupon,
  formatDiscount,
  getTypeBadge,
  getStatusBadge,
  isDragEnabled,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: coupon._id,
    disabled: !isDragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-[#EEEDFE]/30 transition-colors duration-150 group ${
        selectedCoupons.includes(coupon._id) ? "bg-[#EEEDFE]/50" : ""
      } ${isDragging ? "bg-[#EEEDFE] shadow-lg" : ""}`}
    >
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {isDragEnabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="p-1 text-[#7775A0] hover:text-[#2D2380] cursor-grab active:cursor-grabbing rounded"
              title="Drag to reorder"
            >
              <GripVertical size={18} />
            </button>
          )}
          <input
            type="checkbox"
            className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5]"
            checked={selectedCoupons.includes(coupon._id)}
            onChange={() => toggleSelect(coupon._id)}
          />
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex flex-col gap-1 w-4 shrink-0">
            {coupon.isPinned && (
              <Pin
                size={16}
                className="text-[#F4A836]"
                fill="currentColor"
                title="Pinned"
              />
            )}
          </div>
          <div>
            <p className="text-[#1A1340] font-bold text-[14px] leading-snug line-clamp-2 pr-4">
              {coupon.title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#2D2380] text-[12px] font-bold bg-[#EEEDFE] px-2 py-0.5 rounded">
                {coupon.storeId?.name || "Unknown Store"}
              </span>
              {coupon.isVerified && (
                <span
                  className="flex items-center gap-1 text-[#22B07D] text-[10px] font-bold uppercase tracking-wider"
                  title="Verified Working"
                >
                  <CheckCircle size={12} /> Verified
                </span>
              )}
              {coupon.isExclusive && (
                <span
                  className="flex items-center gap-1 text-[#F4A836] text-[10px] font-bold uppercase tracking-wider"
                  title="Sociantech Exclusive"
                >
                  <Sparkles size={12} /> Exclusive
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 align-top">
        {getTypeBadge(coupon.type, coupon.codeType, coupon.code)}
      </td>

      <td className="px-6 py-4 align-top">
        <span className="text-[#1A1340] font-bold text-[15px]">
          {formatDiscount(coupon.discountType, coupon.discountValue)}
        </span>
        <div className="flex flex-col gap-0.5 mt-1.5 text-[#7775A0] text-[11px] font-medium">
          {coupon.minOrderValue > 0 && (
            <span>Min Spend: ${coupon.minOrderValue}</span>
          )}
          {coupon.maxDiscountCap && (
            <span>Cap: ${coupon.maxDiscountCap}</span>
          )}
          {coupon.minOrderValue === 0 && !coupon.maxDiscountCap && (
            <span>No restrictions</span>
          )}
        </div>
      </td>

      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[#1A1340] text-[12px] font-bold">
            <Globe size={14} className="text-[#7775A0]" />
            {coupon.countryCode === "GLOBAL" ? "Global" : coupon.countryCode}
          </span>
          <span
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
              coupon.status === "expired" ? "text-[#E24B4A]" : "text-[#7775A0]"
            }`}
          >
            <CalendarX size={14} />
            {coupon.expiryDate
              ? new Date(coupon.expiryDate).toLocaleDateString()
              : "Evergreen"}
          </span>
        </div>
      </td>

      <td className="px-6 py-4 align-top">
        {getStatusBadge(coupon.status)}
      </td>

      <td className="px-6 py-4 align-top text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`/admin/coupons/${coupon._id}`}
            className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
            title="Edit Offer"
          >
            <Edit size={16} />
          </Link>
          <button
            onClick={() => handleDeleteCoupon(coupon._id)}
            disabled={deletingId === coupon._id}
            className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={16} />
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
  );
};

// ─── MAIN COUPONS PAGE COMPONENT ───
const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCoupons, setSelectedCoupons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState("all");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("limit", String(limit));

    if (search.trim()) params.set("search", search.trim());
    if (storeId !== "all") params.set("storeId", storeId);
    if (status !== "all") params.set("status", status);

    return params.toString();
  }, [page, limit, search, storeId, status]);

  const isDragEnabled = storeId !== "all" && search.trim() === "";

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const res = await fetch(`/api/admin/coupons?${queryString}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch coupons.");
      }

      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
      setTotal(Number(data.total || 0));
      setTotalPages(Number(data.totalPages || 1));
      setSelectedCoupons([]);
      setHasOrderChanged(false);
    } catch (error) {
      console.error("Fetch coupons error:", error);
      setCoupons([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await fetch("/api/admin/stores?limit=1000", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to fetch stores.");
      }

      setStores(Array.isArray(data.stores) ? data.stores : []);
    } catch (error) {
      console.error("Fetch stores error:", error);
      setStores([]);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  useEffect(() => {
    setPage(1);
  }, [search, storeId, status]);

  // Drag End Event Handler
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCoupons((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasOrderChanged(true);
    }
  };

  // Save Custom Reorder to Backend Database
  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);

      const selectedStore = stores.find((s) => s._id === storeId);
      const payload = {
        items: coupons.map((coupon, idx) => ({
          id: coupon._id,
          sortOrder: idx + 1,
        })),
        storeSlug: selectedStore?.slug || "",
      };

      const res = await fetch("/api/admin/coupons/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save order.");
      }

      setHasOrderChanged(false);
      alert("Coupon sequence saved and cache revalidated successfully!");
    } catch (error) {
      console.error("Save order error:", error);
      alert(error.message || "Failed to save sort order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCoupons(coupons.map((c) => c._id));
    } else {
      setSelectedCoupons([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedCoupons((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteCoupon = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this coupon?"
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);

      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to delete coupon.");
      }

      await fetchCoupons();
    } catch (error) {
      console.error("Delete coupon error:", error);
      alert(error.message || "Failed to delete coupon.");
    } finally {
      setDeletingId("");
    }
  };

  const getStatusBadge = (couponStatus) => {
    switch (couponStatus) {
      case "active":
        return (
          <span className="px-2.5 py-1 bg-[#E1F5EE] text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
            Active
          </span>
        );
      case "expired":
        return (
          <span className="px-2.5 py-1 bg-[#FCEBEB] text-[#E24B4A] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E24B4A]/20">
            Expired
          </span>
        );
      case "inactive":
        return (
          <span className="px-2.5 py-1 bg-[#F7F6FF] text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5]">
            Inactive
          </span>
        );
      default:
        return null;
    }
  };

  const formatDiscount = (type, value) => {
    if (type === "percent") return `${value}% OFF`;
    if (type === "flat") return `$${value} OFF`;
    if (type === "free_shipping") return "FREE SHIPPING";
    return value || "-";
  };

  const getTypeBadge = (type, codeType, code) => {
    if (type === "deal") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E0DEF5]">
          <Tag size={12} /> Codeless Deal
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="px-2 py-0.5 bg-[#1A1340] text-[#F4A836] font-mono text-[13px] font-bold rounded shadow-sm border border-[#F4A836]/30">
          {code || "AUTO"}
        </span>
        <span className="text-[#7775A0] text-[10px] font-bold uppercase tracking-wider">
          {codeType === "public" ? "Public Code" : "Auto-Applied"}
        </span>
      </div>
    );
  };

  const startEntry = total === 0 ? 0 : (page - 1) * limit + 1;
  const endEntry = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <Tag className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Coupons & Offers
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage your affiliate tracking links, promo codes, and automated
              deals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasOrderChanged && (
              <button
                onClick={handleSaveOrder}
                disabled={isSavingOrder}
                className="flex items-center justify-center gap-2 bg-[#22B07D] hover:bg-[#1f9d6f] text-white px-5 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-colors duration-150"
              >
                {isSavingOrder ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Sorting Order
              </button>
            )}
            <Link
              href="/admin/coupons/new"
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-colors duration-150"
            >
              <Plus size={18} strokeWidth={2.5} />
              Single Coupon
            </Link>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-[350px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search by title, code, or store..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Stores (Sorting Disabled)</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE WITH DND CONTEXT */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1050px]">
                <thead>
                  <tr className="bg-[#F7F6FF] border-b border-[#E0DEF5]">
                    <th className="px-6 py-4 w-16">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#2D2380] rounded border-[#E0DEF5]"
                        onChange={toggleSelectAll}
                        checked={
                          selectedCoupons.length === coupons.length &&
                          coupons.length > 0
                        }
                      />
                    </th>
                    <th className="px-4 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold w-[35%]">
                      Offer Details
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Type & Code
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Value & Logic
                    </th>
                    <th className="px-6 py-4 text-[#7775A0] text-[11px] uppercase tracking-widest font-bold">
                      Targeting
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
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-[#7775A0] text-[14px] font-semibold"
                      >
                        Loading coupons...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-10 text-center text-[#7775A0] text-[14px] font-semibold"
                      >
                        No coupons found.
                      </td>
                    </tr>
                  ) : (
                    <SortableContext
                      items={coupons.map((c) => c._id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {coupons.map((coupon) => (
                        <SortableRow
                          key={coupon._id}
                          coupon={coupon}
                          selectedCoupons={selectedCoupons}
                          toggleSelect={toggleSelect}
                          deletingId={deletingId}
                          handleDeleteCoupon={handleDeleteCoupon}
                          formatDiscount={formatDiscount}
                          getTypeBadge={getTypeBadge}
                          getStatusBadge={getStatusBadge}
                          isDragEnabled={isDragEnabled}
                        />
                      ))}
                    </SortableContext>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-[#7775A0] text-[13px] font-medium">
                Showing <strong className="text-[#1A1340]">{startEntry}</strong>{" "}
                to <strong className="text-[#1A1340]">{endEntry}</strong> of{" "}
                <strong className="text-[#1A1340]">{total}</strong> entries
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button className="w-8 h-8 rounded bg-[#2D2380] text-white text-[13px] font-bold flex items-center justify-center">
                  {page}
                </button>
                <button
                  onClick={() =>
                    setPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={page >= totalPages}
                  className="p-1.5 rounded border border-[#E0DEF5] text-[#7775A0] hover:text-[#1A1340] hover:bg-[#F7F6FF] disabled:opacity-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </DndContext>
      </div>
    </div>
  );
};

export default CouponsPage;