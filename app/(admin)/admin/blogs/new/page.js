"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Eye,
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
} from "lucide-react";
import TextEditor from "../../editor/page";
import MediaUploader from "@/app/Components/media/MediaUploader";

// ─── ROBUST API EXTRACTOR HELPER ───────────────────────────────────────────
// This safely extracts the array whether the API returns:
// [ ... ], { key: [ ... ] }, { data: { key: [ ... ] } }, or { data: [ ... ] }
const getArrayFromApi = (data, key) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data[key])) return data[key];
  if (data?.data && Array.isArray(data.data[key])) return data.data[key];
  if (data?.data && Array.isArray(data.data)) return data.data;
  return [];
};

export default function NewBlogPost() {
  const router = useRouter();

  // App States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true); // Replaces isLoadingData
  const [copiedToken, setCopiedToken] = useState(null);
  const [imageMode, setImageMode] = useState("upload");

  // Fetched Data Arrays
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);

  // ─── EXACT SCHEMA MAPPING ──────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "", // Handled as string in UI, array on submit
    featuredImage: { url: "", alt: "" },
    author: { name: "Sociantech Team", role: "Deal Expert", avatar: "" },
    status: "draft",
    relatedStores: [], // Array of ObjectIds
    faqs: [],
    embeddedBlocks: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      indexable: true,
    },
  });

  // ─── FETCH CATEGORIES & STORES ─────────────────────────────────────────────
  useEffect(() => {
    const fetchReferences = async () => {
      setIsLoadingRefs(true);
      try {
        const [catRes, storeRes] = await Promise.all([
          fetch("/api/public/categories/module/blog"),
          fetch("/api/admin/stores"),
        ]);

        const catData = catRes.ok ? await catRes.json() : null;
        const storeData = storeRes.ok ? await storeRes.json() : null;

        // Use the robust helper to extract arrays safely
        const parsedCategories = getArrayFromApi(catData, "categories");
        const parsedStores = getArrayFromApi(storeData, "stores");

        setCategories(parsedCategories);
        setStores(parsedStores);
      } catch (error) {
        console.error("Failed to fetch references:", error);
        Swal.fire({
          icon: "error",
          title: "Reference data failed",
          text: "Categories or stores could not be loaded. Please check your connection and refresh the page.",
        });
      } finally {
        setIsLoadingRefs(false);
      }
    };

    fetchReferences();
  }, []);

  // ─── CORE HANDLERS ───────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // ─── FAQ HANDLERS ────────────────────────────────────────────────────────
  const addFaq = () => {
    if (formData.faqs.length >= 15) {
      Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "You can add a maximum of 15 FAQs per blog post.",
      });
      return;
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

  // ─── STORES HANDLERS ─────────────────────────────────────────────────────
  const toggleStore = (storeId) => {
    setFormData((prev) => {
      const current = prev.relatedStores;
      if (current.includes(storeId)) {
        return {
          ...prev,
          relatedStores: current.filter((id) => id !== storeId),
        };
      } else {
        if (current.length >= 10) {
          Swal.fire({
            icon: "warning",
            title: "Limit Reached",
            text: "You can only link up to 10 stores per post.",
          });
          return prev;
        }
        return { ...prev, relatedStores: [...current, storeId] };
      }
    });
  };

  // ─── EMBEDDED BLOCKS HANDLERS ────────────────────────────────────────────
  const addEmbed = () => {
    if (formData.embeddedBlocks.length >= 30) {
      Swal.fire({
        icon: "warning",
        title: "Limit Reached",
        text: "You can add a maximum of 30 embed blocks per post.",
      });
      return;
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
    if (isButtonField) {
      newBlocks[index].button[field] = value;
    } else {
      newBlocks[index][field] = value;
    }
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

  // ─── SUBMIT HANDLER (API INTEGRATION) ────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      return Swal.fire({
        icon: "error",
        title: "Missing Category",
        text: "Please select a primary category before saving.",
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
      const response = await fetch("/api/admin/blogs", {
        method: "POST",
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
        throw new Error(data.error || "Failed to save post due to an unknown server error.");
      }

      await Swal.fire({
        icon: "success",
        title: "Post Created!",
        text: "Your blog post has been successfully saved and published.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/blogs");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        html: error.message || "We couldn't save your post. Please check your inputs and try again.",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight">
                  Write Editorial Post
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[12px] font-medium text-[#7775A0] flex items-center gap-1">
                    <Clock size={14} /> Auto-calculates read time
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[#E0DEF5]" />
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${formData.status === "published" ? "text-[#22B07D]" : "text-[#FF6B35]"}`}
                  >
                    {formData.status === "published" ? "Live on Site" : "Draft"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || !formData.title || isLoadingRefs}
                className={`flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-all ${isSubmitting || !formData.title ? "bg-[#FF6B35]/40 text-white cursor-not-allowed" : "bg-[#FF6B35] hover:bg-[#e05520] text-white"}`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSubmitting ? "Saving..." : "Save Post"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* ─── SINGLE COLUMN FULL-WIDTH LAYOUT ─── */}
            
            {/* 1. Title & Excerpt */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-[#7775A0] mb-2 uppercase tracking-wider">
                  Headline <span className="text-[#E24B4A]">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  onBlur={generateSlug}
                  maxLength={220}
                  required
                  placeholder="Enter a highly-converting, SEO-optimized title..."
                  className="w-full px-0 text-[32px] font-bold text-[#1A1340] placeholder:text-[#E0DEF5] border-none focus:ring-0 outline-none leading-tight"
                />
              </div>
              <div className="pt-4 border-t border-[#F7F6FF]">
                <label className="block text-[12px] font-bold text-[#7775A0] mb-2 uppercase tracking-wider">
                  Article Teaser (Excerpt){" "}
                  <span className="text-[#E24B4A]">*</span>
                </label>
                <textarea
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="A 1-2 sentence summary for the blog listing card (Max 400 chars)..."
                  rows={2}
                  maxLength={400}
                  required
                  className="w-full px-4 py-3 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[15px] text-[#7775A0] italic focus:border-[#2D2380] outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* 2. Status & Taxonomy */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
              <SectionHeader title="Status & Taxonomy" icon={Settings} />
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Primary Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380] disabled:opacity-50"
                    disabled={isLoadingRefs}
                  >
                    <option value="">
                      {isLoadingRefs
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0] text-[12px] font-mono select-none">
                      /blog/
                    </span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      maxLength={200}
                      required
                      className="w-full pl-[52px] pr-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] font-mono text-[#2D2380] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                  Keywords / Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. tech, mobile, saving"
                  className="w-full px-4 py-2.5 bg-white border border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                />
                <p className="text-[11px] text-[#7775A0] mt-1.5 leading-snug">
                  Comma separated. Max 60 chars per tag.
                </p>
              </div>
            </div>

            {/* 3. Connected Custom Text Editor */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-sm overflow-visible flex flex-col">
              <div className="bg-[#1A1340] p-3 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-4 text-white/50">
                  <Type size={18} />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[#F4A836]">
                    Content Editor
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E24B4A]" />
                  <div className="w-3 h-3 rounded-full bg-[#F4A836]" />
                  <div className="w-3 h-3 rounded-full bg-[#22B07D]" />
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

            {/* 4. Dynamic Embedded Blocks */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-[#E0DEF5] pb-4">
                <div className="flex items-center gap-2">
                  <Component size={20} className="text-[#2D2380]" />
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1A1340]">
                      Dynamic Embeds (Products & CTAs)
                    </h2>
                    <p className="text-[12px] text-[#7775A0]">
                      Create high-converting UI blocks and paste their token
                      into the text editor.
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
                      {/* Token Bar */}
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

                      {/* Fields */}
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
                              value={block.button.text}
                              onChange={(e) =>
                                updateEmbed(idx, "text", e.target.value, true)
                              }
                              className="w-full bg-white border border-[#E0DEF5] rounded-lg px-3 py-2 text-[13px] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                              Button Link / Coupon
                            </label>
                            <input
                              type="text"
                              value={block.button.url}
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

            {/* 5. FAQs */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-[#E0DEF5] pb-4">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion
                    size={20}
                    className="text-[#2D2380]"
                  />
                  <div>
                    <h2 className="text-[16px] font-bold text-[#1A1340]">
                      Structured FAQs
                    </h2>
                    <p className="text-[12px] text-[#7775A0]">
                      Generates Schema.org JSON-LD ({formData.faqs.length}/15)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addFaq}
                  disabled={formData.faqs.length >= 15}
                  className="flex items-center gap-1.5 text-[#2D2380] font-bold text-[13px] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
                >
                  <Plus size={16} /> Add FAQ
                </button>
              </div>
              <div className="space-y-4">
                {formData.faqs.length === 0 ? (
                  <div className="text-center py-8 bg-[#F7F6FF] border-2 border-dashed border-[#E0DEF5] rounded-lg">
                    <p className="text-[#7775A0] text-[14px] italic">
                      No FAQs added.
                    </p>
                  </div>
                ) : (
                  formData.faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-[#F7F6FF] border border-[#E0DEF5] rounded-xl relative group"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            faqs: prev.faqs.filter((_, i) => i !== idx),
                          }))
                        }
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
                  ))
                )}
              </div>
            </div>

            {/* 6. Author Setup */}
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
                    onChange={(e) =>
                      handleAuthorChange("name", e.target.value)
                    }
                    maxLength={120}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Role/Title
                  </label>
                  <input
                    type="text"
                    value={formData.author.role}
                    onChange={(e) =>
                      handleAuthorChange("role", e.target.value)
                    }
                    maxLength={80}
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
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 7. Dual-Mode Featured Image Upload */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader title="Featured Image" icon={ImageIcon} />

              {/* Toggle: Upload vs Link */}
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
                          alt={formData.featuredImage.alt}
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
                maxLength={200}
                className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
              />
            </div>

            {/* 8. SEO Block */}
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
                  placeholder="Defaults to Headline if empty"
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

            {/* 9. Internal Linking (Multi-Select Stores) */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
              <SectionHeader
                title="Related Stores"
                icon={Store}
                badge={`${formData.relatedStores.length}/10`}
              />
              {isLoadingRefs ? (
                <p className="text-[12px] text-[#7775A0] italic">
                  Loading stores...
                </p>
              ) : stores.length === 0 ? (
                <p className="text-[12px] text-[#7775A0] italic">
                  No stores available.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-2">
                  {stores.map((s) => {
                    const storeId = s._id || s.id;
                    const isChecked =
                      formData.relatedStores.includes(storeId);
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
              )}
              <p className="text-[11px] text-[#7775A0] pt-2">
                Link up to 10 stores to pass internal link equity.
              </p>
            </div>

          </div>
        </form>

        {/* ─── QUICK FIELD GUIDE ─── */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Editorial Publishing Guide
            </h2>
          </div>
          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            Writing content here isn't just about text; it's about making money
            and ranking on Google. Follow this simple English guide to use all
            the features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <Component size={16} /> How to add Products & Buttons (Dynamic
                Embeds)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">What it does:</span>{" "}
                This is how you insert beautiful product cards or buttons into
                your article without writing messy code.
                <br />
                <br />
                <span className="font-semibold text-white">How to use it:</span>
                <br />
                1. Click <b>"Create Embed"</b> above.
                <br />
                2. Fill in the details (like the Product Name, Price, and Amazon
                Link).
                <br />
                3. Click <b>"Copy Token"</b>. It will copy a shortcode like{" "}
                <code>{`{{embed:item-123}}`}</code>.<br />
                4. <b>Paste that shortcode</b> into the big text editor exactly
                where you want the product card to appear!
              </p>
            </div>
            <div className="space-y-1 bg-[rgba(34,176,125,0.1)] border border-[rgba(34,176,125,0.3)] p-4 rounded-lg">
              <h3 className="text-[#22B07D] font-bold text-[14px] flex items-center gap-2">
                <MessageCircleQuestion size={16} /> Structured FAQs (Google
                Secret)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">What it does:</span>{" "}
                Adding FAQs here creates hidden code that Google loves. It
                allows Google to show your Questions & Answers directly on the
                Search page.
                <br />
                <br />
                <span className="font-semibold text-white">Rule:</span> Keep
                your answers short (3-4 sentences max). You can add up to 15
                questions per article.
              </p>
            </div>
            <div className="space-y-1 p-4">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Author & Trust (E-E-A-T)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">What it does:</span>{" "}
                Google ranks sites higher if they know real experts are writing
                the content.
                <br />
                <br />
                <span className="font-semibold text-white">Rule:</span> Always
                use "Sociantech Team" and "Deal Expert" for general tips. If it
                is a deep-dive review, use the real editor's name.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}