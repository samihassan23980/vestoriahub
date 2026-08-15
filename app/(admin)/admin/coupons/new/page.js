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
  Info,
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
} from "lucide-react";

const BulkCouponEditor = () => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  const emptyCoupon = {
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
    expiryDate: "",
    isVerified: false,
    isExclusive: false,
    isPinned: false,
    countryCode: "GLOBAL",
    sortOrder: 1000,
    storeId: "",
    categoryId: "",
    secondaryCategoryIds: [],
  };

  const [coupons, setCoupons] = useState([
    { ...emptyCoupon, tempId: Date.now() },
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

  const getDocId = (doc) => doc?._id || doc?.id || "";

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

      if (!storesRes.ok) {
        throw new Error(storesData?.error || "Failed to load stores.");
      }

      if (!categoriesRes.ok || categoriesData?.success === false) {
        throw new Error(
          categoriesData?.details ||
            categoriesData?.error ||
            "Failed to load categories.",
        );
      }

      const normalizedStores = getArrayFromApi(storesData, ["stores", "store"]);

      const normalizedCategories = getArrayFromApi(categoriesData, [
        "categories",
        "category",
      ])
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
      setCategories(
        Array.isArray(normalizedCategories) ? normalizedCategories : [],
      );
    } catch (error) {
      console.error("Reference data error:", error);

      Swal.fire({
        icon: "error",
        title: "Reference data failed",
        text:
          error.message ||
          "Stores or categories could not be loaded. Please try again.",
        confirmButtonColor: "#2D2380",
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

  const addCouponToBatch = () => {
    const newCoupon = {
      ...emptyCoupon,
      tempId: Date.now() + Math.random(),
      storeId: activeCoupon?.storeId || "",
      categoryId: activeCoupon?.categoryId || "",
      secondaryCategoryIds: activeCoupon?.secondaryCategoryIds || [],
      countryCode: activeCoupon?.countryCode || "GLOBAL",
      status: activeCoupon?.status || "active",
    };

    setCoupons((prev) => [...prev, newCoupon]);
    setActiveIndex(coupons.length);

    Toast.fire({
      icon: "success",
      title: "New coupon draft added",
    });
  };

  const duplicateActiveCoupon = () => {
    const clonedCoupon = {
      ...activeCoupon,
      tempId: Date.now() + Math.random(),
      title: activeCoupon.title ? `${activeCoupon.title} Copy` : "",
    };

    setCoupons((prev) => [...prev, clonedCoupon]);
    setActiveIndex(coupons.length);

    Toast.fire({
      icon: "success",
      title: "Coupon duplicated",
    });
  };

  const removeCouponFromBatch = async (indexToRemove) => {
    if (coupons.length === 1) {
      Toast.fire({
        icon: "warning",
        title: "At least one coupon is required",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Remove this draft?",
      text: "This only removes it from the current list.",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#7775A0",
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

    if (!coupon.title.trim()) return `${label}: Coupon title is required.`;
    if (coupon.title.length > 180)
      return `${label}: Coupon title cannot be more than 180 characters.`;

    if (coupon.subtitle.length > 250)
      return `${label}: Subtitle cannot be more than 250 characters.`;

    if (coupon.terms.length > 1000)
      return `${label}: Terms cannot be more than 1000 characters.`;

    if (!coupon.trackingLink.trim())
      return `${label}: Store deal link is required.`;

    if (!isValidUrl(coupon.trackingLink))
      return `${label}: Store deal link must be a valid http or https URL.`;

    if (!coupon.storeId) return `${label}: Store is required.`;
    if (!coupon.categoryId) return `${label}: Primary category is required.`;

    if (!["coupon", "deal"].includes(coupon.type))
      return `${label}: Invalid coupon type.`;

    if (!["public", "auto_applied"].includes(coupon.codeType))
      return `${label}: Invalid code option.`;

    if (
      coupon.type === "coupon" &&
      coupon.codeType === "public" &&
      !coupon.code.trim()
    ) {
      return `${label}: Promo code is required when code is shown to users.`;
    }

    if (!["percent", "flat", "free_shipping"].includes(coupon.discountType)) {
      return `${label}: Invalid discount type.`;
    }

    const discountValue = normalizeNumber(coupon.discountValue, 0);

    if (coupon.discountType !== "free_shipping" && discountValue <= 0) {
      return `${label}: Discount value must be greater than 0.`;
    }

    if (coupon.discountType === "percent" && discountValue > 100) {
      return `${label}: Percentage discount cannot be more than 100.`;
    }

    if (normalizeNumber(coupon.minOrderValue, 0) < 0) {
      return `${label}: Minimum order amount cannot be negative.`;
    }

    if (
      coupon.maxDiscountCap !== "" &&
      coupon.maxDiscountCap !== null &&
      normalizeNumber(coupon.maxDiscountCap, 0) < 0
    ) {
      return `${label}: Maximum discount limit cannot be negative.`;
    }

    if (!["active", "expired", "inactive"].includes(coupon.status)) {
      return `${label}: Invalid status.`;
    }

    if (
      Array.isArray(coupon.secondaryCategoryIds) &&
      coupon.secondaryCategoryIds.length > 5
    ) {
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
      code:
        coupon.type === "coupon" && coupon.codeType === "public"
          ? coupon.code.trim().toUpperCase()
          : "",

      discountType: coupon.discountType,
      discountValue:
        coupon.discountType === "free_shipping"
          ? 0
          : normalizeNumber(coupon.discountValue, 0),

      maxDiscountCap:
        coupon.discountType === "percent" && coupon.maxDiscountCap !== ""
          ? normalizeNumber(coupon.maxDiscountCap, null)
          : null,

      minOrderValue: normalizeNumber(coupon.minOrderValue, 0),

      expiryDate: coupon.expiryDate || null,
      status: coupon.status,

      isVerified: Boolean(coupon.isVerified),
      isExclusive: Boolean(coupon.isExclusive),
      isPinned: Boolean(coupon.isPinned),

      countryCode: coupon.countryCode || "GLOBAL",
      sortOrder: normalizeNumber(coupon.sortOrder, 1000),

      storeId: coupon.storeId,
      categoryId: coupon.categoryId,
      secondaryCategoryIds: Array.isArray(coupon.secondaryCategoryIds)
        ? coupon.secondaryCategoryIds.filter(Boolean)
        : [],
    };
  };

  const submitOneCoupon = async (payload) => {
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to save coupon.");
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
          confirmButtonColor: "#2D2380",
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
      confirmButtonColor: "#FF6B35",
      cancelButtonColor: "#7775A0",
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
        const failedList = failed
          .map((item) => `• ${item.title}: ${item.error}`)
          .join("<br/>");

        Swal.fire({
          icon: saved.length > 0 ? "warning" : "error",
          title:
            saved.length > 0
              ? "Some coupons were saved"
              : "Coupons were not saved",
          html: `
            <div style="text-align:left">
              <p><b>Saved:</b> ${saved.length}</p>
              <p><b>Failed:</b> ${failed.length}</p>
              <hr style="margin:10px 0" />
              ${failedList}
            </div>
          `,
          confirmButtonColor: "#2D2380",
        });

        if (saved.length > 0) {
          const failedIndexes = failed.map((item) => item.index);
          setCoupons((prev) =>
            prev.filter((_, index) => failedIndexes.includes(index)),
          );
          setActiveIndex(0);
        }

        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Coupons saved",
        text: `${saved.length} coupon(s) saved successfully.`,
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);

      Swal.fire({
        icon: "error",
        title: "Something went wrong",
        text: error.message || "Failed to save coupons.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({
    label,
    name,
    checked,
    onChange,
    icon: Icon,
    colorClass,
  }) => (
    <label className="flex items-center justify-between p-4 border border-[#E0DEF5] rounded-lg cursor-pointer hover:bg-[#F7F6FF] transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className={checked ? colorClass : "text-[#7775A0]"} />
        <span className="text-[#1A1340] font-semibold text-[13px]">
          {label}
        </span>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div
          className={`block w-10 h-6 rounded-full transition-colors ${
            checked ? "bg-[#2D2380]" : "bg-[#E0DEF5]"
          }`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        ></div>
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/coupons"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] bg-white shadow-sm transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  Add Coupons
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Add one or more coupons at the same time. You are editing{" "}
                  {coupons.length} coupon(s).
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingRefs}
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 disabled:opacity-50"
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
            <div className="xl:col-span-8 space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F4A836]"></div>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Info size={18} className="text-[#2D2380]" />
                  Coupon Details (Coupon #{activeIndex + 1})
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Coupon Title <span className="text-[#E24B4A]">*</span>
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
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                  <p className="mt-1 text-[11px] text-[#7775A0]">
                    {activeCoupon.title.length}/180 characters
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Short Description{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={activeCoupon.subtitle}
                    onChange={(e) =>
                      handleCouponChange("subtitle", e.target.value)
                    }
                    placeholder="e.g. No minimum order required"
                    maxLength={250}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Terms & Conditions{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={activeCoupon.terms}
                    onChange={(e) =>
                      handleCouponChange("terms", e.target.value)
                    }
                    placeholder="e.g. Valid on orders above $50. Excludes sale items."
                    rows={2}
                    maxLength={1000}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] text-[#7775A0] focus:border-[#2D2380] outline-none resize-y"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-6">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Tag size={18} className="text-[#2D2380]" /> Coupon Settings
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-bold text-[#7775A0] uppercase tracking-wider mb-2">
                      Coupon Type
                    </label>
                    <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                      <button
                        type="button"
                        onClick={() => handleCouponChange("type", "coupon")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                          activeCoupon.type === "coupon"
                            ? "bg-white text-[#2D2380] shadow-sm"
                            : "text-[#7775A0] hover:text-[#1A1340]"
                        }`}
                      >
                        Coupon Code
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCouponChange("type", "deal")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                          activeCoupon.type === "deal"
                            ? "bg-white text-[#2D2380] shadow-sm"
                            : "text-[#7775A0] hover:text-[#1A1340]"
                        }`}
                      >
                        No Code Deal
                      </button>
                    </div>
                  </div>

                  {activeCoupon.type === "coupon" && (
                    <div>
                      <label className="block text-[12px] font-bold text-[#7775A0] uppercase tracking-wider mb-2">
                        Code Option
                      </label>
                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        <button
                          type="button"
                          onClick={() =>
                            handleCouponChange("codeType", "public")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                            activeCoupon.codeType === "public"
                              ? "bg-white text-[#2D2380] shadow-sm"
                              : "text-[#7775A0] hover:text-[#1A1340]"
                          }`}
                        >
                          Show Code to User
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCouponChange("codeType", "auto_applied")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                            activeCoupon.codeType === "auto_applied"
                              ? "bg-white text-[#2D2380] shadow-sm"
                              : "text-[#7775A0] hover:text-[#1A1340]"
                          }`}
                        >
                          Apply Automatically
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {activeCoupon.type === "coupon" &&
                  activeCoupon.codeType === "public" && (
                    <div className="p-4 bg-[#FAEEDA]/30 border border-[#F4A836]/30 rounded-lg">
                      <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                        Promo Code <span className="text-[#E24B4A]">*</span>
                      </label>
                      <input
                        type="text"
                        value={activeCoupon.code}
                        onChange={(e) =>
                          handleCouponChange("code", e.target.value)
                        }
                        placeholder="e.g. SAVE20"
                        required
                        className="w-full md:w-1/2 px-4 py-2.5 bg-white border-[1.5px] border-[#F4A836] rounded-lg text-[16px] font-mono font-bold text-[#F4A836] focus:outline-none uppercase"
                      />
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E0DEF5]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Discount Type
                    </label>
                    <select
                      value={activeCoupon.discountType}
                      onChange={(e) =>
                        handleCouponChange("discountType", e.target.value)
                      }
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Fixed Amount ($)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Discount Value
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
                          : "e.g. 15"
                      }
                      min="0"
                      max={
                        activeCoupon.discountType === "percent"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      required={activeCoupon.discountType !== "free_shipping"}
                      disabled={activeCoupon.discountType === "free_shipping"}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none disabled:bg-[#F7F6FF] disabled:text-[#7775A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Minimum Order Amount
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
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>

                {activeCoupon.discountType === "percent" && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Maximum Discount Limit ($){" "}
                      <span className="text-[#7775A0] font-normal">
                        (Optional)
                      </span>
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
                      className="w-full md:w-1/3 px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
                <label className="block text-[14px] font-bold text-[#1A1340] mb-2 flex items-center gap-2">
                  <LinkIcon size={16} className="text-[#2D2380]" />
                  Store Deal Link <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  type="url"
                  value={activeCoupon.trackingLink}
                  onChange={(e) =>
                    handleCouponChange("trackingLink", e.target.value)
                  }
                  placeholder="https://www.store.com/deal?aff_id=123"
                  required
                  className="w-full px-4 py-3 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                />
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="bg-[#1A1340] border border-[#2D2380] rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(255,255,255,0.1)]">
                  <h2 className="text-[14px] font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-[#F4A836]" /> Coupon List
                  </h2>
                  <span className="bg-[#F4A836] text-[#1A1340] text-[11px] font-bold px-2 py-0.5 rounded">
                    {coupons.length} Items
                  </span>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {coupons.map((c, i) => (
                    <div
                      key={c.tempId}
                      onClick={() => setActiveIndex(i)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        i === activeIndex
                          ? "bg-[#2D2380] border border-[#4A3DBF]"
                          : "bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-transparent"
                      }`}
                    >
                      <div className="truncate pr-3 flex-1">
                        <span className="text-white text-[12px] font-bold truncate block">
                          {c.title || `Draft Coupon #${i + 1}`}
                        </span>
                        <span className="text-[10px] text-[#A09EC0] font-mono">
                          {c.type.toUpperCase()} •{" "}
                          {c.discountType === "free_shipping"
                            ? "FREE SHIPPING"
                            : c.discountType === "percent"
                              ? `${c.discountValue || 0}%`
                              : `$${c.discountValue || 0}`}
                        </span>
                      </div>

                      {coupons.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCouponFromBatch(i);
                          }}
                          className={`p-1.5 rounded-md hover:bg-[#E24B4A] text-[#A09EC0] hover:text-white transition-colors ${
                            i === activeIndex
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button
                    type="button"
                    onClick={addCouponToBatch}
                    className="w-full flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white py-2.5 rounded-lg text-[13px] font-bold transition-all border border-dashed border-[rgba(255,255,255,0.3)]"
                  >
                    <PlusCircle size={16} className="text-[#F4A836]" /> Add
                    Another
                  </button>
                  <button
                    type="button"
                    onClick={duplicateActiveCoupon}
                    className="w-full flex items-center justify-center gap-2 bg-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.2)] text-white py-2.5 rounded-lg text-[13px] font-bold transition-all border border-dashed border-[rgba(255,255,255,0.3)]"
                  >
                    <Copy size={16} className="text-[#F4A836]" /> Copy Coupon
                  </button>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Store size={18} className="text-[#2D2380]" /> Store &
                  Category
                </h2>

                {isLoadingRefs && (
                  <div className="flex items-center gap-2 text-[#7775A0] text-[13px] font-semibold">
                    <Loader2 size={15} className="animate-spin" />
                    Loading stores and categories...
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase tracking-wider mb-1.5">
                    Store <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    value={activeCoupon.storeId}
                    onChange={(e) =>
                      handleCouponChange("storeId", e.target.value)
                    }
                    required
                    disabled={isLoadingRefs}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] outline-none disabled:opacity-60"
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
                    <p className="mt-1 text-[11px] text-[#7775A0]">
                      Selected: {selectedStore.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase tracking-wider mb-1.5">
                    Primary Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    value={activeCoupon.categoryId}
                    onChange={(e) =>
                      handleCouponChange("categoryId", e.target.value)
                    }
                    required
                    disabled={isLoadingRefs}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] outline-none disabled:opacity-60"
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
                    <p className="mt-1 text-[11px] text-[#7775A0]">
                      Selected: {getCategoryLabel(selectedCategory)}
                    </p>
                  )}

                  {!isLoadingRefs && categories.length === 0 && (
                    <p className="mt-1 text-[11px] text-[#E24B4A] font-semibold">
                      No active categories found. Please create an active
                      category first.
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Globe size={18} className="text-[#2D2380]" /> Status &
                  Targeting
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1">
                      Status
                    </label>
                    <select
                      value={activeCoupon.status}
                      onChange={(e) =>
                        handleCouponChange("status", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="expired">Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1">
                      Region
                    </label>
                    <select
                      value={activeCoupon.countryCode}
                      onChange={(e) =>
                        handleCouponChange("countryCode", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    >
                      <option value="GLOBAL">Global</option>
                      <option value="PK">Pakistan</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="IN">India</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="AE">UAE</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1 flex items-center gap-1.5">
                    <Calendar size={14} /> Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    value={activeCoupon.expiryDate}
                    onChange={(e) =>
                      handleCouponChange("expiryDate", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={activeCoupon.sortOrder}
                    onChange={(e) =>
                      handleCouponChange("sortOrder", e.target.value)
                    }
                    min="0"
                    step="1"
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-3">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Sparkles size={18} className="text-[#2D2380]" /> Badges &
                  Priority
                </h2>
                <Toggle
                  label="Tested and Working"
                  name="isVerified"
                  checked={activeCoupon.isVerified}
                  onChange={handleCheckboxChange}
                  icon={CheckCircle}
                  colorClass="text-[#22B07D]"
                />
                <Toggle
                  label="Exclusive Deal"
                  name="isExclusive"
                  checked={activeCoupon.isExclusive}
                  onChange={handleCheckboxChange}
                  icon={Sparkles}
                  colorClass="text-[#F4A836]"
                />
                <Toggle
                  label="Show First"
                  name="isPinned"
                  checked={activeCoupon.isPinned}
                  onChange={handleCheckboxChange}
                  icon={Pin}
                  colorClass="text-[#2D2380]"
                />
              </div>

              <div className="bg-[#FAEEDA]/50 border border-[#F4A836]/40 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle
                  size={18}
                  className="text-[#F4A836] shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-[#1A1340] leading-relaxed">
                  This page saves each coupon one by one using the existing
                  coupon API. If one coupon has an error, the correct coupons
                  will still be saved. Only the failed coupon will stay here for
                  fixing.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              How to Add Coupons
            </h2>
          </div>

          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            Use this page to add one coupon or many coupons at once. Fill the
            form, click "Add Another" to add more coupons, then save everything
            together.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <Layers size={16} /> How the Coupon List Works
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                The dark box on the right shows all coupons you are adding.
                Click <b>Add Another</b> to create one more coupon. The new
                coupon will copy the same Store and Category, so you do not need
                to select them again.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Why Category Is Required
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Every coupon needs a Primary Category. This helps users find
                coupons by category, and it also helps your category pages show
                the right offers.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Coupon Code vs. No Code Deal
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">Coupon Code:</span>{" "}
                Use this when the user needs to copy a code like SAVE20. <br />
                <span className="font-semibold text-white">
                  No Code Deal:
                </span>{" "}
                Use this when the discount works directly from the store link.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Discount Value
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                For percentage discounts, enter a number like 30 for 30% off.
                For fixed discounts, enter the amount. Free Shipping sets the
                value to 0 automatically.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Expiry Date
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Add an expiry date if the coupon has one. Expired coupons should
                be marked as expired, not deleted, so your old data stays safe.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkCouponEditor;
