/* app/(admin)/admin/coupons/new/page.js */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Tag,
  Link as LinkIcon,
  Globe,
  Calendar,
  CheckCircle,
  Sparkles,
  Pin,
  PlusCircle,
  Trash2,
  Copy,
  Store,
  Layers,
  Loader2,
  BookOpen,
  AlertCircle,
  Zap,
  Wand2,
} from "lucide-react";

/**
 * Calculates a local ISO datetime string (YYYY-MM-DDTHH:mm)
 * exactly 2 months from right now.
 */
const getDefaultTwoMonthExpiry = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 2);
  date.setSeconds(0, 0);

  const pad = (n) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// ─── REUSABLE SUGGESTION CHIP COMPONENT ───
const SuggestionChips = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="text-[11px] bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-forest,#1C352D)] hover:border-[var(--adm-forest,#1C352D)] hover:bg-[var(--adm-surface,#FFFFFF)] rounded-md px-2.5 py-1.5 transition-all text-left shadow-sm flex items-center gap-1.5"
        >
          <Wand2 size={12} className="text-[var(--adm-gold,#D9A441)] shrink-0" />
          <span className="leading-tight">{s}</span>
        </button>
      ))}
    </div>
  );
};

const BulkCouponEditor = () => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  const createInitialCoupon = () => ({
    title: "",
    subtitle: "",
    terms: "",
    trackingLink: "",
    type: "coupon",
    codeType: "public",
    code: "",
    discountType: "percent",
    discountValue: "",
    maxDiscountCap: "",
    minOrderValue: "",
    status: "active",
    expiryDate: getDefaultTwoMonthExpiry(),
    isVerified: false,
    isExclusive: false,
    isPinned: false,
    countryCode: "GLOBAL",
    storeId: "",
    categoryId: "",
    secondaryCategoryIds: [],
  });

  const [coupons, setCoupons] = useState([
    { ...createInitialCoupon(), tempId: Date.now() },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeCoupon = coupons[activeIndex] || coupons[0];

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  const getArrayFromApi = (data, keys = []) => {
    for (const key of keys) {
      if (Array.isArray(data?.[key])) return data[key];
    }
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.categories)) return data.data.categories;
    if (Array.isArray(data?.data?.stores)) return data.data.stores;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.docs)) return data.docs;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  };

  const getDocId = (doc) => {
    if (!doc) return "";
    if (typeof doc === "string") return doc;
    return doc._id || doc.id || "";
  };

  const getCategoryLabel = (category) => {
    const level = Number(category?.level || 0);
    const prefix = level === 1 ? "— " : level === 2 ? "—— " : "";
    return `${prefix}${category?.name || category?.title || "Untitled Category"}`;
  };

  const selectedStore = useMemo(
    () => stores.find((store) => getDocId(store) === activeCoupon?.storeId),
    [stores, activeCoupon?.storeId],
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => getDocId(category) === activeCoupon?.categoryId,
      ),
    [categories, activeCoupon?.categoryId],
  );

  useEffect(() => {
    fetchReferenceData();
  }, []);

  const fetchReferenceData = async () => {
    try {
      setIsLoadingRefs(true);

      const [storesRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/stores?limit=1000", { cache: "no-store" }),
        fetch("/api/admin/categories?limit=1000&status=active", {
          cache: "no-store",
        }),
      ]);

      const storesData = await storesRes.json();
      const categoriesData = await categoriesRes.json();

      if (!storesRes.ok) throw new Error(storesData?.error || "Failed to load stores.");
      if (!categoriesRes.ok || categoriesData?.success === false) {
        throw new Error(categoriesData?.details || categoriesData?.error || "Failed to load categories.");
      }

      const normalizedStores = getArrayFromApi(storesData, ["stores", "store"]);
      const normalizedCategories = getArrayFromApi(categoriesData, ["categories", "category"])
        .filter((category) => category?.status === "active")
        .sort((a, b) => {
          const levelA = Number(a?.level || 0);
          const levelB = Number(b?.level || 0);
          const sortA = Number(a?.sortOrder || 1000);
          const sortB = Number(b?.sortOrder || 1000);

          if (levelA !== levelB) return levelA - levelB;
          if (sortA !== sortB) return sortA - sortB;

          return String(a?.name || "").localeCompare(String(b?.name || ""));
        });

      setStores(Array.isArray(normalizedStores) ? normalizedStores : []);
      setCategories(Array.isArray(normalizedCategories) ? normalizedCategories : []);
    } catch (error) {
      console.error("Reference data error:", error);
      Swal.fire({
        icon: "error",
        title: "Reference data failed",
        text: error.message || "Stores or categories could not be loaded. Please try again.",
        confirmButtonColor: "#1C352D",
      });
    } finally {
      setIsLoadingRefs(false);
    }
  };

  const normalizeNumber = (value, fallback = 0) => {
    if (value === "" || value === null || value === undefined) return fallback;
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  };

  const isValidUrl = (value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleCouponChange = (field, value) => {
    setCoupons((prev) =>
      prev.map((coupon, i) => {
        if (i !== activeIndex) return coupon;

        const updated = { ...coupon, [field]: value };

        if (field === "storeId") {
          const matchedStore = stores.find((s) => getDocId(s) === value);
          if (matchedStore) {
            const autoLink =
              matchedStore.tracking?.trackingLink ||
              matchedStore.trackingLink ||
              matchedStore.officialUrl ||
              "";
            if (autoLink) updated.trackingLink = autoLink;

            const storeCategoryId = getDocId(
              matchedStore.primaryCategoryId || matchedStore.category,
            );
            if (storeCategoryId) updated.categoryId = storeCategoryId;

            if (matchedStore.countryCode && matchedStore.countryCode !== "GLOBAL") {
              updated.countryCode = String(matchedStore.countryCode).toUpperCase();
            }
          }
        }

        if (field === "discountType" && value === "free_shipping") {
          updated.discountValue = 0;
          updated.maxDiscountCap = "";
        }
        if (field === "discountType" && value !== "percent") {
          updated.maxDiscountCap = "";
        }
        if (field === "type" && value === "deal") {
          updated.code = "";
          updated.codeType = "auto_applied";
        }
        if (field === "type" && value === "coupon" && !updated.codeType) {
          updated.codeType = "public";
        }
        if (field === "codeType" && value === "auto_applied") {
          updated.code = "";
        }
        if (field === "code") {
          updated.code = String(value || "").toUpperCase();
        }
        if (field === "countryCode") {
          updated.countryCode = String(value || "GLOBAL").toUpperCase();
        }

        return updated;
      }),
    );
  };

  const handleCheckboxChange = (e) => {
    handleCouponChange(e.target.name, e.target.checked);
  };

  const toggleSecondaryCategory = (catId) => {
    if (!catId) return;

    setCoupons((prev) =>
      prev.map((coupon, i) => {
        if (i !== activeIndex) return coupon;

        const currentSec = Array.isArray(coupon.secondaryCategoryIds)
          ? coupon.secondaryCategoryIds
          : [];
        const isSelected = currentSec.includes(catId);

        if (!isSelected && currentSec.length >= 5) {
          Toast.fire({
            icon: "warning",
            title: "Max 5 secondary categories allowed",
          });
          return coupon;
        }

        return {
          ...coupon,
          secondaryCategoryIds: isSelected
            ? currentSec.filter((id) => id !== catId)
            : [...currentSec, catId],
        };
      }),
    );
  };

  const addCouponToBatch = () => {
    const newCoupon = {
      ...createInitialCoupon(),
      tempId: Date.now() + Math.random(),
      storeId: activeCoupon?.storeId || "",
      categoryId: activeCoupon?.categoryId || "",
      secondaryCategoryIds: activeCoupon?.secondaryCategoryIds || [],
      countryCode: activeCoupon?.countryCode || "GLOBAL",
      status: activeCoupon?.status || "active",
      trackingLink: activeCoupon?.trackingLink || "",
      expiryDate: getDefaultTwoMonthExpiry(),
    };

    setCoupons((prev) => [...prev, newCoupon]);
    setActiveIndex(coupons.length);
    Toast.fire({ icon: "success", title: "New coupon draft added" });
  };

  const duplicateActiveCoupon = () => {
    const clonedCoupon = {
      ...activeCoupon,
      tempId: Date.now() + Math.random(),
      title: activeCoupon.title ? `${activeCoupon.title} Copy` : "",
      expiryDate: activeCoupon.expiryDate || getDefaultTwoMonthExpiry(),
    };

    setCoupons((prev) => [...prev, clonedCoupon]);
    setActiveIndex(coupons.length);
    Toast.fire({ icon: "success", title: "Coupon duplicated" });
  };

  const removeCouponFromBatch = async (indexToRemove) => {
    if (coupons.length === 1) {
      Toast.fire({ icon: "warning", title: "At least one coupon is required" });
      return;
    }
    const result = await Swal.fire({
      icon: "warning",
      title: "Remove this draft?",
      text: "This only removes it from the current list.",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#C1432F",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;

    setCoupons((prev) => prev.filter((_, i) => i !== indexToRemove));
    if (activeIndex === indexToRemove) {
      setActiveIndex(Math.max(0, indexToRemove - 1));
    } else if (activeIndex > indexToRemove) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const validateCoupon = (coupon, index) => {
    const label = `Coupon #${index + 1}`;
    if (!coupon.storeId) return `${label}: Store is required.`;
    if (!coupon.categoryId) return `${label}: Primary category is required.`;
    if (!coupon.title.trim()) return `${label}: Coupon title is required.`;
    if (coupon.title.length > 180) return `${label}: Coupon title cannot be more than 180 characters.`;
    if (!coupon.trackingLink.trim()) return `${label}: Store deal link is required.`;
    if (!isValidUrl(coupon.trackingLink)) return `${label}: Store deal link must be a valid http or https URL.`;
    if (!["coupon", "deal"].includes(coupon.type)) return `${label}: Invalid coupon type.`;
    if (!["public", "auto_applied"].includes(coupon.codeType)) return `${label}: Invalid code option.`;
    if (coupon.type === "coupon" && coupon.codeType === "public" && !coupon.code.trim()) {
      return `${label}: Promo code is required when code is shown to users.`;
    }
    if (!["percent", "flat", "free_shipping"].includes(coupon.discountType)) return `${label}: Invalid discount type.`;

    const discountValue = normalizeNumber(coupon.discountValue, 0);
    if (coupon.discountType !== "free_shipping" && discountValue <= 0) {
      return `${label}: Discount value must be greater than 0.`;
    }
    if (coupon.discountType === "percent" && discountValue > 100) {
      return `${label}: Percentage discount cannot be more than 100%.`;
    }
    if (coupon.subtitle.length > 250) return `${label}: Subtitle cannot be more than 250 characters.`;
    if (coupon.terms.length > 1000) return `${label}: Terms cannot be more than 1000 characters.`;
    if (normalizeNumber(coupon.minOrderValue, 0) < 0) return `${label}: Minimum order amount cannot be negative.`;
    if (coupon.maxDiscountCap !== "" && coupon.maxDiscountCap !== null && normalizeNumber(coupon.maxDiscountCap, 0) < 0) {
      return `${label}: Maximum discount limit cannot be negative.`;
    }
    if (!["active", "expired", "inactive"].includes(coupon.status)) return `${label}: Invalid status.`;
    if (Array.isArray(coupon.secondaryCategoryIds) && coupon.secondaryCategoryIds.length > 5) {
      return `${label}: Secondary categories cannot be more than 5.`;
    }
    return "";
  };

  const buildPayload = (coupon) => {
    return {
      title: coupon.title.trim(),
      subtitle: coupon.subtitle.trim(),
      terms: coupon.terms.trim(),
      trackingLink: coupon.trackingLink.trim(),
      type: coupon.type,
      codeType: coupon.type === "deal" ? "auto_applied" : coupon.codeType,
      code: coupon.type === "coupon" && coupon.codeType === "public" ? coupon.code.trim().toUpperCase() : "",
      discountType: coupon.discountType,
      discountValue: coupon.discountType === "free_shipping" ? 0 : normalizeNumber(coupon.discountValue, 0),
      maxDiscountCap: coupon.discountType === "percent" && coupon.maxDiscountCap !== "" ? normalizeNumber(coupon.maxDiscountCap, null) : null,
      minOrderValue: normalizeNumber(coupon.minOrderValue, 0),
      expiryDate: coupon.expiryDate || null,
      status: coupon.status,
      isVerified: Boolean(coupon.isVerified),
      isExclusive: Boolean(coupon.isExclusive),
      isPinned: Boolean(coupon.isPinned),
      countryCode: coupon.countryCode || "GLOBAL",
      sortOrder: 1000,
      storeId: coupon.storeId,
      categoryId: coupon.categoryId,
      secondaryCategoryIds: Array.isArray(coupon.secondaryCategoryIds) ? coupon.secondaryCategoryIds.filter(Boolean) : [],
    };
  };

const submitOneCoupon = async (payload) => {
  const response = await fetch("/api/admin/coupons", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error || "Failed to save coupon."
    );
  }

  return data;
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < coupons.length; i += 1) {
      const error = validateCoupon(coupons[i], i);
      if (error) {
        setActiveIndex(i);
        Swal.fire({
          icon: "error",
          title: "Please fix this coupon",
          text: error,
          confirmButtonColor: "#1C352D",
        });
        return;
      }
    }

    const result = await Swal.fire({
      icon: "question",
      title: `Save ${coupons.length} coupon(s)?`,
      text: "Each coupon will be saved one by one.",
      showCancelButton: true,
      confirmButtonText: "Save now",
      cancelButtonText: "Check again",
      confirmButtonColor: "#1C352D",
      cancelButtonColor: "#6B7280",
    });

    if (!result.isConfirmed) return;
    setIsSubmitting(true);

    const saved = [];
    const failed = [];

    try {
      for (let i = 0; i < coupons.length; i += 1) {
        const payload = buildPayload(coupons[i]);
        try {
          const data = await submitOneCoupon(payload);
          saved.push(data?.coupon || data);
        } catch (error) {
          failed.push({
            index: i,
            title: coupons[i].title || `Coupon #${i + 1}`,
            error: error.message || "Unknown error",
          });
        }
      }

      if (failed.length > 0) {
        const failedList = failed.map((item) => `• ${item.title}: ${item.error}`).join("<br/>");
        Swal.fire({
          icon: saved.length > 0 ? "warning" : "error",
          title: saved.length > 0 ? "Some coupons were saved" : "Coupons were not saved",
          html: `<div style="text-align:left"><p><b>Saved:</b> ${saved.length}</p><p><b>Failed:</b> ${failed.length}</p><hr style="margin:10px 0" />${failedList}</div>`,
          confirmButtonColor: "#1C352D",
        });

        if (saved.length > 0) {
          const failedIndexes = failed.map((item) => item.index);
          setCoupons((prev) => prev.filter((_, index) => failedIndexes.includes(index)));
          setActiveIndex(0);
        }
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Coupons saved",
        text: `${saved.length} coupon(s) saved successfully.`,
        confirmButtonColor: "#1C352D",
      });

      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.message || "Failed to save coupons.",
        confirmButtonColor: "#1C352D",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({ label, name, checked, onChange, icon: Icon, colorClass }) => (
    <label className="flex items-center justify-between p-4 border border-[var(--adm-border)] rounded-lg cursor-pointer hover:bg-[var(--adm-surface-alt)] transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className={checked ? colorClass : "text-[var(--adm-text-muted)]"} />
        <span className="text-[var(--adm-text-body)] font-semibold text-[13px]">{label}</span>
      </div>
      <div className="relative">
        <input type="checkbox" name={name} checked={checked} onChange={onChange} className="sr-only" />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? "bg-[var(--adm-forest)]" : "bg-[var(--adm-border)]"}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}></div>
      </div>
    </label>
  );

  // ─── DYNAMIC SEO SUGGESTIONS LOGIC ───
  const storeName = selectedStore ? selectedStore.name : "{Store Name}";
  const isDeal = activeCoupon.type === "deal";
  const xVal = activeCoupon.discountValue || "{X}";
  const discountStr =
    activeCoupon.discountType === "percent"
      ? `${xVal}%`
      : activeCoupon.discountType === "flat"
        ? `$${xVal}`
        : "Free Shipping";

  // SEO Families Logic applied to title generation
  const titleSuggestions =
    activeCoupon.discountType === "free_shipping"
      ? [
          `Free Shipping on Orders Over $50 at ${storeName}`,
          `Get Free Shipping at ${storeName}`,
          `${storeName} Promo Code: Free Shipping`,
        ]
      : [
          // Family 1: Verb-First
          `Get Up to ${discountStr} Off at ${storeName}`,
          `Save ${discountStr} Off Your Order With Code`,
          `Claim ${discountStr} Off Select Items`,
          // Family 2: Minimal
          `${discountStr} Off Select Orders`,
          // Family 3: Keyword Stacked
          `${storeName} Promo Code: Up to ${discountStr} Off`,
          // Family 4: Sale-Driven
          `End of Season Sale: Up to ${discountStr} Off`,
          // Family 5: Member/Status
          `${discountStr} Student Discount + Free Shipping`,
        ];

  const subtitleSuggestions = isDeal
    ? [
        `Shop ${storeName} and save up to ${discountStr} automatically — no code needed.`,
        `Activate this deal to enjoy ${discountStr} off your next purchase.`,
        `Shop the ${storeName} sale and save up to ${discountStr} on select styles. Limited time offer.`,
      ]
    : [
        `Apply this ${storeName} promo code at checkout and enjoy savings of up to ${discountStr}.`,
        `Take ${discountStr} off your purchase when you enter this code during checkout.`,
        `Score ${discountStr} off orders of $100 or more — just enter this code at checkout.`,
      ];

  const termsSuggestions = [
    "Valid on full-price items only. One use per customer/account. Cannot be combined with other promo codes.",
    "Excludes sale and clearance items. Minimum order required. See retailer site for full details.",
    "Online only. Not valid on gift cards, previous purchases, or select exclusions.",
    "Valid for new customers only. Minimum order of $50 required.",
    "Limited time offer. Applicable to select categories. Cannot be combined with other offers."
  ];

  return (
    <div className="min-h-screen bg-[var(--adm-bg,#F8F0E5)] text-[var(--adm-text-body,#16241F)] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[var(--adm-bg,#F8F0E5)]/95 backdrop-blur-md py-4 border-b border-[var(--adm-border,#E2D9CC)]">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/coupons"
                className="p-2 border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[var(--adm-text-body)] hover:bg-[var(--adm-surface-alt)] bg-[var(--adm-surface,#FFFFFF)] shadow-sm transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[var(--adm-text-title,#10201B)] leading-tight flex items-center gap-2">
                  <Tag size={24} className="text-[var(--adm-gold,#D9A441)]" /> Add Coupons
                </h1>
                <p className="text-[var(--adm-text-muted,#6B7280)] text-[14px]">
                  Fill core fields to unlock Smart SEO Templates for Titles, Subtitles, and Terms.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingRefs}
              className="flex items-center justify-center gap-2 bg-[var(--adm-forest,#1C352D)] hover:bg-[var(--adm-forest-hover,#10201B)] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save {coupons.length} Coupon(s)
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* ─── LEFT COLUMN: FORM SECTIONS ─── */}
            <div className="xl:col-span-8 space-y-6">
              {/* ══════════════════════════════════════════════════════════════
                  1. REQUIRED CORE DETAILS (TOP PRIORITY - RAPID ENTRY)
              ══════════════════════════════════════════════════════════════ */}
              <div className="bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-forest,#1C352D)]/20 rounded-xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--adm-border,#E2D9CC)] pb-4">
                  <h2 className="text-[17px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2">
                    <Zap size={20} className="text-[var(--adm-gold,#D9A441)]" /> Core Required Details
                  </h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--adm-forest,#1C352D)] bg-[var(--adm-badge-green-bg,#EBF3EE)] border border-[var(--adm-badge-green-border,#BDD6C4)] px-2.5 py-1 rounded-md">
                    Mandatory ({`Coupon #${activeIndex + 1}`})
                  </span>
                </div>

                {/* Store & Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Store <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                    </label>
                    <select
                      value={activeCoupon.storeId}
                      onChange={(e) =>
                        handleCouponChange("storeId", e.target.value)
                      }
                      required
                      disabled={isLoadingRefs}
                      className="w-full px-3 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border-[1.5px] border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] font-medium text-[var(--adm-text-body,#16241F)] outline-none focus:border-[var(--adm-forest,#1C352D)] disabled:opacity-60"
                    >
                      <option value="">
                        {isLoadingRefs ? "Loading stores..." : "Select Store"}
                      </option>
                      {stores.map((s) => {
                        const storeId = getDocId(s);
                        return (
                          <option key={storeId} value={storeId}>
                            {s.name}
                          </option>
                        );
                      })}
                    </select>
                    {selectedStore && (
                      <p className="mt-1 text-[11px] text-[var(--adm-forest,#1C352D)] font-semibold">
                        Linked: {selectedStore.name} (Auto-sync active)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5 flex items-center justify-between">
                      <span>
                        Primary Category <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                      </span>
                      {selectedCategory && selectedStore && (
                        <span className="text-[11px] text-[var(--adm-forest,#1C352D)] font-semibold">
                          Auto-set from store
                        </span>
                      )}
                    </label>
                    <select
                      value={activeCoupon.categoryId}
                      onChange={(e) =>
                        handleCouponChange("categoryId", e.target.value)
                      }
                      required
                      disabled={isLoadingRefs}
                      className="w-full px-3 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border-[1.5px] border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] font-medium text-[var(--adm-text-body,#16241F)] outline-none focus:border-[var(--adm-forest,#1C352D)] disabled:opacity-60"
                    >
                      <option value="">
                        {isLoadingRefs
                          ? "Loading categories..."
                          : "Select Category"}
                      </option>
                      {categories.map((category) => {
                        const categoryId = getDocId(category);
                        return (
                          <option key={categoryId} value={categoryId}>
                            {getCategoryLabel(category)}
                          </option>
                        );
                      })}
                    </select>
                    {selectedCategory && (
                      <p className="mt-1 text-[11px] text-[var(--adm-text-muted,#6B7280)] font-medium">
                        Active: {getCategoryLabel(selectedCategory)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Discount Type & Value - Moved up for better suggestion flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--adm-border,#E2D9CC)]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Discount Type <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                    </label>
                    <select
                      value={activeCoupon.discountType}
                      onChange={(e) =>
                        handleCouponChange("discountType", e.target.value)
                      }
                      required
                      className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Fixed Amount Off ($)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Discount Value{" "}
                      {activeCoupon.discountType !== "free_shipping" && (
                        <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                      )}
                    </label>
                    <input
                      type="number"
                      value={activeCoupon.discountValue}
                      onChange={(e) =>
                        handleCouponChange("discountValue", e.target.value)
                      }
                      placeholder={
                        activeCoupon.discountType === "percent"
                          ? "e.g. 30"
                          : activeCoupon.discountType === "flat"
                            ? "e.g. 15"
                            : "0 (Free Shipping)"
                      }
                      min="0"
                      max={
                        activeCoupon.discountType === "percent" ? "100" : undefined
                      }
                      step="0.01"
                      required={activeCoupon.discountType !== "free_shipping"}
                      disabled={activeCoupon.discountType === "free_shipping"}
                      className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none disabled:bg-[var(--adm-surface-sub,#F1E7D8)] disabled:text-[var(--adm-text-muted,#6B7280)] font-bold"
                    />
                  </div>
                </div>

                {/* Title */}
                <div className="pt-2">
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    Coupon Title <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={activeCoupon.title}
                    onChange={(e) =>
                      handleCouponChange("title", e.target.value)
                    }
                    placeholder="e.g. 30% Off All Electronics"
                    maxLength={180}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-border,#E2D9CC)] focus:border-[var(--adm-gold,#D9A441)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] outline-none transition-all font-bold"
                  />
                  <SuggestionChips 
                    suggestions={selectedStore || activeCoupon.discountValue ? titleSuggestions : []}
                    onSelect={(val) => handleCouponChange("title", val)}
                  />
                </div>

                {/* Store Deal Link (Auto-synced from selected store) */}
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <LinkIcon size={15} className="text-[var(--adm-forest,#1C352D)]" />
                      Store Deal Link (Affiliate / Destination URL){" "}
                      <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                    </span>
                    <span className="text-[11px] text-[var(--adm-text-muted,#6B7280)] font-normal">
                      Auto-synced from Store
                    </span>
                  </label>
                  <input
                    type="url"
                    value={activeCoupon.trackingLink}
                    onChange={(e) =>
                      handleCouponChange("trackingLink", e.target.value)
                    }
                    placeholder="https://www.store.com/deal?aff_id=123"
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border-[1.5px] border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] font-mono text-[var(--adm-forest,#1C352D)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                  />
                </div>

                {/* Type & Code Option */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase tracking-wider mb-1.5">
                      Type <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                    </label>
                    <div className="flex bg-[var(--adm-surface-sub,#F1E7D8)] p-1 rounded-lg border border-[var(--adm-border,#E2D9CC)]">
                      <button
                        type="button"
                        onClick={() => handleCouponChange("type", "coupon")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                          activeCoupon.type === "coupon"
                            ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm border border-[var(--adm-border,#E2D9CC)]"
                            : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-text-title,#10201B)]"
                        }`}
                      >
                        Coupon Code
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCouponChange("type", "deal")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                          activeCoupon.type === "deal"
                            ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm border border-[var(--adm-border,#E2D9CC)]"
                            : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-text-title,#10201B)]"
                        }`}
                      >
                        Codeless Deal
                      </button>
                    </div>
                  </div>

                  {activeCoupon.type === "coupon" ? (
                    <div>
                      <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase tracking-wider mb-1.5">
                        Code Behavior <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                      </label>
                      <div className="flex bg-[var(--adm-surface-sub,#F1E7D8)] p-1 rounded-lg border border-[var(--adm-border,#E2D9CC)]">
                        <button
                          type="button"
                          onClick={() =>
                            handleCouponChange("codeType", "public")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                            activeCoupon.codeType === "public"
                              ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm border border-[var(--adm-border,#E2D9CC)]"
                              : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-text-title,#10201B)]"
                          }`}
                        >
                          Show Code
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCouponChange("codeType", "auto_applied")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-all ${
                            activeCoupon.codeType === "auto_applied"
                              ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm border border-[var(--adm-border,#E2D9CC)]"
                              : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-text-title,#10201B)]"
                          }`}
                        >
                          Auto Apply
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-[12px] text-[var(--adm-text-muted,#6B7280)] italic p-3 bg-[var(--adm-surface-alt,#FDFBF7)] rounded-lg border border-[var(--adm-border,#E2D9CC)]">
                      No code required; discount activates automatically via affiliate tracking link.
                    </div>
                  )}
                </div>

                {/* Promo Code string (Mandatory when public coupon) */}
                {activeCoupon.type === "coupon" &&
                  activeCoupon.codeType === "public" && (
                    <div className="p-4 bg-[var(--adm-surface-sub,#F1E7D8)] border border-[var(--adm-gold,#D9A441)]/50 rounded-lg animate-in fade-in">
                      <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                        Promo Code <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeCoupon.code}
                        onChange={(e) =>
                          handleCouponChange("code", e.target.value)
                        }
                        placeholder="e.g. SAVE20"
                        required
                        className="w-full md:w-1/2 px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-gold,#D9A441)] rounded-lg text-[16px] font-mono font-bold text-[var(--adm-text-title,#10201B)] focus:outline-none uppercase tracking-wider"
                      />
                    </div>
                  )}
              </div>

              {/* ══════════════════════════════════════════════════════════════
                  OPTIONAL CONFIGURATIONS & ENHANCEMENTS
              ══════════════════════════════════════════════════════════════ */}
              <div className="flex items-center gap-3 my-6">
                <div className="h-px bg-[var(--adm-border,#E2D9CC)] flex-1" />
                <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--adm-text-title,#10201B)] bg-[var(--adm-surface-sub,#F1E7D8)] border border-[var(--adm-border,#E2D9CC)] px-3 py-1 rounded-full">
                  Optional Details &amp; Targeting
                </span>
                <div className="h-px bg-[var(--adm-border,#E2D9CC)] flex-1" />
              </div>

              {/* Editorial / Terms */}
              <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3">
                  <BookOpen size={18} className="text-[var(--adm-forest,#1C352D)]" /> Editorial Text &amp; Restrictions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Supporting Subtitle
                    </label>
                    <input
                      type="text"
                      value={activeCoupon.subtitle}
                      onChange={(e) =>
                        handleCouponChange("subtitle", e.target.value)
                      }
                      placeholder="e.g. No minimum spend required"
                      maxLength={250}
                      className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                    />
                    <SuggestionChips 
                      suggestions={selectedStore || activeCoupon.discountValue ? subtitleSuggestions : []}
                      onSelect={(val) => handleCouponChange("subtitle", val)}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Minimum Order Amount ($)
                    </label>
                    <input
                      type="number"
                      value={activeCoupon.minOrderValue}
                      onChange={(e) =>
                        handleCouponChange("minOrderValue", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                    />
                  </div>
                </div>

                {activeCoupon.discountType === "percent" && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                      Maximum Discount Limit ($)
                    </label>
                    <input
                      type="number"
                      value={activeCoupon.maxDiscountCap}
                      onChange={(e) =>
                        handleCouponChange("maxDiscountCap", e.target.value)
                      }
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50"
                      className="w-full md:w-1/2 px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    Terms &amp; Conditions
                  </label>
                  <textarea
                    value={activeCoupon.terms}
                    onChange={(e) =>
                      handleCouponChange("terms", e.target.value)
                    }
                    placeholder="e.g. Valid on orders above $50. Excludes clearance items."
                    rows={2}
                    maxLength={1000}
                    className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] text-[var(--adm-text-muted,#6B7280)] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-y"
                  />
                  <SuggestionChips 
                    suggestions={termsSuggestions}
                    onSelect={(val) => handleCouponChange("terms", val)}
                  />
                </div>
              </div>

              {/* Secondary Categories (Max 5) */}
              <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2">
                    <Layers size={18} className="text-[var(--adm-forest,#1C352D)]" /> Secondary Categories
                  </h2>
                  <span className="text-[10px] text-[var(--adm-forest,#1C352D)] bg-[var(--adm-badge-green-bg,#EBF3EE)] border border-[var(--adm-badge-green-border,#BDD6C4)] px-2 py-0.5 rounded font-bold">
                    {(activeCoupon.secondaryCategoryIds || []).length}/5 Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto border border-[var(--adm-border,#E2D9CC)] rounded-lg p-3 bg-[var(--adm-surface-alt,#FDFBF7)]">
                  {categories.map((cat) => {
                    const catId = getDocId(cat);
                    const isChecked = (
                      activeCoupon.secondaryCategoryIds || []
                    ).includes(catId);
                    return (
                      <label
                        key={catId}
                        className={`flex items-center gap-2 p-1.5 rounded-md border text-[12px] cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-[var(--adm-badge-green-bg,#EBF3EE)] border-[var(--adm-forest,#1C352D)] text-[var(--adm-forest,#1C352D)] font-bold"
                            : "bg-[var(--adm-surface,#FFFFFF)] border-[var(--adm-border,#E2D9CC)] text-[var(--adm-text-body,#16241F)] hover:bg-[var(--adm-surface-sub,#F1E7D8)]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSecondaryCategory(catId)}
                          className="accent-[var(--adm-forest,#1C352D)] rounded"
                        />
                        <span className="truncate">{cat.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Lifecycle & Geo */}
              <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3">
                  <Globe size={18} className="text-[var(--adm-forest,#1C352D)]" /> Lifecycle &amp; Regional Targeting
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={activeCoupon.status}
                      onChange={(e) =>
                        handleCouponChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] text-[var(--adm-text-body,#16241F)] outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase mb-1">
                      Target Country Code
                    </label>
                    <input
                      type="text"
                      value={activeCoupon.countryCode}
                      onChange={(e) =>
                        handleCouponChange("countryCode", e.target.value)
                      }
                      placeholder="GLOBAL, PK, US..."
                      maxLength={10}
                      className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] text-[var(--adm-text-body,#16241F)] outline-none uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase mb-1 flex items-center gap-1.5">
                      <Calendar size={14} /> Expiry Date (Auto: +2 Mos)
                    </label>
                    <input
                      type="datetime-local"
                      value={activeCoupon.expiryDate}
                      onChange={(e) =>
                        handleCouponChange("expiryDate", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] text-[var(--adm-text-body,#16241F)] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Badges & Trust Signals */}
              <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-3">
                <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3 mb-2">
                  <Sparkles size={18} className="text-[var(--adm-forest,#1C352D)]" /> Trust Badges &amp; Placement
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Toggle
                    label="Tested & Verified"
                    name="isVerified"
                    checked={activeCoupon.isVerified}
                    onChange={handleCheckboxChange}
                    icon={CheckCircle}
                    colorClass="text-[var(--adm-forest,#1C352D)]"
                  />
                  <Toggle
                    label="Exclusive Deal"
                    name="isExclusive"
                    checked={activeCoupon.isExclusive}
                    onChange={handleCheckboxChange}
                    icon={Sparkles}
                    colorClass="text-[var(--adm-gold,#D9A441)]"
                  />
                  <Toggle
                    label="Pin to Top"
                    name="isPinned"
                    checked={activeCoupon.isPinned}
                    onChange={handleCheckboxChange}
                    icon={Pin}
                    colorClass="text-[var(--adm-forest,#1C352D)]"
                  />
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: BATCH LIST DOCK ─── */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-border,#E2D9CC)] rounded-xl p-5 shadow-sm sticky top-24">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--adm-border,#E2D9CC)]">
                  <h2 className="text-[15px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2">
                    <Layers size={16} className="text-[var(--adm-gold,#D9A441)]" /> Coupon Batch
                  </h2>
                  <span className="bg-[var(--adm-badge-green-bg,#EBF3EE)] text-[var(--adm-forest,#1C352D)] border border-[var(--adm-badge-green-border,#BDD6C4)] text-[11px] font-bold px-2.5 py-0.5 rounded">
                    {coupons.length} In Draft
                  </span>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {coupons.map((c, i) => (
                    <div
                      key={c.tempId}
                      onClick={() => setActiveIndex(i)}
                      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
                        i === activeIndex
                          ? "bg-[var(--adm-surface-sub,#F1E7D8)] border-[var(--adm-forest,#1C352D)] shadow-sm"
                          : "bg-[var(--adm-surface-alt,#FDFBF7)] hover:bg-[var(--adm-surface-sub,#F1E7D8)] border-[var(--adm-border,#E2D9CC)]"
                      }`}
                    >
                      <div className="truncate pr-3 flex-1">
                        <span className="text-[var(--adm-text-title,#10201B)] text-[13px] font-bold truncate block">
                          {c.title || `Draft Coupon #${i + 1}`}
                        </span>
                        <span className="text-[11px] text-[var(--adm-text-muted,#6B7280)] font-mono font-medium">
                          {c.type.toUpperCase()} •{" "}
                          {c.discountType === "free_shipping"
                            ? "FREE SHIPPING"
                            : c.discountType === "percent"
                              ? `${c.discountValue || 0}% OFF`
                              : `$${c.discountValue || 0} OFF`}
                        </span>
                      </div>

                      {coupons.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCouponFromBatch(i);
                          }}
                          className="p-1.5 rounded-md hover:bg-[var(--adm-badge-red-bg,#FAF0EC)] text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-badge-red-text,#C1432F)] transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={addCouponToBatch}
                    className="w-full flex items-center justify-center gap-1.5 bg-[var(--adm-surface-alt,#FDFBF7)] hover:bg-[var(--adm-surface-sub,#F1E7D8)] text-[var(--adm-text-title,#10201B)] py-2.5 rounded-lg text-[13px] font-bold transition-all border border-[var(--adm-border,#E2D9CC)]"
                  >
                    <PlusCircle size={15} className="text-[var(--adm-forest,#1C352D)]" /> Add Draft
                  </button>
                  <button
                    type="button"
                    onClick={duplicateActiveCoupon}
                    className="w-full flex items-center justify-center gap-1.5 bg-[var(--adm-surface-alt,#FDFBF7)] hover:bg-[var(--adm-surface-sub,#F1E7D8)] text-[var(--adm-text-title,#10201B)] py-2.5 rounded-lg text-[13px] font-bold transition-all border border-[var(--adm-border,#E2D9CC)]"
                  >
                    <Copy size={15} className="text-[var(--adm-forest,#1C352D)]" /> Copy Active
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--adm-border,#E2D9CC)] text-[11.5px] text-[var(--adm-text-muted,#6B7280)] flex items-center gap-2">
                  <CheckCircle size={14} className="text-[var(--adm-forest,#1C352D)] shrink-0" />
                  <span>Category, Deal Link &amp; Expiry pre-filled.</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkCouponEditor;