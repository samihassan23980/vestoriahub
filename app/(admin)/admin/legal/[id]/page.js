"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
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
  RefreshCcw,
  Edit,
} from "lucide-react";
import Swal from "sweetalert2";
import TextEditor from "../../editor/page";

const EditLegalPage = () => {
  const router = useRouter();
  const params = useParams(); // Next.js client-side params
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // ─── 1. FETCH EXISTING DATA ─────────────────────────────────────────────
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const res = await fetch(`/api/admin/legal/${params.id}`);
        if (!res.ok) throw new Error("Page not found");
        const data = await res.json();
        setFormData(data);
      } catch (error) {
        Swal.fire("Error", "Could not load legal page data.", "error");
        router.push("/admin/legal");
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchPageData();
  }, [params.id]);

  // ─── 2. HANDLERS ────────────────────────────────────────────────────────
  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Safety check: Prevent altering critical fields if system locked
    if (formData.isSystemPage && (name === "slug" || name === "type")) return;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/legal/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Update failed");

      await Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Legal changes saved and cache purged.",
        timer: 1500,
        showConfirmButton: false,
      });

      router.refresh();
    } catch (error) {
      Swal.fire("Update Error", error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── 3. UI COMPONENTS ───────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center gap-4">
        <RefreshCcw className="animate-spin text-[#2D2380]" size={40} />
        <p className="text-[#7775A0] font-bold animate-pulse">
          Retrieving Legal Document...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
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
                  <Edit size={24} className="text-[#F4A836]" /> Edit:{" "}
                  {formData.title}
                </h1>
                <p className="text-[12px] font-medium text-[#7775A0] mt-1">
                  Last Updated:{" "}
                  {new Date(formData.lastRevisedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-lg transition-all"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Update Changes
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              {/* Identity & Slug Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <FileText size={18} className="text-[#2D2380]" /> Content
                  Details
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#7775A0] uppercase tracking-widest mb-1">
                      Page Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleBasicChange}
                      className="w-full text-[28px] font-bold text-[#1A1340] bg-transparent border-none focus:ring-0 p-0"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-[#1A1340] mb-1.5 flex items-center gap-1">
                        URL Slug{" "}
                        {formData.isSystemPage && (
                          <Lock size={12} className="text-[#E24B4A]" />
                        )}
                      </label>
                      <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        readOnly={formData.isSystemPage}
                        onChange={handleBasicChange}
                        className={`w-full px-4 py-2.5 rounded-lg border-[1.5px] text-[14px] font-mono transition-all ${
                          formData.isSystemPage
                            ? "bg-[#F7F6FF] border-[#E0DEF5] text-[#7775A0] cursor-not-allowed"
                            : "bg-white border-[#E0DEF5] focus:border-[#2D2380]"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#1A1340] mb-1.5">
                        Page Classification
                      </label>
                      <select
                        name="type"
                        disabled={formData.isSystemPage}
                        value={formData.type}
                        onChange={handleBasicChange}
                        className={`w-full px-4 py-2.5 rounded-lg border-[1.5px] text-[14px] transition-all ${
                          formData.isSystemPage
                            ? "bg-[#F7F6FF] border-[#E0DEF5] text-[#7775A0]"
                            : "bg-white border-[#E0DEF5]"
                        }`}
                      >
                        <option value="custom">Custom Page</option>
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
              </div>

              {/* EDITOR */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-hidden">
                <div className="bg-[#1A1340] p-3 flex items-center justify-between">
                  <span className="text-[#F4A836] text-[12px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <Type size={16} /> Rich Text Content
                  </span>
                  <a
                    href={`/legal/${formData.slug}`}
                    target="_blank"
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <Globe size={16} />
                  </a>
                </div>
                <div className="p-1 min-h-[600px]">
                  <TextEditor
                    value={formData.content}
                    onChange={(html) =>
                      setFormData((prev) => ({ ...prev, content: html }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Controls
                </h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, status: "published" })
                    }
                    className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase transition-all ${formData.status === "published" ? "bg-[#E1F5EE] text-[#22B07D] border border-[#22B07D]" : "bg-gray-50 text-gray-400 border border-gray-200"}`}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, status: "draft" })
                    }
                    className={`flex-1 py-2 rounded-lg text-[12px] font-bold uppercase transition-all ${formData.status === "draft" ? "bg-[#F7F6FF] text-[#7775A0] border border-[#7775A0]" : "bg-gray-50 text-gray-400 border border-gray-200"}`}
                  >
                    Draft
                  </button>
                </div>

                <div
                  className={`p-4 rounded-lg border ${formData.isSystemPage ? "bg-[#FCEBEB] border-[#E24B4A]/20" : "bg-[#F7F6FF] border-[#E0DEF5]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-bold text-[#1A1340]">
                      System Lock
                    </span>
                    {formData.isSystemPage ? (
                      <Lock size={16} className="text-[#E24B4A]" />
                    ) : (
                      <Unlock size={16} className="text-[#7775A0]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#7775A0] leading-relaxed">
                    {formData.isSystemPage
                      ? "This is a core page. Slug and Type are locked to prevent broken links."
                      : "Custom page. You can freely change all identifiers."}
                  </p>
                </div>
              </div>

              {/* SEO BOX */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Globe size={18} className="text-[#2D2380]" /> SEO Settings
                </h2>
                <label className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.seo.indexable}
                    onChange={(e) =>
                      handleNestedChange("seo", "indexable", e.target.checked)
                    }
                    className="w-4 h-4 accent-[#22B07D]"
                  />
                  <span className="text-[13px] font-semibold text-[#1A1340]">
                    Indexable by Search Engines
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) =>
                    handleNestedChange("seo", "metaTitle", e.target.value)
                  }
                  placeholder="SEO Title Tag"
                  className="w-full px-3 py-2 border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                />
                <textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) =>
                    handleNestedChange("seo", "metaDescription", e.target.value)
                  }
                  rows={4}
                  placeholder="Meta Description"
                  className="w-full px-3 py-2 border border-[#E0DEF5] rounded-md text-[13px] outline-none resize-none focus:border-[#2D2380]"
                />
              </div>
            </div>
          </div>
        </form>

        {/* GUIDE */}
        <div className="mt-12 bg-[#1A1340] rounded-xl p-6 text-white/80 text-[13px] border border-white/10">
          <div className="flex items-center gap-2 text-[#F4A836] font-bold mb-3 uppercase tracking-widest">
            <BookOpen size={18} /> Editor Insights
          </div>
          <p>
            Editing this document will automatically update the{" "}
            <strong>lastRevisedAt</strong> timestamp if the content changes.
            This is tracked for audit compliance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditLegalPage;
