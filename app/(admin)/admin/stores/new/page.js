/* /app/(admin)/admin/stores/new/page.js */
"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MediaUploader from "@/app/Components/media/MediaUploader";
import {
  ArrowLeft,
  Save,
  Store,
  Link as LinkIcon,
  FileText,
  Globe,
  Settings,
  Image as ImageIcon,
  ShieldCheck,
  Building,
  Star,
  Loader2,
  BookOpen,
  MessageCircleQuestion,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const EMPTY_FORM_DATA = {
  name: "",
  slug: "",
  officialUrl: "",
  countryId: "",
  primaryCategoryId: "",
  subCategoryIds: [],
  affiliateNetworkId: "",
  tracking: {
    trackingLink: "",
    defaultSubid: "",
  },
  isActive: true,
  isFeatured: false,
  featuredOrder: 0,
  content: {
    heading: "",
    shortDescription: "",
    longDescription: "",
    whyShop: "",
  },
  policy: {
    shippingInfo: "",
    returnRefundPolicy: "",
  },
  facts: {
    foundedYear: "",
    headquarters: "",
    customerSupport: "",
  },
  images: {
    logo: { url: "", alt: "" },
    thumb: { url: "", alt: "" },
    og: { url: "", alt: "" },
  },
  seo: {
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    indexable: true,
    noFollow: false,
    ogTitle: "",
    ogDescription: "",
  },
  faqs: [],
};

const safeJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const readPath = (object, path) => {
  return path.split(".").reduce((acc, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return acc[key];
  }, object);
};

const extractArrayFromPayload = (payload, preferredPaths = []) => {
  if (Array.isArray(payload)) return payload;

  for (const path of preferredPaths) {
    const value = readPath(payload, path);
    if (Array.isArray(value)) return value;
  }

  const queue = [payload];
  const visited = new Set();

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || typeof current !== "object" || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const value of Object.values(current)) {
      if (Array.isArray(value)) {
        return value;
      }

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return [];
};

const normalizeReferenceItem = (item, fallbackName = "Unnamed") => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const id = item._id || item.id || item.value || item.key || "";

  if (!id) return null;

  return {
    _id: String(id),
    name:
      item.name ||
      item.title ||
      item.label ||
      item.displayName ||
      item.code ||
      fallbackName,
    slug: item.slug || "",
    code: item.code || "",
    status: item.status || "",
  };
};

const normalizeReferenceList = (payload, paths, fallbackName) => {
  return extractArrayFromPayload(payload, paths)
    .map((item) => normalizeReferenceItem(item, fallbackName))
    .filter(Boolean);
};

const fetchReference = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const payload = await safeJson(response);

  if (!response.ok) {
    throw new Error(
      payload?.error || payload?.message || `Failed to fetch ${url}`,
    );
  }

  return payload;
};

const isHttpUrl = (value) => {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

const formatCountryName = (country) => {
  if (!country) return "Unknown Country";
  if (country.name && country.code) return `${country.name} (${country.code})`;
  return country.name || country.code || "Unknown Country";
};

const NewStoreEditor = () => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReferenceLoading, setIsReferenceLoading] = useState(true);
  const [referenceError, setReferenceError] = useState("");
  const [formError, setFormError] = useState("");

  const [categories, setCategories] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [countries, setCountries] = useState([]);

  // ─── STATE MAPPED STRICTLY TO STORE SCHEMA ───────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  // ─── MEDIA MODE STATE ────────────────────────────────────────────────────
  // link = manual URL input, upload = MediaUploader
  const [mediaMode, setMediaMode] = useState({
    logo: "link",
    thumb: "link",
    og: "link",
  });

  // ─── LOAD API REFERENCE DATA ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const loadReferenceData = async () => {
      setIsReferenceLoading(true);
      setReferenceError("");

      const [categoryResult, networkResult, countryResult] =
        await Promise.allSettled([
          fetchReference("/api/public/categories/module/store?limit=100"),
          fetchReference("/api/admin/affiliate-networks?limit=100"),
          fetchReference("/api/admin/countries?limit=250"),
        ]);

      console.log("Reference Data Results:", {
        categoryResult,
        networkResult,
        countryResult,
      });

      if (!mounted) return;

      const failed = [];

      if (categoryResult.status === "fulfilled") {
        const normalizedCategories = normalizeReferenceList(
          categoryResult.value,
          [
            "categories",
            "data.categories",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Category",
        );

        console.log("Normalized Categories:", normalizedCategories);
        setCategories(normalizedCategories);
      } else {
        console.error("Categories API failed:", categoryResult.reason);
        failed.push("categories");
      }

      if (networkResult.status === "fulfilled") {
        const normalizedNetworks = normalizeReferenceList(
          networkResult.value,
          [
            "networks",
            "affiliateNetworks",
            "affiliateNetworkList",
            "data.networks",
            "data.affiliateNetworks",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Network",
        );

        console.log("Normalized Networks:", normalizedNetworks);
        setNetworks(normalizedNetworks);
      } else {
        console.error("Affiliate networks API failed:", networkResult.reason);
        failed.push("affiliate networks");
      }

      if (countryResult.status === "fulfilled") {
        const normalizedCountries = normalizeReferenceList(
          countryResult.value,
          [
            "countries",
            "countryList",
            "data.countries",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Country",
        );

        console.log("Normalized Countries:", normalizedCountries);
        setCountries(normalizedCountries);
      } else {
        console.error("Countries API failed:", countryResult.reason);
        failed.push("countries");
      }

      if (failed.length > 0) {
        setReferenceError(`Could not load ${failed.join(", ")}.`);
      }

      setIsReferenceLoading(false);
    };

    loadReferenceData();

    return () => {
      mounted = false;
    };
  }, []);

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : name === "slug"
            ? slugify(value)
            : value,
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  const handleImageChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: {
          ...prev.images[type],
          [field]: value,
        },
      },
    }));
  };

  const handleUploaderImageChange = (type, uploadedImage) => {
    const image = Array.isArray(uploadedImage)
      ? uploadedImage[0]
      : uploadedImage;

    setFormData((prev) => {
      if (!image) {
        return {
          ...prev,
          images: {
            ...prev.images,
            [type]: {
              url: "",
              alt: "",
            },
          },
        };
      }

      const currentImage = prev.images[type] || {};

      const url = image.url || image.secure_url || image.secureUrl || "";
      const publicId = image.publicId || image.public_id || "";
      const galleryId = image.galleryId || image._id || image.id || "";

      return {
        ...prev,
        images: {
          ...prev.images,
          [type]: {
            ...currentImage,

            // Store schema currently saves url + alt.
            // Extra metadata can stay in form state safely.
            galleryId,
            url,
            publicId,
            title: image.title || image.original_filename || "",
            alt: image.alt || image.title || currentImage.alt || "",
            width: image.width || "",
            height: image.height || "",
            format: image.format || "",
            bytes: image.bytes || "",
          },
        },
      };
    });
  };

  const handleManualImageUrlChange = (type, value) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: {
          // Manual URL mode keeps schema clean and clears upload metadata.
          url: value,
          alt: prev.images[type]?.alt || "",
        },
      },
    }));
  };

  const clearImageField = (type) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: {
          url: "",
          alt: "",
        },
      },
    }));
  };

  // SubCategory Multi-Select (Max 10)
  const toggleSubCategory = (categoryId) => {
    if (!categoryId) return;

    setFormData((prev) => {
      const isSelected = prev.subCategoryIds.includes(categoryId);

      if (!isSelected && prev.subCategoryIds.length >= 10) return prev;

      return {
        ...prev,
        subCategoryIds: isSelected
          ? prev.subCategoryIds.filter((id) => id !== categoryId)
          : [...prev.subCategoryIds, categoryId],
      };
    });
  };

  // FAQ Handlers (Max 20)
  const addFaq = () => {
    if (formData.faqs.length >= 20) return;

    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { question: "", answer: "" }],
    }));
  };

  const updateFaq = (index, field, value) => {
    setFormData((prev) => {
      const newFaqs = [...prev.faqs];

      newFaqs[index] = {
        ...newFaqs[index],
        [field]: value,
      };

      return {
        ...prev,
        faqs: newFaqs,
      };
    });
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const generateSlug = () => {
    if (!formData.name || formData.slug) return;

    setFormData((prev) => ({
      ...prev,
      slug: slugify(prev.name),
    }));
  };

  const validateForm = () => {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!formData.name.trim()) {
      errors.push("Store name is required.");
    }

    if (!formData.slug.trim()) {
      errors.push("URL slug is required.");
    }

    if (!formData.officialUrl.trim()) {
      errors.push("Official website URL is required.");
    } else if (!isHttpUrl(formData.officialUrl)) {
      errors.push("Official website URL must be a valid http/https URL.");
    }

    if (!formData.primaryCategoryId) {
      errors.push("Primary category is required.");
    }

    if (
      formData.tracking.trackingLink &&
      !isHttpUrl(formData.tracking.trackingLink)
    ) {
      errors.push("Master tracking link must be a valid http/https URL.");
    }

    if (formData.images.logo.url && !isHttpUrl(formData.images.logo.url)) {
      errors.push("Logo URL must be a valid http/https URL.");
    }

    if (formData.images.thumb.url && !isHttpUrl(formData.images.thumb.url)) {
      errors.push("Thumbnail URL must be a valid http/https URL.");
    }

    if (formData.images.og.url && !isHttpUrl(formData.images.og.url)) {
      errors.push("Open Graph image URL must be a valid http/https URL.");
    }

    if (formData.seo.canonicalUrl && !isHttpUrl(formData.seo.canonicalUrl)) {
      errors.push("Canonical URL must be a valid http/https URL.");
    }

    if (formData.subCategoryIds.length > 10) {
      errors.push("Secondary categories cannot exceed 10.");
    }

    if (formData.faqs.length > 20) {
      errors.push("FAQs cannot exceed 20.");
    }

    formData.faqs.forEach((faq, index) => {
      if (!faq.question.trim()) {
        errors.push(`FAQ ${index + 1}: question is required.`);
      }

      if (!faq.answer.trim()) {
        errors.push(`FAQ ${index + 1}: answer is required.`);
      }
    });

    if (formData.facts.foundedYear) {
      const foundedYear = Number(formData.facts.foundedYear);

      if (!Number.isFinite(foundedYear)) {
        errors.push("Founded year must be a valid number.");
      }

      if (foundedYear < 1800 || foundedYear > currentYear) {
        errors.push(`Founded year must be between 1800 and ${currentYear}.`);
      }
    }

    return errors;
  };

  const buildPayload = () => ({
    name: formData.name.trim(),
    slug: slugify(formData.slug),
    officialUrl: formData.officialUrl.trim(),

    countryId: formData.countryId || null,
    primaryCategoryId: formData.primaryCategoryId,
    subCategoryIds: formData.subCategoryIds.filter(Boolean).slice(0, 10),

    affiliateNetworkId: formData.affiliateNetworkId || null,

    tracking: {
      trackingLink: formData.tracking.trackingLink.trim(),
      defaultSubid: formData.tracking.defaultSubid.trim(),
    },

    isActive: Boolean(formData.isActive),
    isFeatured: Boolean(formData.isFeatured),
    featuredOrder: Number.isFinite(Number(formData.featuredOrder))
      ? Number(formData.featuredOrder)
      : 0,

    content: {
      heading: formData.content.heading.trim(),
      shortDescription: formData.content.shortDescription.trim(),
      longDescription: formData.content.longDescription.trim(),
      whyShop: formData.content.whyShop.trim(),
    },

    policy: {
      shippingInfo: formData.policy.shippingInfo.trim(),
      returnRefundPolicy: formData.policy.returnRefundPolicy.trim(),
    },

    facts: {
      foundedYear:
        formData.facts.foundedYear === "" ||
        formData.facts.foundedYear === null ||
        formData.facts.foundedYear === undefined
          ? null
          : Number(formData.facts.foundedYear),
      headquarters: formData.facts.headquarters.trim(),
      customerSupport: formData.facts.customerSupport.trim(),
    },

    images: {
      logo: {
        url: formData.images.logo.url.trim(),
        alt: formData.images.logo.alt.trim(),
      },
      thumb: {
        url: formData.images.thumb.url.trim(),
        alt: formData.images.thumb.alt.trim(),
      },
      og: {
        url: formData.images.og.url.trim(),
        alt: formData.images.og.alt.trim(),
      },
    },

    seo: {
      metaTitle: formData.seo.metaTitle.trim(),
      metaDescription: formData.seo.metaDescription.trim(),
      canonicalUrl: formData.seo.canonicalUrl.trim(),
      indexable: Boolean(formData.seo.indexable),
      noFollow: Boolean(formData.seo.noFollow),
      ogTitle: formData.seo.ogTitle.trim(),
      ogDescription: formData.seo.ogDescription.trim(),
    },

    faqs: formData.faqs.map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    })),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const errors = validateForm();

    if (errors.length > 0) {
      setFormError(errors.join(" "));
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      const payload = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || "Failed to save store.",
        );
      }

      router.push("/admin/stores");
      router.refresh();
    } catch (error) {
      console.error("Submission error:", error);
      setFormError(error.message || "Failed to save store.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !isSubmitting &&
    formData.name.trim() &&
    formData.slug.trim() &&
    formData.officialUrl.trim() &&
    formData.primaryCategoryId;

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────
  const Toggle = ({
    label,
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

  const MediaAssetField = ({
    type,
    label,
    folder,
    previewClassName = "w-16 h-16 rounded-xl",
    withBorder = true,
  }) => {
    const image = formData.images[type] || { url: "", alt: "" };
    const mode = mediaMode[type] || "link";

    return (
      <div className={withBorder ? "pt-3 border-t border-[#E0DEF5]" : ""}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-bold text-[#7775A0] uppercase">
            {label}
          </label>

          {image.url && (
            <button
              type="button"
              onClick={() => clearImageField(type)}
              className="text-[11px] font-bold text-[#E24B4A] hover:text-[#b63837] transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex gap-4 items-start">
          <div
            className={`${previewClassName} border border-[#E0DEF5] bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}
          >
            {image.url ? (
              <img
                src={image.url}
                alt={image.alt || label}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <Store size={24} className="text-[#E0DEF5]" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#F7F6FF] border border-[#E0DEF5] p-1">
              <button
                type="button"
                onClick={() =>
                  setMediaMode((prev) => ({
                    ...prev,
                    [type]: "upload",
                  }))
                }
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                  mode === "upload"
                    ? "bg-white text-[#2D2380] shadow-sm"
                    : "text-[#7775A0] hover:text-[#2D2380]"
                }`}
              >
                Upload
              </button>

              <button
                type="button"
                onClick={() =>
                  setMediaMode((prev) => ({
                    ...prev,
                    [type]: "link",
                  }))
                }
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                  mode === "link"
                    ? "bg-white text-[#2D2380] shadow-sm"
                    : "text-[#7775A0] hover:text-[#2D2380]"
                }`}
              >
                Link
              </button>
            </div>

            {mode === "upload" ? (
              <div className="rounded-lg border border-[#E0DEF5] bg-[#F7F6FF] p-3">
                <MediaUploader
                  label={`Upload ${label}`}
                  value={image}
                  onChange={(uploadedImage) =>
                    handleUploaderImageChange(type, uploadedImage)
                  }
                  folder={folder}
                  multiple={false}
                  maxFiles={1}
                />

                {image.url && (
                  <p className="mt-2 truncate text-[11px] text-[#7775A0]">
                    {image.url}
                  </p>
                )}
              </div>
            ) : (
              <input
                type="url"
                value={image.url || ""}
                onChange={(e) =>
                  handleManualImageUrlChange(type, e.target.value)
                }
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
              />
            )}

            <input
              type="text"
              value={image.alt || ""}
              onChange={(e) => handleImageChange(type, "alt", e.target.value)}
              placeholder={`${label} alt text`}
              maxLength={200}
              className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/stores"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <Store size={24} className="text-[#F4A836]" /> Add New Store
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Configure brand identity, affiliate routing, and SEO content.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                !canSubmit
                  ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                  : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Publish Store
            </button>
          </div>

          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E24B4A]/25 bg-[#E24B4A]/10 p-4 text-[14px] font-medium text-[#B63837]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {referenceError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#F4A836]/30 bg-[#F4A836]/10 p-4 text-[14px] font-medium text-[#BA7517]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{referenceError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* ─── LEFT COLUMN (Main Data - Spans 2) ─── */}
            <div className="xl:col-span-2 space-y-6">
              {/* Identity Box */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Store size={18} className="text-[#2D2380]" /> Brand Identity
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Store Name <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleBasicChange}
                      onBlur={generateSlug}
                      placeholder="e.g. Amazon, Nike"
                      maxLength={140}
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
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
                      onChange={handleBasicChange}
                      placeholder="e.g. amazon"
                      maxLength={160}
                      required
                      className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none lowercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Official Website URL{" "}
                    <span className="text-[#E24B4A]">*</span>
                  </label>
                  <p className="text-[11px] text-[#7775A0] mb-2">
                    The store&apos;s real homepage (NOT your affiliate link).
                  </p>
                  <input
                    type="url"
                    name="officialUrl"
                    value={formData.officialUrl}
                    onChange={handleBasicChange}
                    placeholder="https://www.store.com"
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              {/* Tracking & Affiliate Config */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <LinkIcon size={18} className="text-[#2D2380]" /> Affiliate
                  Routing
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Affiliate Network
                    </label>
                    <select
                      name="affiliateNetworkId"
                      value={formData.affiliateNetworkId}
                      onChange={handleBasicChange}
                      className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                    >
                      <option value="">
                        {isReferenceLoading
                          ? "Loading networks..."
                          : "Direct / In-House"}
                      </option>
                      {networks.map((network) => (
                        <option key={network._id} value={network._id}>
                          {network.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Default SubID
                    </label>
                    <input
                      type="text"
                      value={formData.tracking.defaultSubid}
                      onChange={(e) =>
                        handleNestedChange(
                          "tracking",
                          "defaultSubid",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. dealverse-nike"
                      maxLength={100}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Master Tracking Link{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional if network template handles it)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.tracking.trackingLink}
                    onChange={(e) =>
                      handleNestedChange(
                        "tracking",
                        "trackingLink",
                        e.target.value,
                      )
                    }
                    placeholder="https://track.awin.com/awc/12345?clickref={subId}"
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#2D2380] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              {/* Editorial Content */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <FileText size={18} className="text-[#2D2380]" /> SEO &
                  Editorial Copy
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Store Page H1 Heading (Overrides Name)
                  </label>
                  <input
                    type="text"
                    value={formData.content.heading}
                    onChange={(e) =>
                      handleNestedChange("content", "heading", e.target.value)
                    }
                    placeholder="e.g. Nike Promo Codes & Deals"
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    value={formData.content.shortDescription}
                    onChange={(e) =>
                      handleNestedChange(
                        "content",
                        "shortDescription",
                        e.target.value,
                      )
                    }
                    placeholder="1-2 sentences summarizing the brand for search results..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-[#1A1340]">
                      Long SEO Description
                    </label>
                    <span className="text-[11px] text-[#7775A0] bg-[#EEEDFE] px-2 py-0.5 rounded font-bold">
                      Rich Text Allowed
                    </span>
                  </div>
                  <textarea
                    value={formData.content.longDescription}
                    onChange={(e) =>
                      handleNestedChange(
                        "content",
                        "longDescription",
                        e.target.value,
                      )
                    }
                    placeholder="Comprehensive store review, shopping tips, and saving guides..."
                    rows={6}
                    maxLength={15000}
                    className="w-full px-4 py-2.5 bg-[#1A1340] border-[1.5px] border-[#1A1340] rounded-lg text-[13px] font-mono text-[#F7F6FF] focus:border-[#2D2380] outline-none resize-y"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    &quot;Why Shop Here?&quot; (Trust Copy)
                  </label>
                  <textarea
                    value={formData.content.whyShop}
                    onChange={(e) =>
                      handleNestedChange("content", "whyShop", e.target.value)
                    }
                    placeholder="Bullet points on why users should choose this store..."
                    rows={3}
                    maxLength={3000}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#E0DEF5]">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Shipping Policy
                    </label>
                    <textarea
                      value={formData.policy.shippingInfo}
                      onChange={(e) =>
                        handleNestedChange(
                          "policy",
                          "shippingInfo",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Free shipping on orders over $50."
                      rows={2}
                      maxLength={2000}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Return Policy
                    </label>
                    <textarea
                      value={formData.policy.returnRefundPolicy}
                      onChange={(e) =>
                        handleNestedChange(
                          "policy",
                          "returnRefundPolicy",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 30-day hassle-free returns."
                      rows={2}
                      maxLength={2000}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* FAQ Builder */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2 border-b border-[#E0DEF5] pb-4">
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion
                      size={18}
                      className="text-[#2D2380]"
                    />
                    <h2 className="text-[16px] font-bold text-[#1A1340]">
                      Structured FAQs (JSON-LD)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={addFaq}
                    disabled={formData.faqs.length >= 20}
                    className="flex items-center gap-1.5 text-[#2D2380] font-bold text-[13px] hover:text-[#FF6B35] disabled:opacity-50 transition-colors"
                  >
                    <Plus size={16} /> Add FAQ ({formData.faqs.length}/20)
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.faqs.length === 0 ? (
                    <p className="text-center py-6 text-[#7775A0] text-[13px] italic border-2 border-dashed border-[#F7F6FF] rounded-lg">
                      No FAQs added. Add some to generate SEO rich snippets.
                    </p>
                  ) : (
                    formData.faqs.map((faq, idx) => (
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
                            maxLength={200}
                            required
                            className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[14px] font-bold focus:border-[#2D2380] outline-none"
                          />
                          <textarea
                            placeholder="Answer..."
                            value={faq.answer}
                            onChange={(e) =>
                              updateFaq(idx, "answer", e.target.value)
                            }
                            maxLength={1200}
                            required
                            className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none resize-y min-h-[60px]"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (Settings & Media - Spans 1) ─── */}
            <div className="space-y-6">
              {/* Taxonomy & Geo */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Settings size={18} className="text-[#2D2380]" />{" "}
                  Classification
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Primary Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="primaryCategoryId"
                    value={formData.primaryCategoryId}
                    onChange={handleBasicChange}
                    required
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                  >
                    <option value="">
                      {isReferenceLoading
                        ? "Loading categories..."
                        : "Select Primary Category"}
                    </option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-semibold text-[#1A1340]">
                      Secondary Categories
                    </label>
                    <span className="text-[10px] text-[#7775A0] bg-[#EEEDFE] px-2 rounded font-bold">
                      {formData.subCategoryIds.length}/10
                    </span>
                  </div>
                  <div className="max-h-[120px] overflow-y-auto border border-[#E0DEF5] rounded-lg p-2 space-y-1">
                    {categories.length === 0 ? (
                      <p className="text-[12px] text-[#7775A0] px-1.5 py-2">
                        {isReferenceLoading
                          ? "Loading categories..."
                          : "No categories found."}
                      </p>
                    ) : (
                      categories.map((category) => (
                        <label
                          key={category._id}
                          className="flex items-center gap-2 p-1.5 hover:bg-[#F7F6FF] rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.subCategoryIds.includes(
                              category._id,
                            )}
                            onChange={() => toggleSubCategory(category._id)}
                            disabled={
                              !formData.subCategoryIds.includes(category._id) &&
                              formData.subCategoryIds.length >= 10
                            }
                            className="accent-[#2D2380]"
                          />
                          <span className="text-[12px] text-[#1A1340]">
                            {category.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Target Country <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="countryId"
                    value={formData.countryId}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                  >
                    <option value="">Global (All Countries)</option>
                    {countries.map((country) => (
                      <option key={country._id} value={country._id}>
                        {formatCountryName(country)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Globe size={18} className="text-[#2D2380]" /> Publishing
                  Settings
                </h2>
                <Toggle
                  label="Store Active (Live)"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleBasicChange({
                      target: {
                        name: "isActive",
                        type: "checkbox",
                        checked: e.target.checked,
                      },
                    })
                  }
                  icon={Globe}
                  colorClass="text-[#22B07D]"
                  activeBg="bg-[#22B07D]"
                />
                <Toggle
                  label="Feature on Homepage"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    handleBasicChange({
                      target: {
                        name: "isFeatured",
                        type: "checkbox",
                        checked: e.target.checked,
                      },
                    })
                  }
                  icon={Star}
                  colorClass="text-[#F4A836]"
                  activeBg="bg-[#F4A836]"
                />

                {formData.isFeatured && (
                  <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Featured Sort Order (Lower = First)
                    </label>
                    <input
                      type="number"
                      name="featuredOrder"
                      value={formData.featuredOrder}
                      onChange={handleBasicChange}
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                )}
              </div>

              {/* Brand Assets */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <ImageIcon size={18} className="text-[#2D2380]" /> Media
                  Assets
                </h2>

                <MediaAssetField
                  type="logo"
                  label="Square Logo"
                  folder="Products images/stores/logos"
                  withBorder={false}
                />

                <MediaAssetField
                  type="thumb"
                  label="Banner Thumbnail"
                  folder="Products images/stores/thumbnails"
                  previewClassName="w-20 h-12 rounded-lg"
                />

                <MediaAssetField
                  type="og"
                  label="Open Graph Image"
                  folder="Products images/stores/og"
                  previewClassName="w-24 h-14 rounded-lg"
                />
              </div>

              {/* Company Facts */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Building size={18} className="text-[#2D2380]" /> Company
                  Facts
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Founded Year
                    </label>
                    <input
                      type="number"
                      value={formData.facts.foundedYear}
                      onChange={(e) =>
                        handleNestedChange(
                          "facts",
                          "foundedYear",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 1994"
                      min={1800}
                      max={new Date().getFullYear()}
                      className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Headquarters
                    </label>
                    <input
                      type="text"
                      value={formData.facts.headquarters}
                      onChange={(e) =>
                        handleNestedChange(
                          "facts",
                          "headquarters",
                          e.target.value,
                        )
                      }
                      placeholder="Seattle, WA"
                      maxLength={200}
                      className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Block */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Globe size={18} className="text-[#2D2380]" /> SEO Metadata
                </h2>
                <Toggle
                  label="Indexable by Google"
                  checked={formData.seo.indexable}
                  onChange={(e) =>
                    handleNestedChange("seo", "indexable", e.target.checked)
                  }
                  icon={CheckCircle}
                  colorClass="text-[#22B07D]"
                  activeBg="bg-[#22B07D]"
                />
                <Toggle
                  label="NoFollow Outbound Links"
                  checked={formData.seo.noFollow}
                  onChange={(e) =>
                    handleNestedChange("seo", "noFollow", e.target.checked)
                  }
                  icon={AlertCircle}
                  colorClass="text-[#E24B4A]"
                  activeBg="bg-[#E24B4A]"
                />

                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) =>
                      handleNestedChange("seo", "metaTitle", e.target.value)
                    }
                    maxLength={120}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1340] mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={formData.seo.metaDescription}
                    onChange={(e) =>
                      handleNestedChange(
                        "seo",
                        "metaDescription",
                        e.target.value,
                      )
                    }
                    maxLength={320}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* ─── QUICK FIELD GUIDE ─── */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Store Configuration Guide
            </h2>
          </div>

          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            The Store profile is the hub for all coupons related to a brand.
            Getting the URL and network targeting right is critical to ensure
            affiliate tracking functions properly.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Field: URL vs Tracking Link */}
            <div className="space-y-1 md:col-span-2 bg-[rgba(244,168,54,0.1)] border border-[rgba(244,168,54,0.3)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <LinkIcon size={16} /> Official URL vs. Affiliate Tracking Link
                (CRITICAL)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                <span className="font-semibold text-white">
                  Official Website URL:
                </span>{" "}
                This is the clean, organic homepage of the brand (e.g.,{" "}
                <code>https://www.nike.com</code>). We use this for schema
                markup and displaying the store profile cleanly.
                <br />
                <span className="font-semibold text-[#22B07D]">
                  Master Tracking Link:
                </span>{" "}
                This is your actual affiliate link provided by the network
                (e.g., Awin, CJ). If you leave this blank, the system will fall
                back to individual coupon tracking links. If filled, ensure you
                include the dynamic sub-ID placeholder (e.g.,{" "}
                <code>?clickref={"{subId}"}</code>).
              </p>
            </div>

            {/* Field: Geo-Targeting */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Target Country (Geo-Targeting)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">How it works:</span>{" "}
                If a store is selected as &quot;United States (US)&quot;, it
                will only appear to users browsing from the US or viewing the US
                region of DealVerse. Select &quot;Global&quot; if the store
                ships internationally (like Amazon).
              </p>
            </div>

            {/* Field: FAQs */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Structured FAQs (JSON-LD)
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">Why add these?</span>{" "}
                Adding FAQs directly injects <code>Schema.org</code> markup into
                the page. This tells Google to display an accordion Q&amp;A
                directly on the search results page, drastically improving
                Click-Through Rates. (Max 20 allowed).
              </p>
            </div>

            {/* Field: Secondary Categories */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Secondary Categories
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">Rule of thumb:</span>{" "}
                A store must have one Primary Category (e.g., Fashion). However,
                if it&apos;s a department store, you can tag up to 10 secondary
                categories so it appears in multiple navigation filters (e.g.,
                Home, Tech, Beauty).
              </p>
            </div>

            {/* Field: SEO NoFollow */}
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                NoFollow Outbound Links
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">When to check:</span>{" "}
                Turn this on (Red) if you do not want to pass SEO link juice to
                the merchant. For major affiliate sites, it is generally
                recommended to keep this ON to comply with Google&apos;s
                sponsored link guidelines.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewStoreEditor;
