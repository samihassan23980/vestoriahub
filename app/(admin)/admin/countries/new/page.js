"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Globe,
  MapPin,
  DollarSign,
  Clock,
  Flag,
  Star,
  Settings,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";

const API_BASE = "/api/admin/countries";

const initialFormData = {
  name: "",
  code: "",
  flag: "",
  currencyCode: "USD",
  currencySymbol: "$",
  timezone: "UTC",
  status: "active",
  isPopular: false,
  sortOrder: 0,
};

const NewCountryEditor = () => {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const isFormValid = useMemo(() => {
    return Boolean(formData.name.trim() && formData.code.trim());
  }, [formData.name, formData.code]);

  const setFieldValue = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (type === "checkbox") {
      setFieldValue(name, checked);
      return;
    }

    if (name === "code" || name === "currencyCode") {
      setFieldValue(name, value.toUpperCase());
      return;
    }

    setFieldValue(name, value);
  };

  const handleStatusChange = (status) => {
    setFieldValue("status", status);
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    code: formData.code.trim().toUpperCase(),
    flag: formData.flag.trim(),
    currencyCode: formData.currencyCode.trim().toUpperCase() || "USD",
    currencySymbol: formData.currencySymbol.trim() || "$",
    timezone: formData.timezone.trim() || "UTC",
    status: formData.status,
    isPopular: Boolean(formData.isPopular),
    sortOrder: Number.isFinite(Number(formData.sortOrder))
      ? Number(formData.sortOrder)
      : 0,
  });

  const validateClientSide = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Country / region name is required.";
    }

    if (!formData.code.trim()) {
      errors.code = "ISO code is required.";
    }

    if (formData.code.trim().length > 10) {
      errors.code = "ISO code cannot exceed 10 characters.";
    }

    if (!["active", "inactive"].includes(formData.status)) {
      errors.status = "Status must be active or inactive.";
    }

    if (formData.currencyCode.trim().length > 10) {
      errors.currencyCode = "Currency code cannot exceed 10 characters.";
    }

    if (formData.currencySymbol.trim().length > 10) {
      errors.currencySymbol = "Currency symbol cannot exceed 10 characters.";
    }

    if (formData.timezone.trim().length > 60) {
      errors.timezone = "Timezone cannot exceed 60 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const applyApiValidationErrors = (details) => {
    if (!Array.isArray(details)) return;

    const nextErrors = {};

    details.forEach((item) => {
      if (item?.field) {
        nextErrors[item.field] = item.message;
      }
    });

    setFieldErrors(nextErrors);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateClientSide()) {
      Swal.fire({
        icon: "warning",
        title: "Check Required Fields",
        text: "Please fix the highlighted fields before saving.",
        confirmButtonColor: "#2D2380",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        applyApiValidationErrors(result?.details);

        throw new Error(
          typeof result?.details === "string"
            ? result.details
            : result?.error || "Failed to add country.",
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Country Added",
        text: result.message || "Country added successfully.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/countries");
      router.refresh();
    } catch (error) {
      console.error("Country create error:", error);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text:
          error.message ||
          "Country could not be saved. Please check your API or database connection.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const FieldError = ({ name }) => {
    if (!fieldErrors[name]) return null;

    return (
      <p className="text-[12px] text-[#E24B4A] mt-1.5 leading-snug">
        {fieldErrors[name]}
      </p>
    );
  };

  const inputClass = (name, extra = "") =>
    `w-full px-4 py-2.5 bg-white border-[1.5px] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-2 focus:ring-[#2D2380]/10 outline-none transition-all ${
      fieldErrors[name] ? "border-[#E24B4A]" : "border-[#E0DEF5]"
    } ${extra}`;

  const Toggle = ({
    label,
    name,
    checked,
    onChange,
    icon: Icon,
    colorClass,
    activeBg,
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
          className={`block w-10 h-6 rounded-full transition-colors ${
            checked ? activeBg : "bg-[#E0DEF5]"
          }`}
        />
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );

  const StatusToggle = ({ label, value, current, onClick, variant }) => {
    const active =
      variant === "success"
        ? "border-[#22B07D] bg-[#E1F5EE] text-[#22B07D]"
        : "border-[#7775A0] bg-[#F7F6FF] text-[#7775A0]";

    const dot = variant === "success" ? "bg-[#22B07D]" : "bg-[#7775A0]";

    return (
      <button
        type="button"
        onClick={() => onClick(value)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[13px] transition-all flex-1 justify-center ${
          current === value
            ? `${active} shadow-sm`
            : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF] hover:text-[#1A1340]"
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            current === value ? dot : "bg-[#E0DEF5]"
          }`}
        />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/countries"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <Globe size={24} className="text-[#F4A836]" />
                  Add New Region
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Configure location, currency, and targeting priorities.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isFormValid}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                isSubmitting || !isFormValid
                  ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                  : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Saving..." : "Save Region"}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <MapPin size={18} className="text-[#2D2380]" />
                  Region Identity
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Country / Region Name{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Pakistan, United States"
                      maxLength={120}
                      required
                      className={inputClass("name")}
                    />
                    <FieldError name="name" />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      ISO Code <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g. PK, US, GLOBAL"
                      maxLength={10}
                      required
                      className={inputClass(
                        "code",
                        "font-mono font-bold uppercase",
                      )}
                    />
                    <FieldError name="code" />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                    <Flag size={14} className="text-[#7775A0]" />
                    Flag Icon{" "}
                    <span className="text-[#7775A0] font-normal">
                      Emoji or image URL
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#F7F6FF] border border-[#E0DEF5] flex items-center justify-center text-[24px] shrink-0 shadow-inner overflow-hidden">
                      {formData.flag ? (
                        formData.flag.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={formData.flag}
                            alt="Flag preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          formData.flag
                        )
                      ) : (
                        <Globe size={20} className="text-[#E0DEF5]" />
                      )}
                    </div>

                    <input
                      type="text"
                      name="flag"
                      value={formData.flag}
                      onChange={handleChange}
                      placeholder="e.g. 🇵🇰 or https://example.com/flag.svg"
                      maxLength={200}
                      className={inputClass("flag")}
                    />
                  </div>
                  <FieldError name="flag" />
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Globe size={18} className="text-[#2D2380]" />
                  Localization & Display
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div>
                    <label className="text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                      <DollarSign size={14} className="text-[#7775A0]" />
                      Currency Code
                    </label>
                    <input
                      type="text"
                      name="currencyCode"
                      value={formData.currencyCode}
                      onChange={handleChange}
                      placeholder="e.g. PKR, USD"
                      maxLength={10}
                      className={inputClass(
                        "currencyCode",
                        "font-mono uppercase",
                      )}
                    />
                    <FieldError name="currencyCode" />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Currency Symbol
                    </label>
                    <input
                      type="text"
                      name="currencySymbol"
                      value={formData.currencySymbol}
                      onChange={handleChange}
                      placeholder="e.g. ₨, $"
                      maxLength={10}
                      className={inputClass("currencySymbol", "font-bold")}
                    />
                    <FieldError name="currencySymbol" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#7775A0]" />
                      IANA Timezone
                    </label>
                    <input
                      type="text"
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      placeholder="e.g. Asia/Karachi, America/New_York"
                      maxLength={60}
                      className={inputClass("timezone")}
                    />
                    <FieldError name="timezone" />
                    <p className="text-[12px] text-[#7775A0] mt-1.5 leading-snug">
                      Used to accurately display deal expiry times. Default is
                      UTC.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" />
                  Region Availability
                </h2>

                <p className="text-[12px] text-[#7775A0] leading-relaxed mb-4">
                  Inactive countries cannot be newly assigned, while old data
                  remains safe.
                </p>

                <div className="flex flex-col gap-3">
                  <StatusToggle
                    label="Active"
                    value="active"
                    current={formData.status}
                    onClick={handleStatusChange}
                    variant="success"
                  />
                  <StatusToggle
                    label="Inactive"
                    value="inactive"
                    current={formData.status}
                    onClick={handleStatusChange}
                    variant="muted"
                  />
                </div>

                <FieldError name="status" />
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Star size={18} className="text-[#2D2380]" />
                  Dropdown Priority
                </h2>

                <Toggle
                  label="Mark as Popular"
                  name="isPopular"
                  checked={formData.isPopular}
                  onChange={handleChange}
                  icon={Star}
                  colorClass="text-[#F4A836]"
                  activeBg="bg-[#F4A836]"
                />

                <p className="text-[11px] text-[#7775A0] leading-snug px-1">
                  Popular countries float to the top of the country selector.
                </p>

                <div className="pt-3 border-t border-[#E0DEF5]">
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass("sortOrder")}
                  />
                  <FieldError name="sortOrder" />
                  <p className="text-[11px] text-[#7775A0] mt-1.5">
                    Lower numbers display first within their tier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Regional Configuration Guide
            </h2>
          </div>

          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            This section controls geographic targeting options across stores,
            coupons, Amazon deals, and frontend filters.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <AlertCircle size={16} /> ISO Code
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                Use standard alpha-2 codes like <code>US</code>, <code>GB</code>
                , <code>PK</code>, or the special <code>GLOBAL</code> code for
                worldwide targeting.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Currency Code & Symbol
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Code is used for structured metadata. Symbol is displayed in UI
                near prices.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                IANA Timezone
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Used for localizing deal expiry times and scheduled promotions.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Active vs Inactive
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Use inactive instead of deleting when old content still depends
                on the country.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Popularity & Sorting
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Popular countries appear first, then sort order, then name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCountryEditor;
