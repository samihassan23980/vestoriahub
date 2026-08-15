"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  ShoppingCart,
  Tag,
  Image as ImageIcon,
  DollarSign,
  Award,
  Star,
  Settings,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen,
  Globe,
  CalendarClock,
  Zap,
} from "lucide-react";

const NewAmazonDealEditor = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── STATE MAPPED STRICTLY TO AMAZONDEAL SCHEMA ──────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    asin: "",
    associatesTag: "",
    description: "",
    imageUrl: "",
    originalPrice: "",
    dealPrice: "",
    isPrime: false,
    isAmazonChoice: false,
    isBestSeller: false,
    rating: "", // null in DB, empty string in UI
    reviewCount: 0,
    customAffiliateLink: "",
    category: "", // ObjectId string
    tags: "", // Handled as comma-separated string in UI
    countryCode: "GLOBAL",
    status: "active", // "draft" | "active" | "expired" | "archived"
    expiryDate: "",
    isFeatured: false,
  });

  // Real-time Validation States
  const [hasValidAsin, setHasValidAsin] = useState(false);
  const [hasValidPrice, setHasValidPrice] = useState(false);
  const [calculatedDiscount, setCalculatedDiscount] = useState(0);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Auto-generate slug from title
  const generateSlug = () => {
    if (!formData.title) return;
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, slug }));
  };

  // Validations
  useEffect(() => {
    // ASIN Validation: Exactly 10 uppercase alphanumeric
    const asinRegex = /^[A-Z0-9]{10}$/;
    setHasValidAsin(asinRegex.test(formData.asin.toUpperCase()));

    // Price Validation & Discount Calculation
    const original = parseFloat(formData.originalPrice);
    const deal = parseFloat(formData.dealPrice);

    if (!isNaN(original) && !isNaN(deal) && original > 0) {
      setHasValidPrice(deal <= original);
      if (deal <= original) {
        const raw = ((original - deal) / original) * 100;
        setCalculatedDiscount(Math.min(100, Math.max(0, Math.round(raw))));
      } else {
        setCalculatedDiscount(0);
      }
    } else {
      setHasValidPrice(false);
      setCalculatedDiscount(0);
    }
  }, [formData.asin, formData.originalPrice, formData.dealPrice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasValidAsin || !hasValidPrice) return;

    setIsSubmitting(true);

    // Clean payload for schema
    const payload = {
      ...formData,
      asin: formData.asin.toUpperCase(),
      rating: formData.rating === "" ? null : parseFloat(formData.rating),
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch("/api/admin/amazon-deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save deal");

      router.push("/admin/amazon-deals");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────
  const StatusToggle = ({
    label,
    value,
    current,
    onClick,
    activeColor,
    activeBg,
  }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[13px] transition-all flex-1 justify-center ${
        current === value
          ? `border-${activeColor} ${activeBg} text-${activeColor} shadow-sm`
          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF] hover:text-[#1A1340]"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${current === value ? `bg-${activeColor}` : "bg-[#E0DEF5]"}`}
      />
      {label}
    </button>
  );

  const CheckboxToggle = ({
    name,
    checked,
    onChange,
    label,
    icon: Icon,
    colorClass,
  }) => (
    <label
      className={`flex items-center justify-between p-3 border-[1.5px] rounded-lg cursor-pointer transition-all ${checked ? `border-[${colorClass}] bg-[${colorClass}]/5` : "border-[#E0DEF5] bg-white hover:border-[#4A3DBF]"}`}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={16}
          className={checked ? `text-[${colorClass}]` : "text-[#7775A0]"}
        />
        <span
          className={`text-[13px] font-semibold ${checked ? "text-[#1A1340]" : "text-[#7775A0]"}`}
        >
          {label}
        </span>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      <div
        className={`w-4 h-4 rounded-sm flex items-center justify-center border ${checked ? `bg-[${colorClass}] border-[${colorClass}]` : "border-[#A09EC0]"}`}
      >
        {checked && <CheckCircle size={12} className="text-white" />}
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/amazon-deals"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <ShoppingCart size={24} className="text-[#F4A836]" />
                  Curate Amazon Deal
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Add a high-converting, time-limited Amazon discount.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={!hasValidAsin || !hasValidPrice || isSubmitting}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                !hasValidAsin || !hasValidPrice || isSubmitting
                  ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                  : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Publishing..." : "Publish Deal"}
            </button>
          </div>

          {/* ─── FORM LAYOUT ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* ─── LEFT COLUMN (Spans 8) ─── */}
            <div className="xl:col-span-8 space-y-6">
              {/* Product Identity */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Tag size={18} className="text-[#2D2380]" /> Basic Information
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Display Title <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={generateSlug}
                    placeholder="e.g. Apple AirPods Pro (2nd Generation) - 30% Off"
                    maxLength={220}
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[13px] font-semibold text-[#1A1340]">
                        ASIN <span className="text-[#E24B4A]">*</span>
                      </label>
                      {formData.asin.length > 0 && (
                        <span
                          className={`text-[11px] font-bold ${hasValidAsin ? "text-[#22B07D]" : "text-[#E24B4A]"}`}
                        >
                          {hasValidAsin
                            ? "Valid ASIN"
                            : "Must be 10 characters"}
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      name="asin"
                      value={formData.asin}
                      onChange={handleChange}
                      placeholder="e.g. B0BDHWDR12"
                      maxLength={10}
                      required
                      className={`w-full px-4 py-2.5 bg-white border-[1.5px] rounded-lg text-[14px] font-mono uppercase focus:outline-none transition-all ${
                        formData.asin.length > 0 && !hasValidAsin
                          ? "border-[#E24B4A] focus:border-[#E24B4A]"
                          : "border-[#E0DEF5] focus:border-[#2D2380]"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      URL Slug <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="apple-airpods-pro-2"
                      maxLength={200}
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Affiliate Engine */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <div className="flex justify-between items-center border-b border-[#E0DEF5] pb-4">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2">
                    <DollarSign size={18} className="text-[#2D2380]" /> Pricing
                    Logic
                  </h2>
                  {calculatedDiscount > 0 && (
                    <div className="bg-[#FAEEDA] text-[#BA7517] px-3 py-1 rounded-md text-[13px] font-bold flex items-center gap-1">
                      <Tag size={14} /> {calculatedDiscount}% OFF
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Original Price ($){" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleChange}
                      placeholder="e.g. 249.00"
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none line-through decoration-[#E24B4A]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Deal Price ($) <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="dealPrice"
                      value={formData.dealPrice}
                      onChange={handleChange}
                      placeholder="e.g. 189.99"
                      required
                      className={`w-full px-4 py-2.5 bg-white border-[1.5px] rounded-lg text-[14px] font-bold focus:outline-none transition-all ${
                        formData.dealPrice && !hasValidPrice
                          ? "border-[#E24B4A] text-[#E24B4A]"
                          : "border-[#E0DEF5] text-[#22B07D] focus:border-[#2D2380]"
                      }`}
                    />
                    {!hasValidPrice && formData.dealPrice && (
                      <p className="text-[11px] text-[#E24B4A] mt-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Deal price must be lower than
                        original
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E0DEF5]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Associates Tag (Optional)
                    </label>
                    <input
                      type="text"
                      name="associatesTag"
                      value={formData.associatesTag}
                      onChange={handleChange}
                      placeholder="sociantech-20"
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Custom Deep Link (Optional)
                    </label>
                    <input
                      type="url"
                      name="customAffiliateLink"
                      value={formData.customAffiliateLink}
                      onChange={handleChange}
                      placeholder="https://amazon.com/..."
                      className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Media & Details */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <ImageIcon size={18} className="text-[#2D2380]" /> Media &
                  Content
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Image URL <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://m.media-amazon.com/images/I/..."
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Editorial Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Why is this a great deal? Add your curator notes here..."
                    className="w-full px-4 py-3 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (Spans 4) ─── */}
            <div className="xl:col-span-4 space-y-6">
              {/* Visibility & Status */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Visibility
                </h2>

                <div className="flex gap-2">
                  <StatusToggle
                    label="Active"
                    value="active"
                    current={formData.status}
                    onClick={(v) => setFormData({ ...formData, status: v })}
                    activeColor="[#22B07D]"
                    activeBg="bg-[#E1F5EE]"
                  />
                  <StatusToggle
                    label="Draft"
                    value="draft"
                    current={formData.status}
                    onClick={(v) => setFormData({ ...formData, status: v })}
                    activeColor="[#7775A0]"
                    activeBg="bg-[#F7F6FF]"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                    <CalendarClock size={14} className="text-[#7775A0]" />{" "}
                    Expiry Date
                  </label>
                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              {/* Conversion Badges */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Award size={18} className="text-[#2D2380]" /> Conversion
                  Badges
                </h2>

                <div className="space-y-3">
                  <CheckboxToggle
                    name="isPrime"
                    checked={formData.isPrime}
                    onChange={handleChange}
                    label="Prime Shipping"
                    icon={Zap}
                    colorClass="#00A8E1"
                  />
                  <CheckboxToggle
                    name="isAmazonChoice"
                    checked={formData.isAmazonChoice}
                    onChange={handleChange}
                    label="Amazon's Choice"
                    icon={Award}
                    colorClass="#232F3E"
                  />
                  <CheckboxToggle
                    name="isBestSeller"
                    checked={formData.isBestSeller}
                    onChange={handleChange}
                    label="#1 Best Seller"
                    icon={Tag}
                    colorClass="#F4A836"
                  />
                  <CheckboxToggle
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                    label="Pin to Homepage"
                    icon={Star}
                    colorClass="#4A3DBF"
                  />
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Star size={18} className="text-[#F4A836]" /> Social Proof
                </h2>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#7775A0] mb-1">
                      Star Rating (1-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      placeholder="e.g. 4.6"
                      className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#7775A0] mb-1">
                      Total Reviews
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="reviewCount"
                      value={formData.reviewCount}
                      onChange={handleChange}
                      placeholder="e.g. 1240"
                      className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Organization */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Globe size={18} className="text-[#2D2380]" /> Organization
                </h2>

                <div>
                  <label className="block text-[12px] font-semibold text-[#7775A0] mb-1">
                    Country Target
                  </label>
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="GLOBAL">Global (All Regions)</option>
                    <option value="US">United States (.com)</option>
                    <option value="GB">United Kingdom (.co.uk)</option>
                    <option value="CA">Canada (.ca)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#7775A0] mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="tech, gift-ideas, under-50"
                    className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ─── QUICK FIELD GUIDE (AS REQUESTED) ─── */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Amazon Deal Configuration Guide
            </h2>
          </div>

          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            Ensure high conversion rates by understanding how DealVerse
            constructs Amazon affiliate links and displays social proof.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Field: ASIN (CRITICAL) */}
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <AlertCircle size={16} /> ASIN (Amazon Standard Identification
                Number)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">
                  Why it's needed:
                </span>{" "}
                This is the exact 10-character code Amazon uses to identify a
                product. We use this to auto-generate the affiliate link
                dynamically. You do <strong>not</strong> need to paste a full
                raw URL.
                <br />
                <span className="font-semibold text-[#22B07D]">
                  Example:
                </span>{" "}
                "B0BDHWDR12". Look for this in the Amazon product URL:{" "}
                <code>amazon.com/dp/B0BDHWDR12</code>
              </p>
            </div>

            {/* Field: Pricing Logic */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Pricing & Auto-Discount
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">
                  Why it's needed:
                </span>{" "}
                You must input both Original and Deal prices. The system
                automatically calculates the % OFF badge for the UI. The
                database will reject the save if the deal price is higher than
                the original.
                <br />
                <span className="font-semibold text-[#22B07D]">
                  Example:
                </span>{" "}
                Original: 100, Deal: 50 = Auto-displays 50% OFF.
              </p>
            </div>

            {/* Field: Social Proof */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Social Proof (Rating)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">
                  Why it's needed:
                </span>{" "}
                Builds trust. If a product has no reviews, leave it empty. The
                system will safely output <code>null</code> to prevent
                displaying a fake 4.5 star rating, which ruins affiliate
                credibility.
                <br />
                <span className="font-semibold text-[#22B07D]">
                  Example:
                </span>{" "}
                Enter "4.8" for rating, "12500" for total reviews.
              </p>
            </div>

            {/* Field: Conversion Badges */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Conversion Badges
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">
                  Why it's needed:
                </span>{" "}
                Check these only if they apply on Amazon. Users are highly
                trained to click on "Prime" and "Amazon's Choice" badges,
                drastically improving your CTR (Click-Through Rate).
              </p>
            </div>

            {/* Field: Custom Link Fallback */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Custom Deep Link
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">
                  Why it's needed:
                </span>{" "}
                Only use this if you are linking to a specific search page, a
                bundle, or a category page where an ASIN won't work. Leave empty
                99% of the time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewAmazonDealEditor;
