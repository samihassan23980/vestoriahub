"use client";

/*
 * Admin interface for editing an existing category.
 * Handles client-side validation, type-aware hierarchy filtering,
 * automatic resetting of incompatible parent assignments, and actionable API error feedback.
 */

import React, { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Layers,
  FileText,
  Settings,
  Store as StoreIcon,
  FolderTree,
  Search,
  Check,
  Loader2,
  BookOpen,
  LayoutTemplate,
  Star,
  Plus,
  X,
  Palette,
  ExternalLink,
  AlertCircle,
  Network,
} from "lucide-react";

const EditCategoryPage = ({ params }) => {
  const router = useRouter();
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;

  const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ""));

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [parentCategories, setParentCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [featureInput, setFeatureInput] = useState("");
  const [storeLimitWarning, setStoreLimitWarning] = useState(false);

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    slug: "",
    type: "general",
    shortDescription: "",
    description: "",
    icon: "",
    status: "active",
    isFeatured: false,
    featuredOrder: 0,
    parentId: "",
    sortOrder: 1000,
    bestStores: [],
    image: { url: "", alt: "" },
    uiConfig: {
      heroBanner: { url: "", alt: "" },
      heroHeadline: "",
      heroSubtitle: "",
      themeColor: "#FF6B35",
      keyFeatures: [],
    },
    aggregateRating: {
      ratingValue: 0,
      reviewCount: 0,
    },
    seo: {
      metaTitle: "",
      metaDescription: "",
      canonicalUrl: "",
      indexable: true,
    },
    level: 0,
    ancestors: [],
    updatedAt: "",
  });

  /* ------------------------------------------------------------------ */
  /*                              Helpers                               */
  /* ------------------------------------------------------------------ */
  const getMongoId = (item) => {
    if (!item) return "";
    if (typeof item === "string") return item;
    if (item._id) return String(item._id);
    if (item.id) return String(item.id);
    return "";
  };

  const getArrayFromApi = (payload, possibleKeys = []) => {
    if (Array.isArray(payload)) return payload;
    for (const key of possibleKeys) {
      if (Array.isArray(payload?.[key])) return payload[key];
      if (Array.isArray(payload?.data?.[key])) return payload.data[key];
    }
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
    if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
    if (Array.isArray(payload?.data?.stores)) return payload.data.stores;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.docs)) return payload.docs;
    if (Array.isArray(payload?.results)) return payload.results;
    return [];
  };

  /* ------------------------------------------------------------------ */
  /*                           Data Fetching                            */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        let category = null;

        if (isValidObjectId(slug)) {
          const res = await fetch(`/api/admin/categories/${slug}`);
          if (res.ok) {
            const json = await res.json();
            category = json?.data?.category || json?.category || json?.data || json;
          }
        }

        if (!category) {
          const res = await fetch(
            `/api/admin/categories?search=${encodeURIComponent(slug)}&limit=50`
          );

          if (res.ok) {
            const json = await res.json();
            const list = getArrayFromApi(json, ["categories", "items", "docs", "results"]);

            category =
              list.find((item) => String(item.slug) === String(slug)) ||
              list.find((item) => String(getMongoId(item)) === String(slug)) ||
              null;
          }
        }

        if (!category) {
          throw new Error("Category record not found.");
        }

        const normalized = {
          _id: getMongoId(category),
          name: category.name || "",
          slug: category.slug || "",
          type: category.type || "general",
          shortDescription: category.shortDescription || "",
          description: category.description || "",
          icon: category.icon || "",
          status: category.status || "active",
          isFeatured: !!category.isFeatured,
          featuredOrder: category.featuredOrder || 0,
          parentId: getMongoId(category.parentId) || "",
          sortOrder: category.sortOrder || 1000,
          bestStores: Array.isArray(category.bestStores)
            ? category.bestStores.map((s) => getMongoId(s))
            : [],
          image: {
            url: category.image?.url || "",
            alt: category.image?.alt || "",
          },
          uiConfig: {
            heroBanner: {
              url: category.uiConfig?.heroBanner?.url || "",
              alt: category.uiConfig?.heroBanner?.alt || "",
            },
            heroHeadline: category.uiConfig?.heroHeadline || "",
            heroSubtitle: category.uiConfig?.heroSubtitle || "",
            themeColor: category.uiConfig?.themeColor || "#FF6B35",
            keyFeatures: Array.isArray(category.uiConfig?.keyFeatures)
              ? category.uiConfig.keyFeatures
              : [],
          },
          aggregateRating: {
            ratingValue: category.aggregateRating?.ratingValue || 0,
            reviewCount: category.aggregateRating?.reviewCount || 0,
          },
          seo: {
            metaTitle: category.seo?.metaTitle || "",
            metaDescription: category.seo?.metaDescription || "",
            canonicalUrl: category.seo?.canonicalUrl || "",
            indexable:
              category.seo?.indexable !== undefined
                ? category.seo.indexable
                : true,
          },
          level: category.level || 0,
          ancestors: category.ancestors || [],
          updatedAt: category.updatedAt || "",
        };
        setFormData(normalized);
      } catch (err) {
        console.error(err);
        await Swal.fire({
          icon: "error",
          title: "Failed to Load",
          text: err.message || "Could not retrieve category details.",
          confirmButtonColor: "#E24B4A",
        });
        router.push("/admin/categories");
      } finally{
        setLoading(false);
      }
    };
    fetchCategory();
  }, [slug]);

  /* Fetch potential parent categories and active stores once ID is available */
  useEffect(() => {
    if (!formData._id) return;
    const fetchParentsAndStores = async () => {
      try {
        const catRes = await fetch("/api/admin/categories?limit=100&status=active");
        let categoryList = [];
        if (catRes.ok) {
          const data = await catRes.json();
          categoryList = getArrayFromApi(data, ["categories", "items", "docs"]);
        }

        const map = {};
        categoryList.forEach((c) => {
          const id = getMongoId(c);
          if (id) map[id] = c;
        });
        const currentId = getMongoId(formData._id);

        const filtered = categoryList
          .filter((cat) => {
            const id = getMongoId(cat);
            if (!id || String(id) === String(currentId)) return false;

            const anc = Array.isArray(cat.ancestors)
              ? cat.ancestors.map((a) => getMongoId(a))
              : [];
            return !anc.includes(String(currentId)) && Number(cat.level || 0) < 2;
          })
          .map((cat) => {
            const id = getMongoId(cat);
            const parentId = getMongoId(cat.parentId);
            const parent = parentId ? map[parentId] : null;
            return {
              id,
              name: cat.name,
              type: cat.type || "general",
              level: Number(cat.level || 0),
              parentName: parent?.name || "",
            };
          });
        setParentCategories(filtered);
      } catch (err) {
        console.error("Error fetching parent options:", err);
        setParentCategories([]);
      }

      try {
        const storeRes = await fetch("/api/admin/stores?limit=100&status=active");
        let storeList = [];
        if (storeRes.ok) {
          const storeData = await storeRes.json();
          storeList = getArrayFromApi(storeData, ["stores", "items", "docs"]).map((s) => ({
            ...s,
            id: getMongoId(s),
          }));
        }
        setStores(storeList);
      } catch (err) {
        console.warn("Stores API unavailable:", err);
        setStores([]);
      }
    };
    fetchParentsAndStores();
  }, [formData._id]);

  /* Filter parents based on selected Module Type */
  const eligibleParents = useMemo(() => {
    return parentCategories.filter(
      (cat) => cat.type === formData.type || cat.type === "general"
    );
  }, [parentCategories, formData.type]);

  /* Reset selected parentId if changing Module Type invalidates current choice */
  useEffect(() => {
    if (!formData.parentId) return;
    const selectedParent = parentCategories.find((c) => String(c.id) === String(formData.parentId));
    if (selectedParent && selectedParent.type !== formData.type && selectedParent.type !== "general") {
      setFormData((prev) => ({ ...prev, parentId: "" }));
    }
  }, [formData.type, parentCategories, formData.parentId]);

  /* ------------------------------------------------------------------ */
  /*                             Validation                             */
  /* ------------------------------------------------------------------ */
  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Category name is required";
    if (!formData.slug.trim()) errs.slug = "Slug is required";
    if (formData.slug.length > 160) errs.slug = "Slug must be at most 160 characters";

    const validTypes = ["store", "blog", "product", "general"];
    if (!validTypes.includes(formData.type)) {
      errs.type = "Please select a valid module type";
    }

    if (formData.shortDescription.length > 300) {
      errs.shortDescription = "Short description must be at most 300 characters";
    }
    if (formData.description.length > 5000) {
      errs.description = "Description must be at most 5000 characters";
    }
    if (formData.uiConfig.keyFeatures.length > 8) {
      errs.keyFeatures = "You can specify up to 8 key features";
    }
    if (formData.uiConfig.keyFeatures.some((f) => f.length > 60)) {
      errs.keyFeatures = "Each key feature must be at most 60 characters";
    }
    if (formData.bestStores.length > 10) {
      errs.bestStores = "You can select a maximum of 10 stores";
    }
    if (formData.aggregateRating.ratingValue < 0 || formData.aggregateRating.ratingValue > 5) {
      errs.ratingValue = "Rating must be between 0 and 5";
    }
    if (formData.aggregateRating.reviewCount < 0) {
      errs.reviewCount = "Review count cannot be negative";
    }
    if (formData.seo.metaTitle.length > 120) {
      errs.metaTitle = "Meta title must be at most 120 characters";
    }
    if (formData.seo.metaDescription.length > 320) {
      errs.metaDescription = "Meta description must be at most 320 characters";
    }

    const urlRegex = /^(https?:\/\/[^\s]+)$/i;
    if (formData.image.url && !urlRegex.test(formData.image.url)) {
      errs.imageUrl = "Thumbnail image URL must be a valid http/https URL";
    }
    if (formData.uiConfig.heroBanner.url && !urlRegex.test(formData.uiConfig.heroBanner.url)) {
      errs.heroBannerUrl = "Hero banner URL must be a valid http/https URL";
    }
    if (formData.seo.canonicalUrl && !urlRegex.test(formData.seo.canonicalUrl)) {
      errs.canonicalUrl = "Canonical URL must be a valid http/https URL";
    }

    if (getSimulatedLevel() > 2) {
      errs.parentId = "Cannot select this parent. Maximum allowed tree depth is Level 2.";
    }
    return errs;
  };

  /* ------------------------------------------------------------------ */
  /*                           Event Handlers                           */
  /* ------------------------------------------------------------------ */
  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleDeepNestedChange = (category, subCategory, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subCategory]: {
          ...prev[category][subCategory],
          [field]: value,
        },
      },
    }));
  };

  const toggleStoreSelection = (storeId) => {
    setFormData((prev) => {
      const isSelected = prev.bestStores.includes(storeId);
      if (!isSelected && prev.bestStores.length >= 10) {
        setStoreLimitWarning(true);
        setTimeout(() => setStoreLimitWarning(false), 3000);
        return prev;
      }
      return {
        ...prev,
        bestStores: isSelected
          ? prev.bestStores.filter((id) => id !== storeId)
          : [...prev.bestStores, storeId],
      };
    });
  };

  const addKeyFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    if (formData.uiConfig.keyFeatures.length >= 8) {
      setErrors((prev) => ({ ...prev, keyFeatures: "Maximum 8 key features allowed" }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      uiConfig: {
        ...prev.uiConfig,
        keyFeatures: [...prev.uiConfig.keyFeatures, trimmed],
      },
    }));
    setFeatureInput("");
    setErrors((prev) => ({ ...prev, keyFeatures: null }));
  };

  const removeKeyFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      uiConfig: {
        ...prev.uiConfig,
        keyFeatures: prev.uiConfig.keyFeatures.filter((_, i) => i !== index),
      },
    }));
  };

  const getSimulatedLevel = () => {
    if (!formData.parentId) return 0;
    const parent = parentCategories.find((c) => String(c.id) === String(formData.parentId));
    return parent ? Number(parent.level || 0) + 1 : 0;
  };

  /* ------------------------------------------------------------------ */
  /*                            Submit Flow                             */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      await Swal.fire({
        icon: "warning",
        title: "Validation Issue",
        text: "Please review and fix the highlighted inline form errors.",
        confirmButtonColor: "#FF6B35",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { _id, level, ancestors, updatedAt, ...payload } = formData;
      const res = await fetch(`/api/admin/categories/${_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = resData?.error || "Failed to update category.";
        const solutionText = resData?.solution ? `\n\nSolution: ${resData.solution}` : "";

        if (resData?.details && Array.isArray(resData.details)) {
          const apiFieldErrors = {};
          resData.details.forEach((item) => {
            if (item.field) apiFieldErrors[item.field] = item.message;
          });
          setErrors(apiFieldErrors);
        }

        throw new Error(`${errorMessage}${solutionText}`);
      }

      await Swal.fire({
        icon: "success",
        title: "Category Updated",
        text: resData?.message || "The category changes have been saved successfully.",
        confirmButtonColor: "#22B07D",
      });

      router.push("/admin/categories");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      await Swal.fire({
        icon: "error",
        title: "Action Required",
        text: error.message || "An unexpected error occurred.",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({ label, name, checked, onChange, activeBg }) => (
    <label className="flex items-center justify-between p-4 border border-[#E0DEF5] rounded-lg cursor-pointer hover:bg-[#F7F6FF] transition-colors">
      <span className="text-[#1A1340] font-semibold text-[13px]">{label}</span>
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
        ></div>
        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        ></div>
      </div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6FF]">
        <Loader2 size={32} className="animate-spin text-[#2D2380]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        <form id="edit-category-form" onSubmit={handleSubmit} noValidate>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/categories"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                    <FolderTree size={24} className="text-[#F4A836]" />
                    Edit Category: {formData.name || slug}
                  </h1>
                  {formData.status === "active" && (
                    <span className="px-2 py-0.5 bg-[#22B07D]/15 text-[#22B07D] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
                      Active
                    </span>
                  )}
                  {formData.status === "inactive" && (
                    <span className="px-2 py-0.5 bg-[#E24B4A]/15 text-[#E24B4A] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#E24B4A]/20">
                      Inactive
                    </span>
                  )}
                </div>
                {formData.updatedAt && (
                  <p className="text-[#7775A0] text-[13px] mt-0.5">
                    Last updated {formData.updatedAt.split("T")[0]}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={`/categories/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] hover:border-[#4A3DBF] px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors duration-150"
              >
                <ExternalLink size={16} className="text-[#7775A0]" />
                View Live
              </a>
              <button
                type="submit"
                form="edit-category-form"
                disabled={
                  isSubmitting || !formData.name.trim() || !formData.slug.trim()
                }
                className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-all duration-150 ${
                  isSubmitting || !formData.name.trim() || !formData.slug.trim()
                    ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                    : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* LEFT COLUMN - Main Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Category Identity */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Layers size={18} className="text-[#2D2380]" />
                  Category Identity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Category Name <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleBasicChange}
                      maxLength={120}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                    />
                    {errors.name && (
                      <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center justify-between text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      <span>
                        URL Slug <span className="text-[#E24B4A]">*</span>
                      </span>
                      <span className="text-[11px] text-[#E24B4A] flex items-center gap-1">
                        <AlertCircle size={10} /> Modifying impacts SEO
                      </span>
                    </label>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleBasicChange}
                      maxLength={160}
                      className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#E24B4A] outline-none transition-all lowercase"
                    />
                    {errors.slug && (
                      <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.slug}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center justify-between text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      <span>Nav Icon</span>
                      <span className="text-[#7775A0] text-[11px] font-normal">
                        (Emoji or SVG path)
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[#F7F6FF] border border-[#E0DEF5] flex items-center justify-center text-[20px] shrink-0 shadow-inner">
                        {formData.icon || (
                          <Layers size={20} className="text-[#E0DEF5]" />
                        )}
                      </div>
                      <input
                        type="text"
                        name="icon"
                        value={formData.icon}
                        onChange={handleBasicChange}
                        placeholder="e.g. 💻 or /icons/tech.svg"
                        maxLength={200}
                        className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Thumbnail Image URL (Lists/Grids)
                    </label>
                    <input
                      type="url"
                      value={formData.image.url}
                      onChange={(e) =>
                        handleNestedChange("image", "url", e.target.value)
                      }
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                    />
                    {errors.imageUrl && (
                      <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.imageUrl}
                      </p>
                    )}
                    <input
                      type="text"
                      value={formData.image.alt}
                      onChange={(e) =>
                        handleNestedChange("image", "alt", e.target.value)
                      }
                      placeholder="Image alt text"
                      maxLength={160}
                      className="w-full mt-2 px-4 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic UI Configuration (Hero Section) */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <LayoutTemplate size={18} className="text-[#2D2380]" />
                  Dynamic UI Configuration (Hero Section)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Hero Headline
                    </label>
                    <input
                      type="text"
                      value={formData.uiConfig.heroHeadline}
                      onChange={(e) =>
                        handleNestedChange(
                          "uiConfig",
                          "heroHeadline",
                          e.target.value
                        )
                      }
                      placeholder="Overrides category name if set"
                      maxLength={150}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-2">
                      <Palette size={14} className="text-[#7775A0]" /> Theme Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.uiConfig.themeColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "uiConfig",
                            "themeColor",
                            e.target.value
                          )
                        }
                        className="w-10 h-10 rounded border border-[#E0DEF5] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.uiConfig.themeColor}
                        onChange={(e) =>
                          handleNestedChange(
                            "uiConfig",
                            "themeColor",
                            e.target.value
                          )
                        }
                        placeholder="#HEXCODE"
                        className="flex-1 px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] font-mono text-[#1A1340] focus:border-[#2D2380] outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Hero Subtitle
                  </label>
                  <textarea
                    value={formData.uiConfig.heroSubtitle}
                    onChange={(e) =>
                      handleNestedChange(
                        "uiConfig",
                        "heroSubtitle",
                        e.target.value
                      )
                    }
                    placeholder="Subtitle displayed in the main hero banner..."
                    rows={2}
                    maxLength={300}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Hero Banner Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.uiConfig.heroBanner.url}
                    onChange={(e) =>
                      handleDeepNestedChange(
                        "uiConfig",
                        "heroBanner",
                        "url",
                        e.target.value
                      )
                    }
                    placeholder="Large background/banner image URL..."
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                  />
                  {errors.heroBannerUrl && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.heroBannerUrl}
                    </p>
                  )}
                  <input
                    type="text"
                    value={formData.uiConfig.heroBanner.alt}
                    onChange={(e) =>
                      handleDeepNestedChange(
                        "uiConfig",
                        "heroBanner",
                        "alt",
                        e.target.value
                      )
                    }
                    placeholder="Hero banner alt text"
                    maxLength={200}
                    className="w-full mt-2 px-4 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Key Features (Bullet Points)
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addKeyFeature())
                      }
                      placeholder="e.g. Free Shipping"
                      className="flex-1 px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                    <button
                      type="button"
                      onClick={addKeyFeature}
                      className="bg-[#EEEDFE] text-[#2D2380] px-4 rounded-lg font-bold hover:bg-[#E0DEF5] transition-colors flex items-center gap-1"
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                  {errors.keyFeatures && (
                    <p className="text-[#E24B4A] text-[11px] mb-2 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.keyFeatures}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {formData.uiConfig.keyFeatures.map((feature, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#F7F6FF] border border-[#E0DEF5] text-[#1A1340] text-[13px] font-medium rounded-full"
                      >
                        {feature}
                        <button
                          type="button"
                          onClick={() => removeKeyFeature(idx)}
                          className="text-[#7775A0] hover:text-[#E24B4A] transition-colors ml-1"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editorial Content */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <FileText size={18} className="text-[#2D2380]" />
                  Landing Page Content
                </h2>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleBasicChange}
                    rows={2}
                    maxLength={300}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                  />
                  {errors.shortDescription && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.shortDescription}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-[#1A1340]">
                      SEO Landing Page Description
                    </label>
                    <span className="text-[11px] text-[#7775A0] bg-[#EEEDFE] px-2 py-0.5 rounded font-bold">
                      HTML/Markdown
                    </span>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleBasicChange}
                    rows={6}
                    maxLength={5000}
                    className="w-full px-4 py-2.5 bg-[#1A1340] border-[1.5px] border-[#1A1340] rounded-lg text-[13px] font-mono text-[#F7F6FF] focus:border-[#2D2380] outline-none resize-y"
                  />
                  {errors.description && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Curated Stores */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <div className="flex items-center justify-between border-b border-[#E0DEF5] pb-4">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2">
                    <StoreIcon size={18} className="text-[#2D2380]" />
                    Curated Best Stores
                  </h2>
                  <span
                    className={`text-[12px] font-medium px-2 py-0.5 rounded ${
                      formData.bestStores.length === 10
                        ? "bg-[#FCEBEB] text-[#E24B4A]"
                        : "bg-[#EEEDFE] text-[#2D2380]"
                    }`}
                  >
                    {formData.bestStores.length} / 10 Selected
                  </span>
                </div>
                {storeLimitWarning && (
                  <div className="p-2.5 bg-[#FCEBEB] border border-[#E24B4A]/20 rounded-lg text-[#E24B4A] text-[12px] font-semibold flex items-center gap-2">
                    <AlertCircle size={14} /> Maximum 10 stores allowed per category.
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stores.length === 0 ? (
                    <p className="text-[13px] text-[#7775A0]">
                      No active stores available to curate.
                    </p>
                  ) : (
                    stores.map((store) => {
                      const isSelected = formData.bestStores.includes(store.id);
                      const isDisabled =
                        !isSelected && formData.bestStores.length >= 10;
                      return (
                        <button
                          key={store.id}
                          type="button"
                          onClick={() => toggleStoreSelection(store.id)}
                          disabled={isDisabled}
                          className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-[1.5px] transition-all ${
                            isSelected
                              ? "border-[#2D2380] bg-[#EEEDFE]"
                              : isDisabled
                              ? "border-[#E0DEF5] bg-[#F7F6FF] opacity-50 cursor-not-allowed"
                              : "border-[#E0DEF5] bg-white hover:border-[#4A3DBF]"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-white border border-[#E0DEF5] flex items-center justify-center mb-2 shadow-sm font-bold text-[#2D2380]">
                            {store.logo || store.name.charAt(0)}
                          </div>
                          <span
                            className={`text-[12px] font-bold text-center line-clamp-1 ${
                              isSelected ? "text-[#2D2380]" : "text-[#1A1340]"
                            }`}
                          >
                            {store.name}
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-[#2D2380]">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* Taxonomy Setup & Module Type */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <FolderTree size={18} className="text-[#2D2380]" /> Taxonomy
                  Setup
                </h2>
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-[#1A1340] border border-[#1A1340]">
                  <Layers size={16} className="text-[#F4A836]" />
                  <div className="flex-1">
                    <span className="block text-white text-[12px] font-semibold">
                      Current Hierarchy Level
                    </span>
                    <span className="text-[#F4A836] text-[11px] font-bold uppercase tracking-wider">
                      Level {formData.level} (L{formData.level})
                    </span>
                  </div>
                </div>

                {/* Module Type Selection */}
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Module Type <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                  >
                    <option value="general">General (Default)</option>
                    <option value="store">Store</option>
                    <option value="blog">Blog</option>
                    <option value="product">Product</option>
                  </select>
                  {errors.type && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.type}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center justify-between text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    <span>Parent Category</span>
                    <span className="text-[11px] text-[#F4A836] flex items-center gap-1">
                      <AlertCircle size={10} /> Triggers rebuild
                    </span>
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="">None (Top-Level Root Category)</option>
                    <optgroup label="Level 0 Categories">
                      {eligibleParents
                        .filter((c) => c.level === 0)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Level 1 Categories">
                      {eligibleParents
                        .filter((c) => c.level === 1)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.parentName
                              ? `${c.parentName} > ${c.name}`
                              : c.name}{" "}
                            ({c.type})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  {errors.parentId && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.parentId}
                    </p>
                  )}
                  <p className="text-[11px] text-[#7775A0] mt-1.5 leading-snug">
                    Changing the parent category automatically recalculates the
                    hierarchy level and ancestors. Maximum depth is L2.
                  </p>
                </div>
              </div>

              {/* Publishing Settings */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Publishing
                  Settings
                </h2>
                <Toggle
                  label="Category Active"
                  name="status"
                  checked={formData.status === "active"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.checked ? "active" : "inactive",
                    }))
                  }
                  activeBg="bg-[#22B07D]"
                />
                <Toggle
                  label="Featured Category"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isFeatured: e.target.checked,
                    }))
                  }
                  activeBg="bg-[#F4A836]"
                />
                <div>
                  <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                    Featured Order
                  </label>
                  <input
                    type="number"
                    name="featuredOrder"
                    value={formData.featuredOrder}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                    Sort Order (Lower = Shown First)
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              {/* Aggregate Ratings */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Star size={18} className="text-[#F4A836]" /> Aggregate
                  Ratings
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Avg Rating (0-5)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.aggregateRating.ratingValue}
                      onChange={(e) =>
                        handleNestedChange(
                          "aggregateRating",
                          "ratingValue",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                    {errors.ratingValue && (
                      <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.ratingValue}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Total Reviews
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.aggregateRating.reviewCount}
                      onChange={(e) =>
                        handleNestedChange(
                          "aggregateRating",
                          "reviewCount",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                    {errors.reviewCount && (
                      <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.reviewCount}
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-[#7775A0] leading-tight mt-1">
                  Used for rich snippets in Google Search Results. Set to 0 to
                  disable.
                </p>
              </div>

              {/* SEO Metadata */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Search size={18} className="text-[#2D2380]" /> SEO Metadata
                </h2>
                <Toggle
                  label="Allow Indexing"
                  name="indexable"
                  checked={formData.seo.indexable}
                  onChange={(e) =>
                    handleNestedChange("seo", "indexable", e.target.checked)
                  }
                  activeBg="bg-[#22B07D]"
                />
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) =>
                      handleNestedChange("seo", "metaTitle", e.target.value)
                    }
                    maxLength={120}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                  {errors.metaTitle && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.metaTitle}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) =>
                      handleNestedChange(
                        "seo",
                        "metaDescription",
                        e.target.value
                      )
                    }
                    rows={3}
                    maxLength={320}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                  />
                  {errors.metaDescription && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.metaDescription}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1">
                    Canonical URL
                  </label>
                  <input
                    type="url"
                    value={formData.seo.canonicalUrl}
                    onChange={(e) =>
                      handleNestedChange("seo", "canonicalUrl", e.target.value)
                    }
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                  {errors.canonicalUrl && (
                    <p className="text-[#E24B4A] text-[11px] mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} /> {errors.canonicalUrl}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* QUICK FIELD GUIDE */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Category Taxonomy Guide
            </h2>
          </div>
          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            Categories organise all content on your platform. Getting the
            structure right is critical for user navigation and Google site
            structure crawling. The <strong>Dynamic UI Config</strong> allows you
            to build rich landing pages for products instantly.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <Network size={16} /> Module Type
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                Use <strong>Module Type</strong> to explicitly separate blog
                categories from store or product categories, ensuring fast and
                isolated filtering on the frontend.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Curated Best Stores
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                Selecting top stores renders a "Top Stores in [Category]" section
                on the category landing page (maximum 10 stores).
              </p>
            </div>
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <LayoutTemplate size={16} /> Dynamic UI Config
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">Hero Section:</span>{" "}
                The <code>uiConfig</code> block controls the top of the category
                landing page. Theme color customizes brand identity, while key
                features highlight selling points.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryPage;