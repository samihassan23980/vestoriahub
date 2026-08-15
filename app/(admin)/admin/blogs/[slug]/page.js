"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Icons
import {
  ArrowLeft,
  Save,
  Image as ImageIcon,
  Settings,
  Globe,
  MessageCircleQuestion,
  Plus,
  Trash2,
  Type,
  Store,
  Clock,
  UserCircle,
  Loader2,
  BookOpen,
  CheckCircle,
  Component,
  Copy,
  Check,
  Link as LinkIcon,
  UploadCloud,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  History,
} from "lucide-react";
import TextEditor from "../../editor/page";
import MediaUploader from "@/app/Components/media/MediaUploader";

// ─── ROBUST API EXTRACTOR HELPER ───────────────────────────────────────────
const getArrayFromApi = (data, key) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data?.data && Array.isArray(data.data[key])) return data.data[key];
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function EditBlogPost() {
  const router = useRouter();
  const { slug } = useParams(); // Safely get slug in Next.js 15 Client Component

  // ─── APP STATES ────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [copiedToken, setCopiedToken] = useState(null);
  const [imageMode, setImageMode] = useState("upload"); // "upload" | "link"

  // Fetched Data Arrays
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);

  // ─── FORM STATE (MAPPED TO SCHEMA) ─────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "", // Handled as comma-separated string in UI
    featuredImage: { url: "", alt: "" },
    author: { name: "Sociantech Team", role: "Deal Expert", avatar: "" },
    status: "draft",
    relatedStores: [],
    faqs: [],
    embeddedBlocks: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      indexable: true,
    },
    // Read-only stats for UI
    viewCount: 0,
    readTimeMinutes: 0,
    publishedAt: null,
  });

  // ─── FETCH REFERENCES (Categories & Stores) ────────────────────────────
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        const [catRes, storeRes] = await Promise.all([
          fetch("/api/public/categories/module/blog"),
          fetch("/api/admin/stores"),
        ]);

        const catData = catRes.ok ? await catRes.json() : null;
        const storeData = storeRes.ok ? await storeRes.json() : null;

        setCategories(getArrayFromApi(catData, "categories"));
        setStores(getArrayFromApi(storeData, "stores"));
      } catch (error) {
        console.error("Failed to fetch references:", error);
        Swal.fire({
          icon: "error",
          title: "Reference Data Failed",
          text: "Categories or stores could not be loaded. Please check your connection and refresh.",
        });
      } finally {
        setIsLoadingRefs(false);
      }
    };
    fetchReferences();
  }, []);

  // ─── FETCH EXISTING BLOG DATA ──────────────────────────────────────────
  useEffect(() => {
    const fetchBlogData = async () => {
      if (!slug) return;
      try {
        const res = await fetch(`/api/admin/blogs/${slug}`);
        const json = await res.json();

        if (!res.ok || !json.data) {
          throw new Error(json.error || "Blog post not found.");
        }

        const blog = json.data;

        // Map populated references back to IDs for the form, and arrays to strings
        setFormData({
          title: blog.title || "",
          slug: blog.slug || "",
          excerpt: blog.excerpt || "",
          content: blog.content || "",
          category: blog.category?._id || blog.category || "",
          tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : "",
          featuredImage: {
            url: blog.featuredImage?.url || "",
            alt: blog.featuredImage?.alt || "",
          },
          author: {
            name: blog.author?.name || "Sociantech Team",
            role: blog.author?.role || "Deal Expert",
            avatar: blog.author?.avatar || "",
          },
          status: blog.status || "draft",
          relatedStores: Array.isArray(blog.relatedStores)
            ? blog.relatedStores.map((s) => s._id || s)
            : [],
          faqs: blog.faqs || [],
          embeddedBlocks: blog.embeddedBlocks || [],
          seo: {
            metaTitle: blog.seo?.metaTitle || "",
            metaDescription: blog.seo?.metaDescription || "",
            canonicalUrl: blog.seo?.canonicalUrl || "",
            indexable: blog.seo?.indexable ?? true,
          },
          viewCount: blog.viewCount || 0,
          readTimeMinutes: blog.readTimeMinutes || 0,
          publishedAt: blog.publishedAt,
        });

        // Set image mode based on whether there's a URL
        if (blog.featuredImage?.url) setImageMode("link");
      } catch (error) {
        console.error("Fetch blog error:", error);
        Swal.fire({
          icon: "error",
          title: "Article Not Found",
          text: error.message || "We couldn't load this article for editing.",
          confirmButtonColor: "#E24B4A",
        }).then(() => router.push("/admin/blogs"));
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchBlogData();
  }, [slug, router]);

  // ─── CORE HANDLERS ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeoChange = (field, value) => {
    setFormData((prev) => ({ ...prev, seo: { ...prev.seo, [field]: value } }));
  };

  const handleAuthorChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      author: { ...prev.author, [field]: value },
    }));
  };

  const handleImageChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      featuredImage: { ...prev.featuredImage, [field]: value },
    }));
  };

  // ─── FAQ & STORES HANDLERS ───────────────────────────────────────────────
  const addFaq = () => {
    if (formData.faqs.length >= 15) {
      return Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "You can add a maximum of 15 FAQs per blog post.",
      });
    }
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index][field] = value;
    setFormData((prev) => ({ ...prev, faqs: newFaqs }));
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const toggleStore = (storeId) => {
    setFormData((prev) => {
      const current = prev.relatedStores;
      if (current.includes(storeId))
        return { ...prev, relatedStores: current.filter((i) => i !== storeId) };
      if (current.length >= 10) {
        Swal.fire({
          icon: "warning",
          title: "Limit Reached",
          text: "You can only link up to 10 stores per post.",
        });
        return prev;
      }
      return { ...prev, relatedStores: [...current, storeId] };
    });
  };

  // ─── EMBEDDED BLOCKS HANDLERS ────────────────────────────────────────────
  const addEmbed = () => {
    if (formData.embeddedBlocks.length >= 30) {
      return Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "You can add a maximum of 30 embed blocks per post.",
      });
    }
    const newId = Date.now().toString(36);
    setFormData((prev) => ({
      ...prev,
      embeddedBlocks: [
        ...prev.embeddedBlocks,
        {
          placementToken: `{{embed:item-${newId}}}`,
          blockType: "product_card",
          title: "",
          description: "",
          imageUrl: "",
          price: "",
          discountBadge: "",
          button: { text: "View Deal", url: "", isExternal: true },
        },
      ],
    }));
  };

  const updateEmbed = (index, field, value, isButtonField = false) => {
    const newBlocks = [...formData.embeddedBlocks];
    if (isButtonField) newBlocks[index].button[field] = value;
    else newBlocks[index][field] = value;
    setFormData((prev) => ({ ...prev, embeddedBlocks: newBlocks }));
  };

  const removeEmbed = (index) => {
    setFormData((prev) => ({
      ...prev,
      embeddedBlocks: prev.embeddedBlocks.filter((_, i) => i !== index),
    }));
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // ─── SUBMIT HANDLER (PUT REQUEST) ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      return Swal.fire({
        icon: "error",
        title: "Missing Category",
        text: "Please select a primary category before updating.",
      });
    }
    if (!formData.content || formData.content === "<p><br></p>") {
      return Swal.fire({
        icon: "error",
        title: "Missing Content",
        text: "Blog content cannot be empty. Please write something in the editor.",
      });
    }
    if (!formData.slug) {
      return Swal.fire({
        icon: "error",
        title: "Missing Slug",
        text: "Please enter or generate a valid URL slug.",
      });
    }

    setIsSubmitting(true);

    const payload = {
      ...formData,
      tags: formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const response = await fetch(`/api/admin/blogs/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.details && data.details.length > 0) {
          const errorList = data.details
            .map((err) => `<li>${err}</li>`)
            .join("");
          throw new Error(
            `<p style="margin-bottom:8px;">Please check the following issues:</p><ul style="text-align:left; margin-left:20px; color:#E24B4A;">${errorList}</ul>`,
          );
        }
        throw new Error(data.error || "Failed to update post due to an unknown server error.");
      }

      await Swal.fire({
        icon: "success",
        title: "Updated Successfully!",
        text: "Your blog post has been successfully updated.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/blogs");
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        html: error.message || "We couldn't update your post. Please check your inputs and try again.",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── CALCULATE SEO SCORE DYNAMICALLY ───
  const calculateSeoScore = () => {
    let score = 0;
    if (formData.seo.metaTitle.length > 10) score += 20;
    if (formData.seo.metaDescription.length > 50) score += 20;
    if (formData.content.length > 300) score += 20;
    if (formData.featuredImage.url) score += 20;
    if (formData.faqs.length > 0) score += 10;
    if (formData.relatedStores.length > 0) score += 10;
    return score;
  };
  const seoScore = calculateSeoScore();

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────
  const SectionHeader = ({ title, icon: Icon, badge }) => (
    <div className="flex items-center justify-between border-b border-[#E0DEF5] pb-4 mb-5">
      <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2">
        <Icon size={18} className="text-[#2D2380]" /> {title}
      </h2>
      {badge && (
        <span className="text-[11px] font-bold text-[#7775A0] bg-[#F7F6FF] px-2 py-1 rounded">
          {badge}
        </span>
      )}
    </div>
  );

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="animate-spin text-[#2D2380]" />
          <p className="text-[#7775A0] font-bold tracking-widest uppercase text-[12px]">
            Loading Article...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── STICKY HEADER ─── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[#F7F6FF]/90 backdrop-blur-md py-4 border-b border-[#E0DEF5]/50">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/blogs"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white bg-white shadow-sm transition-all"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight">
                    Edit Article
                  </h1>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${formData.status === "published" ? "bg-[#22B07D]/15 text-[#22B07D] border-[#22B07D]/20" : "bg-[#7775A0]/15 text-[#7775A0] border-[#7775A0]/20"}`}
                  >
                    {formData.status}
                  </span>
                </div>
                <p className="text-[#7775A0] text-[13px] mt-1">
                  Last edit by {formData.author.name}{" "}
                  {formData.publishedAt
                    ? `• ${new Date(formData.publishedAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/blogs/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-[14px] text-[#2D2380] bg-white border border-[#E0DEF5] hover:bg-[#F7F6FF] transition-all"
              >
                <ExternalLink size={18} /> View Live
              </a>
              <button
                type="submit"
                disabled={isSubmitting || !formData.title}
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSubmitting ? "Updating..." : "Update Article"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* ─── SINGLE COLUMN FULL-WIDTH LAYOUT ─── */}

            {/* 1. Title & Excerpt & Stats */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#F7F6FF]">
                <div className="flex-1">
                  <label className="block text-[11px] font-bold text-[#7775A0] uppercase tracking-widest mb-1">
                    Headline <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full text-[28px] font-bold text-[#1A1340] border-none focus:ring-0 outline-none p-0 bg-transparent"
                  />
                </div>
                <div className="flex gap-4 border-l border-[#E0DEF5] pl-6 h-fit shrink-0">
                  <div className="text-center">
                    <span className="block text-[18px] font-bold text-[#1A1340]">
                      {formData.viewCount.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-bold text-[#7775A0] uppercase tracking-wider">
                      Total Views
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="block text-[18px] font-bold text-[#2D2380]">
                      {formData.readTimeMinutes}m
                    </span>
                    <span className="text-[10px] font-bold text-[#7775A0] uppercase tracking-wider">
                      Read Time
                    </span>
                  </div>
                </div>
              </div>

              <label className="block text-[11px] font-bold text-[#7775A0] uppercase tracking-widest mb-2">
                Excerpt <span className="text-[#E24B4A]">*</span>
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                required
                rows={2}
                className="w-full px-4 py-3 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[15px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all resize-none"
              />
            </div>

            {/* 2. Gamified SEO Score */}
            <div className="bg-[#1A1340] rounded-xl p-6 shadow-lg relative overflow-hidden text-white">
              <div
                className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 ${seoScore >= 80 ? "bg-[#22B07D]/20" : seoScore >= 50 ? "bg-[#F4A836]/20" : "bg-[#E24B4A]/20"}`}
              />
              <div className="relative z-10">
                <h3 className="text-white text-[14px] font-bold mb-4 flex items-center gap-2">
                  <TrendingUp
                    size={16}
                    className={
                      seoScore >= 80
                        ? "text-[#22B07D]"
                        : seoScore >= 50
                          ? "text-[#F4A836]"
                          : "text-[#E24B4A]"
                    }
                  />{" "}
                  SEO Health Score
                </h3>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-[36px] font-bold text-white leading-none">
                    {seoScore}
                  </span>
                  <span className="text-white/50 text-[14px] font-bold mb-1">
                    / 100
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-[12px] text-white/70">
                    {formData.seo.metaTitle ? (
                      <CheckCircle size={14} className="text-[#22B07D]" />
                    ) : (
                      <AlertCircle size={14} className="text-[#E24B4A]" />
                    )}{" "}
                    Meta Title Optimized
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/70">
                    {formData.seo.metaDescription ? (
                      <CheckCircle size={14} className="text-[#22B07D]" />
                    ) : (
                      <AlertCircle size={14} className="text-[#E24B4A]" />
                    )}{" "}
                    Meta Desc Added
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/70">
                    {formData.faqs.length > 0 ? (
                      <CheckCircle size={14} className="text-[#22B07D]" />
                    ) : (
                      <AlertCircle size={14} className="text-[#F4A836]" />
                    )}{" "}
                    FAQ Schema
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-white/70">
                    {formData.relatedStores.length > 0 ? (
                      <CheckCircle size={14} className="text-[#22B07D]" />
                    ) : (
                      <AlertCircle size={14} className="text-[#F4A836]" />
                    )}{" "}
                    Internal Linking
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Status & Taxonomy */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
              <SectionHeader title="Publishing & Taxonomy" icon={Settings} />
              <div className="flex gap-2 max-w-xs">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, status: "published" })
                  }
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[13px] flex-1 justify-center transition-all ${formData.status === "published" ? "border-[#22B07D] bg-[#E1F5EE] text-[#22B07D]" : "border-[#E0DEF5] text-[#7775A0]"}`}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, status: "draft" })
                  }
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[13px] flex-1 justify-center transition-all ${formData.status === "draft" ? "border-[#7775A0] bg-[#F7F6FF] text-[#7775A0]" : "border-[#E0DEF5] text-[#7775A0]"}`}
                >
                  Draft
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] outline-none disabled:opacity-50"
                    disabled={isLoadingRefs}
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id || c.id} value={c._id || c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    URL Slug <span className="text-[#E24B4A]">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0] text-[12px] font-mono">
                      /blog/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      maxLength={200}
                      required
                      className="w-full pl-[52px] pr-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] font-mono text-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="Comma separated..."
                  className="w-full px-4 py-2.5 bg-white border border-[#E0DEF5] rounded-lg text-[14px] outline-none"
                />
              </div>
            </div>

            {/* 4. Connected Custom Text Editor */}
            {/* 🛠️ THE FIX IS HERE: Changed overflow-hidden to overflow-visible, added relative z-10, and added rounded-t-xl to the inner header */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-visible relative z-10 flex flex-col">
              <div className="bg-[#1A1340] p-3 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-4 text-white/50">
                  <Type size={18} />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#F4A836]">
                    Article Body
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#E24B4A]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F4A836]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#22B07D]" />
                  </div>
                </div>
              </div>
              <TextEditor
                value={formData.content}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, content: val }))
                }
                maxLength={200000}
              />
            </div>

            {/* 5. Dynamic Embedded Blocks */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm relative z-0">
              <div className="flex items-center justify-between mb-6 border-b border-[#E0DEF5] pb-4">
                <div className="flex items-center gap-2">
                  <Component size={20} className="text-[#2D2380]" />
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1A1340]">
                      Dynamic Embeds
                    </h2>
                    <p className="text-[12px] text-[#7775A0]">
                      Create UI blocks and paste token into text editor.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addEmbed}
                  disabled={formData.embeddedBlocks.length >= 30}
                  className="flex items-center gap-1.5 text-white bg-[#2D2380] hover:bg-[#4A3DBF] px-4 py-2 rounded-lg font-bold text-[13px] transition-colors disabled:opacity-50"
                >
                  <Plus size={16} /> Create Embed
                </button>
              </div>

              <div className="space-y-4">
                {formData.embeddedBlocks.length === 0 ? (
                  <div className="text-center py-8 bg-[#F7F6FF] border-2 border-dashed border-[#E0DEF5] rounded-lg">
                    <p className="text-[#7775A0] text-[14px] italic">
                      No custom blocks created yet.
                    </p>
                  </div>
                ) : (
                  formData.embeddedBlocks.map((block, idx) => (
                    <div
                      key={idx}
                      className="p-5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-xl relative group"
                    >
                      <div className="flex items-center justify-between bg-white border border-[#E0DEF5] p-2 rounded-lg mb-4">
                        <code className="text-[14px] font-mono font-bold text-[#FF6B35] px-2">
                          {block.placementToken}
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyToken(block.placementToken)
                          }
                          className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-[#EEEDFE] text-[#2D2380] px-3 py-1.5 rounded-md hover:bg-[#2D2380] hover:text-white transition-colors"
                        >
                          {copiedToken === block.placementToken ? (
                            <>
                              <Check size={14} /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copy Token
                            </>
                          )}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEmbed(idx)}
                        className="absolute top-6 right-5 text-[#7775A0] hover:text-[#E24B4A] transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                            Block Type
                          </label>
                          <select
                            value={block.blockType}
                            onChange={(e) =>
                              updateEmbed(idx, "blockType", e.target.value)
                            }
                            className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[14px] font-bold text-[#1A1340] outline-none"
                          >
                            <option value="product_card">
                              Product Card (Image, Price, Buy Button)
                            </option>
                            <option value="deal_highlight">
                              Deal Highlight (Promo Box, Coupon Code)
                            </option>
                            <option value="custom_button">
                              Custom CTA Button
                            </option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                            Title / Headline
                          </label>
                          <input
                            type="text"
                            value={block.title}
                            onChange={(e) =>
                              updateEmbed(idx, "title", e.target.value)
                            }
                            className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[14px] outline-none"
                          />
                        </div>
                        {block.blockType !== "custom_button" && (
                          <div className="md:col-span-2">
                            <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                              Description
                            </label>
                            <textarea
                              value={block.description}
                              onChange={(e) =>
                                updateEmbed(
                                  idx,
                                  "description",
                                  e.target.value,
                                )
                              }
                              rows={2}
                              className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none resize-none"
                            />
                          </div>
                        )}
                        {block.blockType === "product_card" && (
                          <>
                            <div className="md:col-span-2">
                              <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                                Image URL
                              </label>
                              <input
                                type="text"
                                value={block.imageUrl}
                                onChange={(e) =>
                                  updateEmbed(idx, "imageUrl", e.target.value)
                                }
                                className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                                Price (e.g. $299)
                              </label>
                              <input
                                type="text"
                                value={block.price}
                                onChange={(e) =>
                                  updateEmbed(idx, "price", e.target.value)
                                }
                                className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                              />
                            </div>
                          </>
                        )}
                        {block.blockType !== "custom_button" && (
                          <div>
                            <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                              Badge (e.g. 50% OFF)
                            </label>
                            <input
                              type="text"
                              value={block.discountBadge}
                              onChange={(e) =>
                                updateEmbed(
                                  idx,
                                  "discountBadge",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                            />
                          </div>
                        )}
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                              Button Text
                            </label>
                            <input
                              type="text"
                              value={block.button?.text || ""}
                              onChange={(e) =>
                                updateEmbed(idx, "text", e.target.value, true)
                              }
                              className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                              Button Link
                            </label>
                            <input
                              type="text"
                              value={block.button?.url || ""}
                              onChange={(e) =>
                                updateEmbed(idx, "url", e.target.value, true)
                              }
                              className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6. FAQs */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-[#E0DEF5] pb-4">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion
                    size={20}
                    className="text-[#2D2380]"
                  />
                  <h2 className="text-[16px] font-bold text-[#1A1340]">
                    Structured FAQs ({formData.faqs.length}/15)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={addFaq}
                  disabled={formData.faqs.length >= 15}
                  className="flex items-center gap-1.5 text-[#2D2380] font-bold text-[13px] hover:underline disabled:opacity-50"
                >
                  <Plus size={16} /> Add FAQ
                </button>
              </div>
              <div className="space-y-4">
                {formData.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F7F6FF] border border-[#E0DEF5] rounded-xl relative group"
                  >
                    <button
                      type="button"
                      onClick={() => removeFaq(idx)}
                      className="absolute top-4 right-4 text-[#7775A0] hover:text-[#E24B4A] transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="space-y-3 pr-8">
                      <input
                        type="text"
                        placeholder="Question..."
                        value={faq.question}
                        onChange={(e) =>
                          updateFaq(idx, "question", e.target.value)
                        }
                        maxLength={300}
                        required
                        className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[14px] font-bold text-[#1A1340] outline-none"
                      />
                      <textarea
                        placeholder="Answer..."
                        value={faq.answer}
                        onChange={(e) =>
                          updateFaq(idx, "answer", e.target.value)
                        }
                        maxLength={2000}
                        required
                        className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] text-[#7775A0] outline-none resize-y min-h-[80px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 7. Author Setup */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader title="Author (E-E-A-T)" icon={UserCircle} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.author.name}
                    onChange={(e) => handleAuthorChange("name", e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.author.role}
                    onChange={(e) =>
                      handleAuthorChange("role", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={formData.author.avatar}
                    onChange={(e) =>
                      handleAuthorChange("avatar", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 8. Featured Image (Media Uploader Dual Mode) */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader title="Featured Image" icon={ImageIcon} />
              <div className="flex bg-[#F7F6FF] border border-[#E0DEF5] p-1 rounded-lg max-w-xs mb-4">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[12px] font-bold rounded-md transition-all ${imageMode === "upload" ? "bg-white shadow-sm text-[#2D2380]" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                >
                  <UploadCloud size={14} /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("link")}
                  className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-[12px] font-bold rounded-md transition-all ${imageMode === "link" ? "bg-white shadow-sm text-[#2D2380]" : "text-[#7775A0] hover:text-[#1A1340]"}`}
                >
                  <LinkIcon size={14} /> URL Link
                </button>
              </div>

              {imageMode === "upload" ? (
                <MediaUploader
                  label="Hero Image"
                  folder="blogs/featured"
                  multiple={false}
                  value={
                    formData.featuredImage.url ? [formData.featuredImage] : []
                  }
                  onChange={(img) => {
                    handleImageChange("url", img?.url || "");
                    if (img?.alt) handleImageChange("alt", img.alt);
                  }}
                />
              ) : (
                <div className="space-y-4 pt-2">
                  <div className="aspect-video max-w-md rounded-lg bg-[#F7F6FF] border-2 border-dashed border-[#E0DEF5] flex flex-col items-center justify-center text-[#7775A0] overflow-hidden relative group">
                    {formData.featuredImage.url ? (
                      <>
                        <img
                          src={formData.featuredImage.url}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                        <div className="absolute inset-0 bg-[#1A1340]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleImageChange("url", "")}
                            className="bg-[#E24B4A] text-white px-3 py-1.5 rounded-md text-[11px] font-bold"
                          >
                            Remove Image
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <ImageIcon size={32} className="mb-2 opacity-20" />
                        <span className="text-[12px] font-bold uppercase tracking-wider">
                          No Image
                        </span>
                      </>
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="Paste image URL..."
                    value={formData.featuredImage.url}
                    onChange={(e) => handleImageChange("url", e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
              )}
              <input
                type="text"
                placeholder="Alt text (for SEO)..."
                value={formData.featuredImage.alt}
                onChange={(e) => handleImageChange("alt", e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
              />
            </div>

            {/* 9. SEO Meta */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader title="SEO Meta Settings" icon={Globe} />
              <label className="flex items-center justify-between p-3 bg-[#EEEDFE] rounded-lg cursor-pointer max-w-xs">
                <span className="text-[13px] font-bold text-[#2D2380]">
                  Indexable by Google
                </span>
                <input
                  type="checkbox"
                  checked={formData.seo.indexable}
                  onChange={(e) =>
                    handleSeoChange("indexable", e.target.checked)
                  }
                  className="w-4 h-4 accent-[#2D2380]"
                />
              </label>
              <div>
                <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.seo.metaTitle}
                  onChange={(e) =>
                    handleSeoChange("metaTitle", e.target.value)
                  }
                  maxLength={120}
                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                  Meta Description
                </label>
                <textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) =>
                    handleSeoChange("metaDescription", e.target.value)
                  }
                  maxLength={320}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none resize-none"
                />
              </div>
            </div>

            {/* 10. Related Stores */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader
                title={`Related Stores (${formData.relatedStores.length}/10)`}
                icon={Store}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-2">
                {stores.map((s) => {
                  const storeId = s._id || s.id;
                  const isChecked = formData.relatedStores.includes(storeId);
                  const isDisabled =
                    !isChecked && formData.relatedStores.length >= 10;
                  return (
                    <label
                      key={storeId}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors border border-[#E0DEF5] ${isChecked ? "bg-[#EEEDFE] border-[#2D2380]" : "bg-white hover:bg-[#F7F6FF]"} ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? "bg-[#FF6B35] border-[#FF6B35]" : "border-[#A09EC0]"}`}
                      >
                        {isChecked && (
                          <CheckCircle size={12} className="text-white" />
                        )}
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStore(storeId)}
                        disabled={isDisabled}
                        className="hidden"
                      />
                      <span
                        className={`text-[13px] font-medium truncate ${isChecked ? "text-[#2D2380] font-bold" : "text-[#1A1340]"}`}
                      >
                        {s.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}