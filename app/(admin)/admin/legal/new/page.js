"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Scale,
  FileText,
  Settings,
  Globe,
  ShieldCheck,
  Type,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BookOpen,
} from "lucide-react";
import Swal from "sweetalert2";
import TextEditor from "../../editor/page";
// Using your custom TextEditor

const NewLegalPageEditor = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── STATE MAPPED STRICTLY TO LEGALPAGE SCHEMA ───────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "custom",
    content: "",
    status: "draft",
    isSystemPage: false,
    seo: {
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      indexable: true,
    },
  });

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const generateSlug = () => {
    if (!formData.title || formData.slug) return;
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    setFormData((prev) => ({ ...prev, slug }));
  };

  // ─── API SUBMISSION ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    if (!formData.content || formData.content.length < 50) {
      return Swal.fire(
        "Content Required",
        "Legal pages must have substantial content for compliance.",
        "warning",
      );
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/legal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "admin_01", // In production, get this from auth session
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save legal page");
      }

      await Swal.fire({
        icon: "success",
        title: "Page Created!",
        text: "Legal page has been saved successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      router.push("/admin/legal");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire("Error", error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── REUSABLE UI COMPONENTS ──────────────────────────────────────────────
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
          className={`block w-10 h-6 rounded-full transition-colors ${checked ? activeBg : "bg-[#E0DEF5]"}`}
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}
        ></div>
      </div>
    </label>
  );

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

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* HEADER SECTION */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[#F7F6FF]/90 backdrop-blur-md py-4 border-b border-[#E0DEF5]/50">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/legal"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white bg-white shadow-sm transition-all"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <Scale size={24} className="text-[#F4A836]" /> Create Static
                  Page
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${formData.status === "published" ? "text-[#22B07D]" : "text-[#FF6B35]"}`}
                  >
                    {formData.status === "published"
                      ? "Live on Site"
                      : "Draft Mode"}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#E0DEF5]" />
                  <span className="text-[12px] font-medium text-[#7775A0]">
                    Auto-updates revision date on save.
                  </span>
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title || !formData.slug}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                isSubmitting || !formData.title || !formData.slug
                  ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                  : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Page
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* LEFT COLUMN: Main Content */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <FileText size={18} className="text-[#2D2380]" /> Identity &
                  Route
                </h2>

                <div>
                  <label className="block text-[13px] font-bold text-[#1A1340] mb-2 uppercase tracking-wide">
                    Page Title <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleBasicChange}
                    onBlur={generateSlug}
                    placeholder="e.g. Privacy Policy"
                    required
                    className="w-full px-0 text-[30px] font-bold text-[#1A1340] placeholder:text-[#E0DEF5] border-none focus:ring-0 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#F7F6FF]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      URL Slug
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0] text-[12px] font-mono">
                        /
                      </span>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleBasicChange}
                        className="w-full pl-6 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] font-mono text-[#2D2380] focus:border-[#2D2380] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Page Classification
                    </label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleBasicChange}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    >
                      <option value="custom">Custom Static Page</option>
                      <option value="about_us">About Us</option>
                      <option value="privacy_policy">Privacy Policy</option>
                      <option value="terms">Terms & Conditions</option>
                      <option value="affiliate_disclosure">
                        Affiliate Disclosure
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TEXT EDITOR INTEGRATION */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-hidden">
                <div className="bg-[#1A1340] p-3 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white/50 text-[12px] font-bold uppercase tracking-widest">
                    <Type size={18} />{" "}
                    <span className="text-[#F4A836]">Legal Content Editor</span>
                  </div>
                </div>
                {/* Custom TextEditor receiving content and onChange */}
                <div className="p-1 min-h-[500px]">
                  <TextEditor
                    value={formData.content}
                    onChange={(html) =>
                      setFormData((prev) => ({ ...prev, content: html }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Settings */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Visibility
                </h2>
                <div className="flex gap-2">
                  <StatusToggle
                    label="Published"
                    value="published"
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
                <Toggle
                  label="System Page Lock"
                  name="isSystemPage"
                  checked={formData.isSystemPage}
                  onChange={handleBasicChange}
                  icon={formData.isSystemPage ? Lock : Unlock}
                  colorClass="text-[#E24B4A]"
                  activeBg="bg-[#E24B4A]"
                />
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Globe size={18} className="text-[#2D2380]" /> SEO Meta
                </h2>
                <Toggle
                  label="Google Indexing"
                  name="indexable"
                  checked={formData.seo.indexable}
                  onChange={(e) =>
                    handleNestedChange("seo", "indexable", e.target.checked)
                  }
                  icon={CheckCircle}
                  colorClass="text-[#22B07D]"
                  activeBg="bg-[#22B07D]"
                />
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) =>
                    handleNestedChange("seo", "metaTitle", e.target.value)
                  }
                  placeholder="Meta Title"
                  className="w-full px-3 py-2 border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                />
                <textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) =>
                    handleNestedChange("seo", "metaDescription", e.target.value)
                  }
                  rows={3}
                  placeholder="Meta Description"
                  className="w-full px-3 py-2 border border-[#E0DEF5] rounded-md text-[13px] outline-none resize-none"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewLegalPageEditor;
