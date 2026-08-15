/* app/(admin)/admin/coupons/[id]/page.js */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Tag,
  Link as LinkIcon,
  Info,
  Settings,
  Globe,
  Calendar,
  CheckCircle,
  Sparkles,
  Pin,
  Loader2,
} from "lucide-react";

const CouponEditor = () => {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.id;

  const [loading, setLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
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

  const formatDateTimeLocal = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const pad = (num) => String(num).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const selectedStore = useMemo(
    () => stores.find((store) => getDocId(store) === formData.storeId),
    [stores, formData.storeId],
  );

  const selectedCategory = useMemo(
    () =>
      categories.find((category) => getDocId(category) === formData.categoryId),
    [categories, formData.categoryId],
  );

  useEffect(() => {
    fetchReferenceData();
  }, []);

  useEffect(() => {
    if (couponId) fetchCoupon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponId]);

  const fetchReferenceData = async () => {
    try {
      setLoadingRefs(true);

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
        title: "Data Load Failed",
        text:
          error.message ||
          "Stores or categories could not be loaded. Please try again.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setLoadingRefs(false);
    }
  };

  const fetchCoupon = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || "Failed to load coupon.");
      }

      const coupon =
        result?.coupon || result?.data?.coupon || result?.data || result;

      setFormData({
        title: coupon?.title || "",
        subtitle: coupon?.subtitle || "",
        terms: coupon?.terms || "",
        trackingLink: coupon?.trackingLink || "",
        type: coupon?.type || "coupon",
        codeType: coupon?.codeType || "public",
        code: coupon?.code || "",
        discountType: coupon?.discountType || "percent",
        discountValue:
          coupon?.discountValue === 0 || coupon?.discountValue
            ? String(coupon.discountValue)
            : "",
        maxDiscountCap:
          coupon?.maxDiscountCap === 0 || coupon?.maxDiscountCap
            ? String(coupon.maxDiscountCap)
            : "",
        minOrderValue:
          coupon?.minOrderValue === 0 || coupon?.minOrderValue
            ? String(coupon.minOrderValue)
            : "",
        status: coupon?.status || "active",
        expiryDate: formatDateTimeLocal(coupon?.expiryDate),
        isVerified: Boolean(coupon?.isVerified),
        isExclusive: Boolean(coupon?.isExclusive),
        isPinned: Boolean(coupon?.isPinned),
        countryCode: coupon?.countryCode || "GLOBAL",
        sortOrder:
          coupon?.sortOrder === 0 || coupon?.sortOrder
            ? String(coupon.sortOrder)
            : "1000",
        storeId:
          typeof coupon?.storeId === "object"
            ? getDocId(coupon.storeId)
            : coupon?.storeId || "",
        categoryId:
          typeof coupon?.categoryId === "object"
            ? getDocId(coupon.categoryId)
            : coupon?.categoryId || "",
        secondaryCategoryIds: Array.isArray(coupon?.secondaryCategoryIds)
          ? coupon.secondaryCategoryIds.map((item) =>
              typeof item === "object" ? getDocId(item) : item,
            )
          : [],
      });
    } catch (error) {
      console.error("Coupon fetch error:", error);

      Swal.fire({
        icon: "error",
        title: "Coupon Load Failed",
        text: error.message || "Coupon could not be loaded.",
        confirmButtonColor: "#2D2380",
      }).then(() => {
        router.push("/admin/coupons");
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartChange = (
    name,
    value,
    inputType = "text",
    checked = false,
  ) => {
    const finalValue = inputType === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: finalValue,
      };

      if (name === "type" && finalValue === "deal") {
        updated.code = "";
        updated.codeType = "auto_applied";
      }

      if (name === "type" && finalValue === "coupon" && !updated.codeType) {
        updated.codeType = "public";
      }

      if (name === "codeType" && finalValue === "auto_applied") {
        updated.code = "";
      }

      if (name === "discountType" && finalValue === "free_shipping") {
        updated.discountValue = 0;
        updated.maxDiscountCap = "";
      }

      if (name === "discountType" && finalValue !== "percent") {
        updated.maxDiscountCap = "";
      }

      if (name === "code") {
        updated.code = String(finalValue || "").toUpperCase();
      }

      if (name === "countryCode") {
        updated.countryCode = String(finalValue || "GLOBAL").toUpperCase();
      }

      return updated;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    handleSmartChange(name, value, type, checked);
  };

  const validateCoupon = () => {
    if (!formData.title.trim()) return "Coupon title is required.";
    if (formData.title.length > 180)
      return "Coupon title cannot be more than 180 characters.";

    if (formData.subtitle.length > 250)
      return "Short description cannot be more than 250 characters.";

    if (formData.terms.length > 1000)
      return "Terms cannot be more than 1000 characters.";

    if (!formData.trackingLink.trim()) return "Store deal link is required.";

    if (!isValidUrl(formData.trackingLink))
      return "Store deal link must be a valid http or https URL.";

    if (!formData.storeId) return "Store is required.";
    if (!formData.categoryId) return "Primary category is required.";

    if (!["coupon", "deal"].includes(formData.type))
      return "Invalid coupon type.";

    if (!["public", "auto_applied"].includes(formData.codeType))
      return "Invalid code option.";

    if (
      formData.type === "coupon" &&
      formData.codeType === "public" &&
      !formData.code.trim()
    ) {
      return "Promo code is required when code is shown to users.";
    }

    if (!["percent", "flat", "free_shipping"].includes(formData.discountType)) {
      return "Invalid discount type.";
    }

    const discountValue = normalizeNumber(formData.discountValue, 0);

    if (formData.discountType !== "free_shipping" && discountValue <= 0) {
      return "Discount value must be greater than 0.";
    }

    if (formData.discountType === "percent" && discountValue > 100) {
      return "Percentage discount cannot be more than 100.";
    }

    if (normalizeNumber(formData.minOrderValue, 0) < 0) {
      return "Minimum order amount cannot be negative.";
    }

    if (
      formData.maxDiscountCap !== "" &&
      formData.maxDiscountCap !== null &&
      normalizeNumber(formData.maxDiscountCap, 0) < 0
    ) {
      return "Maximum discount limit cannot be negative.";
    }

    if (!["active", "expired", "inactive"].includes(formData.status)) {
      return "Invalid status.";
    }

    if (
      Array.isArray(formData.secondaryCategoryIds) &&
      formData.secondaryCategoryIds.length > 5
    ) {
      return "Secondary categories cannot be more than 5.";
    }

    return "";
  };

  const buildPayload = () => {
    return {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim(),
      terms: formData.terms.trim(),

      trackingLink: formData.trackingLink.trim(),

      type: formData.type,
      codeType: formData.type === "deal" ? "auto_applied" : formData.codeType,
      code:
        formData.type === "coupon" && formData.codeType === "public"
          ? formData.code.trim().toUpperCase()
          : "",

      discountType: formData.discountType,
      discountValue:
        formData.discountType === "free_shipping"
          ? 0
          : normalizeNumber(formData.discountValue, 0),

      maxDiscountCap:
        formData.discountType === "percent" && formData.maxDiscountCap !== ""
          ? normalizeNumber(formData.maxDiscountCap, null)
          : null,

      minOrderValue: normalizeNumber(formData.minOrderValue, 0),

      expiryDate: formData.expiryDate || null,
      status: formData.status,

      isVerified: Boolean(formData.isVerified),
      isExclusive: Boolean(formData.isExclusive),
      isPinned: Boolean(formData.isPinned),

      countryCode: formData.countryCode || "GLOBAL",
      sortOrder: normalizeNumber(formData.sortOrder, 1000),

      storeId: formData.storeId,
      categoryId: formData.categoryId,
      secondaryCategoryIds: Array.isArray(formData.secondaryCategoryIds)
        ? formData.secondaryCategoryIds.filter(Boolean)
        : [],
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateCoupon();

    if (validationError) {
      Swal.fire({
        icon: "error",
        title: "Please fix this coupon",
        text: validationError,
        confirmButtonColor: "#2D2380",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Save changes?",
      text: "This will update the coupon.",
      showCancelButton: true,
      confirmButtonText: "Save changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#FF6B35",
      cancelButtonColor: "#7775A0",
    });

    if (!result.isConfirmed) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update coupon.");
      }

      await Swal.fire({
        icon: "success",
        title: "Coupon updated",
        text: "Coupon saved successfully.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      console.error("Coupon update error:", error);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error.message || "Coupon could not be updated.",
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
        <span className="text-[#1A1340] font-semibold text-[14px]">
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
          className={`block w-10 h-6 rounded-full transition-colors ${checked ? "bg-[#2D2380]" : "bg-[#E0DEF5]"}`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        ></div>
      </div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#7775A0] font-semibold">
          <Loader2 size={22} className="animate-spin text-[#2D2380]" />
          Loading coupon...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/coupons"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight">
                  Edit Coupon
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Update coupon details, store link, category, badges, and
                  status.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || loadingRefs}
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>

          {/* ─── FORM GRID ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN (Main Data) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Display Content Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Info size={18} className="text-[#2D2380]" />
                  Coupon Details
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Coupon Title <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. 30% Off All Electronics"
                    maxLength={180}
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-1 focus:ring-[#2D2380] outline-none transition-all"
                  />
                  <p className="mt-1 text-[11px] text-[#7775A0]">
                    {formData.title.length}/180 characters
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
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="e.g. No minimum order required"
                    maxLength={250}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-1 focus:ring-[#2D2380] outline-none transition-all"
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
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    placeholder="e.g. Valid on orders above $50. Excludes sale items."
                    rows={3}
                    maxLength={1000}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-1 focus:ring-[#2D2380] outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Mechanics & Values Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-6">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Tag size={18} className="text-[#2D2380]" />
                  Coupon Settings
                </h2>

                {/* Classification Type Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                      Coupon Type
                    </label>
                    <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                      <button
                        type="button"
                        onClick={() => handleSmartChange("type", "coupon")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${formData.type === "coupon" ? "bg-white text-[#2D2380] shadow-sm" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                      >
                        Coupon Code
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSmartChange("type", "deal")}
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${formData.type === "deal" ? "bg-white text-[#2D2380] shadow-sm" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                      >
                        No Code Deal
                      </button>
                    </div>
                  </div>

                  {formData.type === "coupon" && (
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                        Code Option
                      </label>
                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSmartChange("codeType", "public")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${formData.codeType === "public" ? "bg-white text-[#2D2380] shadow-sm" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                        >
                          Show Code to User
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSmartChange("codeType", "auto_applied")
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${formData.codeType === "auto_applied" ? "bg-white text-[#2D2380] shadow-sm" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                        >
                          Apply Automatically
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conditional Code Input */}
                {formData.type === "coupon" &&
                  formData.codeType === "public" && (
                    <div>
                      <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                        Promo Code <span className="text-[#E24B4A]">*</span>
                      </label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g. SAVE20"
                        style={{ textTransform: "uppercase" }}
                        required
                        className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[16px] font-mono font-bold text-[#F4A836] focus:border-[#F4A836] focus:ring-1 focus:ring-[#F4A836] outline-none transition-all uppercase"
                      />
                    </div>
                  )}

                {/* Discount Setup */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E0DEF5]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Discount Type
                    </label>
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
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
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder={
                        formData.discountType === "percent"
                          ? "e.g. 30"
                          : "e.g. 15"
                      }
                      min="0"
                      max={
                        formData.discountType === "percent" ? "100" : undefined
                      }
                      step="0.01"
                      required={formData.discountType !== "free_shipping"}
                      disabled={formData.discountType === "free_shipping"}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all disabled:bg-[#F7F6FF] disabled:text-[#7775A0]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Minimum Order Amount
                    </label>
                    <input
                      type="number"
                      name="minOrderValue"
                      value={formData.minOrderValue}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Conditional Max Cap */}
                {formData.discountType === "percent" && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Maximum Discount Limit ($){" "}
                      <span className="text-[#7775A0] font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="number"
                      name="maxDiscountCap"
                      value={formData.maxDiscountCap}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50"
                      className="w-full md:w-1/3 px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Tracking Link Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
                <label className="block text-[14px] font-bold text-[#1A1340] mb-2 flex items-center gap-2">
                  <LinkIcon size={16} className="text-[#2D2380]" />
                  Store Deal Link <span className="text-[#E24B4A]">*</span>
                </label>
                <p className="text-[#7775A0] text-[13px] mb-3">
                  Add the final store or affiliate link where users should go.
                </p>
                <input
                  type="url"
                  name="trackingLink"
                  value={formData.trackingLink}
                  onChange={handleChange}
                  placeholder="https://www.store.com/deal?aff_id=123"
                  required
                  className="w-full px-4 py-3 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-1 focus:ring-[#2D2380] outline-none transition-all"
                />
              </div>
            </div>

            {/* RIGHT COLUMN (Settings & Relations) */}
            <div className="space-y-6">
              {/* Relations Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Settings size={18} className="text-[#2D2380]" />
                  Organization
                </h2>

                {loadingRefs && (
                  <div className="flex items-center gap-2 text-[#7775A0] text-[13px] font-semibold">
                    <Loader2 size={15} className="animate-spin" />
                    Loading stores and categories...
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Store <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleChange}
                    required
                    disabled={loadingRefs}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {loadingRefs ? "Loading stores..." : "Select Store"}
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
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Primary Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    disabled={loadingRefs}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none disabled:opacity-60"
                  >
                    <option value="">
                      {loadingRefs
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>
                    {categories.map((c) => {
                      const categoryId = getDocId(c);

                      return (
                        <option key={categoryId} value={categoryId}>
                          {getCategoryLabel(c)}
                        </option>
                      );
                    })}
                  </select>

                  {selectedCategory && (
                    <p className="mt-1 text-[11px] text-[#7775A0]">
                      Selected: {getCategoryLabel(selectedCategory)}
                    </p>
                  )}

                  {!loadingRefs && categories.length === 0 && (
                    <p className="mt-1 text-[11px] text-[#E24B4A] font-semibold">
                      No active categories found. Please create an active
                      category first.
                    </p>
                  )}
                </div>
              </div>

              {/* Lifecycle & Geo Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Globe size={18} className="text-[#2D2380]" />
                  Status & Targeting
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                    <Calendar size={14} /> Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                  <p className="text-[12px] text-[#7775A0] mt-1">
                    Leave blank if this coupon does not expire.
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Region
                  </label>
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              {/* Trust Badges & Flags */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-3">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Sparkles size={18} className="text-[#2D2380]" />
                  Badges & Priority
                </h2>

                <Toggle
                  label="Tested and Working"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleChange}
                  icon={CheckCircle}
                  colorClass="text-[#22B07D]"
                />
                <Toggle
                  label="Exclusive Deal"
                  name="isExclusive"
                  checked={formData.isExclusive}
                  onChange={handleChange}
                  icon={Sparkles}
                  colorClass="text-[#F4A836]"
                />
                <Toggle
                  label="Show First"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  icon={Pin}
                  colorClass="text-[#2D2380]"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponEditor;
