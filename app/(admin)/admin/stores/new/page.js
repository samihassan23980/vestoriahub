/* /app/(admin)/admin/stores/new/page.js */
"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MediaUploader from "@/app/Components/media/MediaUploader";
import TextEditor from "../../editor/page";
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
  Type,
  Zap,
  Wand2,
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
      if (Array.isArray(value)) return value;
      if (value && typeof value === "object") queue.push(value);
    }
  }
  return [];
};

const normalizeReferenceItem = (item, fallbackName = "Unnamed") => {
  if (!item || typeof item !== "object") return null;
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
  const response = await fetch(url, { method: "GET", cache: "no-store" });
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

// ─── REUSABLE SUGGESTION CHIP COMPONENT ───
const SuggestionChips = ({ suggestions, onSelect }) => {
  if (!suggestions || suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {suggestions.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(s)}
          className="text-[11px] bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-forest,#1C352D)] hover:border-[var(--adm-forest,#1C352D)] hover:bg-[var(--adm-surface,#FFFFFF)] rounded-md px-2.5 py-1.5 transition-all text-left shadow-sm flex items-center gap-1.5"
        >
          <Wand2 size={12} className="text-[var(--adm-gold,#D9A441)] shrink-0" />
          <span className="leading-tight">{s}</span>
        </button>
      ))}
    </div>
  );
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

  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const [mediaMode, setMediaMode] = useState({
    logo: "link",
    thumb: "link",
    og: "link",
  });

  // ─── DYNAMIC SEO TEMPLATE DATA ───
  const brandName = useMemo(() => formData.name.trim() || "{Store Name}", [formData.name]);
  const currentMonthYear = useMemo(() => {
    const d = new Date();
    return `${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
  }, []);

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

      if (!mounted) return;
      const failed = [];

      if (categoryResult.status === "fulfilled") {
        setCategories(
          normalizeReferenceList(
            categoryResult.value,
            ["categories", "data.categories", "data.items", "items", "docs"],
            "Unnamed Category",
          ),
        );
      } else failed.push("categories");

      if (networkResult.status === "fulfilled") {
        setNetworks(
          normalizeReferenceList(
            networkResult.value,
            ["networks", "data.networks", "items", "docs"],
            "Unnamed Network",
          ),
        );
      } else failed.push("affiliate networks");

      if (countryResult.status === "fulfilled") {
        setCountries(
          normalizeReferenceList(
            countryResult.value,
            ["countries", "data.countries", "items", "docs"],
            "Unnamed Country",
          ),
        );
      } else failed.push("countries");

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

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? checked : name === "slug" ? slugify(value) : value,
    }));
  };

  const handleNestedChange = (category, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [category]: { ...prev[category], [field]: value },
    }));
  };

  // ─── SMART TEMPLATE ACTIONS ───
  const insertLongDescTemplate = () => {
    const templateHTML = `
      <p><b>${brandName}</b> is a leading destination for [product category], offering [key selling point] for shoppers who want [benefit]. Whether you're shopping for [example product 1] or [example product 2], <b>${brandName}</b> combines quality with regularly updated discounts.</p>
      <h3>How to use a ${brandName} promo code:</h3>
      <ol>
        <li>Browse <b>${brandName}</b> and add your items to the cart.</li>
        <li>Click the cart/bag icon to review your order.</li>
        <li>Look for the "Promo Code" or "Discount Code" box at checkout.</li>
        <li>Paste your verified <b>${brandName}</b> code into the box.</li>
        <li>Click Apply and confirm your discount appears before paying.</li>
      </ol>
      <h3>${brandName} savings tips:</h3>
      <ul>
        <li>Sign up for the <b>${brandName}</b> newsletter for an instant welcome discount.</li>
        <li>Join [loyalty program name] for member-only pricing and free shipping.</li>
        <li>Check the Sale/Outlet section for markdowns that stack with select codes.</li>
        <li>Students, military, and healthcare workers may qualify for an extra discount — verify your status via ID.me or UNiDAYS.</li>
      </ul>
      <p><b>${brandName}</b> typically runs its biggest sales during Black Friday, Cyber Monday, and end-of-season clearance, with discounts reaching up to [X]% off.</p>
      <p><b>${brandName}</b> offers [shipping summary] and a [return window]-day return policy on most items.</p>
    `;
    handleNestedChange("content", "longDescription", templateHTML);
  };

  const loadDefaultFaqs = () => {
    const defaultQuestions = [
      `Does ${brandName} have an active promo code?`,
      `How many ${brandName} coupons are available today?`,
      `What is the best ${brandName} discount code right now?`,
      `Does ${brandName} offer free shipping?`,
      `Is there a ${brandName} student discount?`,
      `Can I stack multiple ${brandName} coupon codes?`,
      `Does ${brandName} have Black Friday deals?`,
      `What is ${brandName}'s return policy?`,
      `Why isn't my ${brandName} promo code working?`,
      `Is there a ${brandName} app-only discount?`
    ];
    
    const newFaqs = defaultQuestions.map((q) => ({ question: q, answer: "" }));
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, ...newFaqs].slice(0, 20),
    }));
  };

  // ─── IMAGE HANDLERS ───
  const handleImageChange = (type, field, value) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: { ...prev.images[type], [field]: value },
      },
    }));
  };

  const handleUploaderImageChange = (type, uploadedImage) => {
    const image = Array.isArray(uploadedImage) ? uploadedImage[0] : uploadedImage;
    setFormData((prev) => {
      if (!image) {
        return {
          ...prev,
          images: { ...prev.images, [type]: { url: "", alt: "" } },
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
        [type]: { url: value, alt: prev.images[type]?.alt || "" },
      },
    }));
  };

  const clearImageField = (type) => {
    setFormData((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [type]: { url: "", alt: "" },
      },
    }));
  };

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
      newFaqs[index] = { ...newFaqs[index], [field]: value };
      return { ...prev, faqs: newFaqs };
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
    setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
  };

  const validateForm = () => {
    const errors = [];
    const currentYear = new Date().getFullYear();

    if (!formData.name.trim()) errors.push("Store name is required.");
    if (!formData.slug.trim()) errors.push("URL slug is required.");
    if (!formData.officialUrl.trim()) errors.push("Official website URL is required.");
    else if (!isHttpUrl(formData.officialUrl)) errors.push("Official website URL must be a valid http/https URL.");
    if (!formData.primaryCategoryId) errors.push("Primary category is required.");
    
    if (formData.tracking.trackingLink && !isHttpUrl(formData.tracking.trackingLink))
      errors.push("Master tracking link must be a valid http/https URL.");

    if (formData.images.logo.url && !isHttpUrl(formData.images.logo.url))
      errors.push("Logo URL must be a valid http/https URL.");
    if (formData.images.thumb.url && !isHttpUrl(formData.images.thumb.url))
      errors.push("Thumbnail URL must be a valid http/https URL.");
    if (formData.images.og.url && !isHttpUrl(formData.images.og.url))
      errors.push("Open Graph image URL must be a valid http/https URL.");

    if (formData.seo.canonicalUrl && !isHttpUrl(formData.seo.canonicalUrl))
      errors.push("Canonical URL must be a valid http/https URL.");

    if (formData.subCategoryIds.length > 10) errors.push("Secondary categories cannot exceed 10.");
    if (formData.faqs.length > 20) errors.push("FAQs cannot exceed 20.");

    formData.faqs.forEach((faq, index) => {
      if (!faq.question.trim()) errors.push(`FAQ ${index + 1}: question is required.`);
      if (!faq.answer.trim()) errors.push(`FAQ ${index + 1}: answer is required.`);
    });

    if (formData.facts.foundedYear) {
      const foundedYear = Number(formData.facts.foundedYear);
      if (!Number.isFinite(foundedYear)) errors.push("Founded year must be a valid number.");
      if (foundedYear < 1800 || foundedYear > currentYear)
        errors.push(`Founded year must be between 1800 and ${currentYear}.`);
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
    featuredOrder: Number.isFinite(Number(formData.featuredOrder)) ? Number(formData.featuredOrder) : 0,
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
        formData.facts.foundedYear === "" || formData.facts.foundedYear == null
          ? null : Number(formData.facts.foundedYear),
      headquarters: formData.facts.headquarters.trim(),
      customerSupport: formData.facts.customerSupport.trim(),
    },
    images: {
      logo: { url: formData.images.logo.url.trim(), alt: formData.images.logo.alt.trim() },
      thumb: { url: formData.images.thumb.url.trim(), alt: formData.images.thumb.alt.trim() },
      og: { url: formData.images.og.url.trim(), alt: formData.images.og.alt.trim() },
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
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildPayload()),
    });

    const payload = await safeJson(response);

    if (!response.ok) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          "Failed to save store."
      );
    }

    router.push("/admin/stores");
    router.refresh();
  } catch (error) {
    console.error("Submission error:", error);

    setFormError(
      error.message || "Failed to save store."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
  const Toggle = ({ label, checked, onChange, icon: Icon, colorClass, activeBg }) => (
    <label className="flex items-center justify-between p-4 border border-[var(--adm-border)] rounded-lg cursor-pointer hover:bg-[var(--adm-surface-alt)] transition-colors">
      <div className="flex items-center gap-3">
        <Icon size={18} className={checked ? colorClass : "text-[var(--adm-text-muted)]"} />
        <span className="text-[var(--adm-text-body)] font-semibold text-[13px]">
          {label}
        </span>
      </div>
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? activeBg : "bg-[var(--adm-border)]"}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`}></div>
      </div>
    </label>
  );

  const MediaAssetField = ({ type, label, folder, previewClassName = "w-16 h-16 rounded-xl", withBorder = true }) => {
    const image = formData.images[type] || { url: "", alt: "" };
    const mode = mediaMode[type] || "link";

    return (
      <div className={withBorder ? "pt-4 border-t border-[var(--adm-border,#E2D9CC)]" : ""}>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[12px] font-bold text-[var(--adm-text-muted,#6B7280)] uppercase tracking-wider">
            {label}
          </label>
          {image.url && (
            <button
              type="button"
              onClick={() => clearImageField(type)}
              className="text-[11px] font-bold text-[var(--adm-badge-red-text,#C1432F)] hover:opacity-80 transition-colors"
            >
              Clear Image
            </button>
          )}
        </div>

        <div className="flex gap-4 items-start">
          <div className={`${previewClassName} border border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface-alt,#FDFBF7)] flex items-center justify-center shrink-0 overflow-hidden shadow-sm`}>
            {image.url ? (
              <img src={image.url} alt={image.alt || label} className="w-full h-full object-contain p-1" />
            ) : (
              <Store size={24} className="text-[var(--adm-border,#E2D9CC)]" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--adm-surface-sub,#F1E7D8)] border border-[var(--adm-border,#E2D9CC)] p-1 max-w-xs">
              <button
                type="button"
                onClick={() => setMediaMode((prev) => ({ ...prev, [type]: "upload" }))}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                  mode === "upload" ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm" : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-forest,#1C352D)]"
                }`}
              >
                Upload
              </button>
              <button
                type="button"
                onClick={() => setMediaMode((prev) => ({ ...prev, [type]: "link" }))}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold transition-colors ${
                  mode === "link" ? "bg-[var(--adm-surface,#FFFFFF)] text-[var(--adm-forest,#1C352D)] shadow-sm" : "text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-forest,#1C352D)]"
                }`}
              >
                Link
              </button>
            </div>

            {mode === "upload" ? (
              <div className="rounded-lg border border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface-alt,#FDFBF7)] p-3">
                <MediaUploader
                  label={`Upload ${label}`}
                  value={image.url ? [image] : []}
                  onChange={(uploadedImage) => handleUploaderImageChange(type, uploadedImage)}
                  folder={folder}
                  multiple={false}
                  maxFiles={1}
                />
                {image.url && <p className="mt-2 truncate text-[11px] text-[var(--adm-text-muted,#6B7280)]">{image.url}</p>}
              </div>
            ) : (
              <input
                type="url"
                value={image.url || ""}
                onChange={(e) => handleManualImageUrlChange(type, e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none focus:border-[var(--adm-forest,#1C352D)]"
              />
            )}

            <div>
              <input
                type="text"
                value={image.alt || ""}
                onChange={(e) => handleImageChange(type, "alt", e.target.value)}
                placeholder={`${label} alt text (for SEO)`}
                maxLength={200}
                className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none focus:border-[var(--adm-forest,#1C352D)]"
              />
              <SuggestionChips
                suggestions={type === 'logo' ? [`${brandName} logo`] : [`${brandName} coupons and promo codes`, `Save at ${brandName} with verified discount codes`]}
                onSelect={(val) => handleImageChange(type, "alt", val)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--adm-bg,#F8F0E5)] text-[var(--adm-text-body,#16241F)] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* ─── STICKY HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[var(--adm-bg,#F8F0E5)]/95 backdrop-blur-md py-4 border-b border-[var(--adm-border,#E2D9CC)]">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/stores"
                className="p-2 border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[var(--adm-text-body)] hover:bg-[var(--adm-surface-alt)] bg-[var(--adm-surface,#FFFFFF)] shadow-sm transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[var(--adm-text-title,#10201B)] leading-tight flex items-center gap-2">
                  <Store size={24} className="text-[var(--adm-gold,#D9A441)]" /> Add New Store
                </h1>
                <p className="text-[var(--adm-text-muted,#6B7280)] text-[14px]">
                  Enter the Store Name first to unlock smart SEO suggestions for all fields below.
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                !canSubmit
                  ? "bg-[var(--adm-forest,#1C352D)]/50 text-white/70 cursor-not-allowed"
                  : "bg-[var(--adm-forest,#1C352D)] hover:bg-[var(--adm-forest-hover,#10201B)] text-white"
              }`}
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Publish Store
            </button>
          </div>

          {formError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--adm-badge-red-border)] bg-[var(--adm-badge-red-bg)] p-4 text-[14px] font-medium text-[var(--adm-badge-red-text)]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {referenceError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--adm-gold)]/30 bg-[var(--adm-gold)]/10 p-4 text-[14px] font-medium text-[var(--adm-gold-hover)]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{referenceError}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* ══════════════════════════════════════════════════════════════
                1. REQUIRED SETUP (TOP PRIORITY - INSTANT PUBLISH)
            ══════════════════════════════════════════════════════════════ */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-forest,#1C352D)]/20 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--adm-border,#E2D9CC)] pb-4">
                <h2 className="text-[17px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2">
                  <Zap size={20} className="text-[var(--adm-gold,#D9A441)]" /> Core Store Details
                </h2>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--adm-forest,#1C352D)] bg-[var(--adm-badge-green-bg,#EBF3EE)] border border-[var(--adm-badge-green-border,#BDD6C4)] px-2.5 py-1 rounded-md">
                  Primary Fields
                </span>
              </div>

              {/* 1.1 Text Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    Store Name <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleBasicChange}
                    onBlur={generateSlug}
                    placeholder="e.g. Amazon, Nike, Walmart"
                    maxLength={140}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border-2 border-[var(--adm-border,#E2D9CC)] focus:border-[var(--adm-gold,#D9A441)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] outline-none transition-all font-bold"
                  />
                  <p className="text-[11px] text-[var(--adm-text-muted,#6B7280)] mt-1">
                    Typing here activates smart AI suggestions across the form.
                  </p>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    URL Slug <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleBasicChange}
                    placeholder="e.g. nike"
                    maxLength={160}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-forest,#1C352D)] focus:border-[var(--adm-forest,#1C352D)] outline-none lowercase font-mono font-medium"
                  />
                  <SuggestionChips 
                    suggestions={formData.name ? [slugify(formData.name), `${slugify(formData.name)}-us`, `${slugify(formData.name)}-uk`] : []}
                    onSelect={(val) => handleBasicChange({ target: { name: "slug", value: val } })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    Official Website URL <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                  </label>
                  <input
                    type="url"
                    name="officialUrl"
                    value={formData.officialUrl}
                    onChange={handleBasicChange}
                    placeholder="https://www.nike.com"
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none font-mono text-[13px]"
                  />
                  <SuggestionChips 
                    suggestions={formData.name ? [`https://www.${slugify(formData.name)}.com`] : []}
                    onSelect={(val) => handleBasicChange({ target: { name: "officialUrl", value: val } })}
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                    Primary Category <span className="text-[var(--adm-badge-red-text,#C1432F)]">*</span>
                  </label>
                  <select
                    name="primaryCategoryId"
                    value={formData.primaryCategoryId}
                    onChange={handleBasicChange}
                    required
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] outline-none focus:border-[var(--adm-forest,#1C352D)] font-medium text-[var(--adm-text-title,#10201B)]"
                  >
                    <option value="">{isReferenceLoading ? "Loading categories..." : "Select Primary Category"}</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 1.2 Brand Logo */}
              <div className="pt-2 border-t border-[var(--adm-border,#E2D9CC)]">
                <MediaAssetField type="logo" label="Square Brand Logo (Recommended 200x200)" folder="Products images/stores/logos" withBorder={false} />
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                OPTIONAL SECTIONS SEPARATOR
            ══════════════════════════════════════════════════════════════ */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-[var(--adm-border,#E2D9CC)] flex-1" />
              <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--adm-text-title,#10201B)] bg-[var(--adm-surface-sub,#F1E7D8)] border border-[var(--adm-border,#E2D9CC)] px-3 py-1 rounded-full">
                Optional Configurations &amp; Enhancements
              </span>
              <div className="h-px bg-[var(--adm-border,#E2D9CC)] flex-1" />
            </div>

            {/* 2. Geo-Targeting & Secondary Taxonomy */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3">
                <Settings size={18} className="text-[var(--adm-forest,#1C352D)]" /> Geo-Targeting &amp; Secondary Categories
              </h2>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                  Target Country (Geo-Targeting)
                </label>
                <select
                  name="countryId"
                  value={formData.countryId}
                  onChange={handleBasicChange}
                  className="w-full md:w-1/2 px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] outline-none focus:border-[var(--adm-forest,#1C352D)]"
                >
                  <option value="">Global (All Countries)</option>
                  {countries.map((country) => (
                    <option key={country._id} value={country._id}>{formatCountryName(country)}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-[var(--adm-text-title,#10201B)]">Secondary Categories (Max 10)</label>
                  <span className="text-[10px] text-[var(--adm-forest,#1C352D)] bg-[var(--adm-badge-green-bg,#EBF3EE)] border border-[var(--adm-badge-green-border,#BDD6C4)] px-2 py-0.5 rounded font-bold">
                    {formData.subCategoryIds.length}/10 Selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] overflow-y-auto border border-[var(--adm-border,#E2D9CC)] rounded-lg p-3 bg-[var(--adm-surface-alt,#FDFBF7)]">
                  {categories.map((category) => {
                    const isChecked = formData.subCategoryIds.includes(category._id);
                    const isDisabled = !isChecked && formData.subCategoryIds.length >= 10;
                    return (
                      <label
                        key={category._id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-[12px] transition-colors cursor-pointer ${
                          isChecked ? "bg-[var(--adm-badge-green-bg,#EBF3EE)] border-[var(--adm-forest,#1C352D)] text-[var(--adm-forest,#1C352D)] font-bold" : isDisabled ? "opacity-50 cursor-not-allowed border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface-sub,#F1E7D8)]" : "border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface,#FFFFFF)] hover:bg-[var(--adm-surface-sub,#F1E7D8)] text-[var(--adm-text-body,#16241F)]"
                        }`}
                      >
                        <input type="checkbox" checked={isChecked} onChange={() => toggleSubCategory(category._id)} disabled={isDisabled} className="accent-[var(--adm-forest,#1C352D)] rounded" />
                        <span className="truncate">{category.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Affiliate Routing */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-4">
                <LinkIcon size={18} className="text-[var(--adm-forest,#1C352D)]" /> Affiliate Routing &amp; Tracking
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">Affiliate Network</label>
                  <select
                    name="affiliateNetworkId"
                    value={formData.affiliateNetworkId}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] outline-none focus:border-[var(--adm-forest,#1C352D)]"
                  >
                    <option value="">{isReferenceLoading ? "Loading networks..." : "Direct / In-House"}</option>
                    {networks.map((network) => (
                      <option key={network._id} value={network._id}>{network.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">Default SubID / Campaign Tag</label>
                  <input
                    type="text"
                    value={formData.tracking.defaultSubid}
                    onChange={(e) => handleNestedChange("tracking", "defaultSubid", e.target.value)}
                    placeholder="e.g. store-name"
                    maxLength={100}
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none font-mono"
                  />
                  <SuggestionChips 
                    suggestions={formData.name ? [slugify(formData.name), `${slugify(formData.name)}-global`] : []}
                    onSelect={(val) => handleNestedChange("tracking", "defaultSubid", val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">
                  Master Tracking Link <span className="text-[var(--adm-text-muted,#6B7280)] font-normal">(Optional fallback)</span>
                </label>
                <input
                  type="url"
                  value={formData.tracking.trackingLink}
                  onChange={(e) => handleNestedChange("tracking", "trackingLink", e.target.value)}
                  placeholder="https://track.awin.com/awc/12345?clickref={subId}"
                  className="w-full px-4 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] text-[var(--adm-forest,#1C352D)] focus:border-[var(--adm-forest,#1C352D)] outline-none font-mono"
                />
              </div>
            </div>

            {/* 4. Editorial Copy & SEO Page Headers */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-4">
                <FileText size={18} className="text-[var(--adm-forest,#1C352D)]" /> Editorial Copy &amp; Page Headers
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">Store Page H1 Headline</label>
                  <input
                    type="text"
                    value={formData.content.heading}
                    onChange={(e) => handleNestedChange("content", "heading", e.target.value)}
                    placeholder={`e.g. ${brandName} Promo Codes & Coupons`}
                    maxLength={200}
                    className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                  />
                  <SuggestionChips 
                    suggestions={[
                      `${brandName} Coupons & Promo Codes — ${currentMonthYear}`,
                      `Save at ${brandName}: Verified Discount Codes for ${currentMonthYear}`,
                      `${brandName} Promo Codes | Up to 50% Off`,
                      `12 ${brandName} Coupons You Can Actually Use — ${currentMonthYear}`
                    ]}
                    onSelect={(val) => handleNestedChange("content", "heading", val)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">Short Summary (Teaser)</label>
                  <textarea
                    value={formData.content.shortDescription}
                    onChange={(e) => handleNestedChange("content", "shortDescription", e.target.value)}
                    placeholder="1-2 sentences summarizing the store for search snippet results..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-none"
                  />
                  <SuggestionChips 
                    suggestions={[
                      `Save on top categories at ${brandName} with verified coupon codes. Get up to 50% off, plus free shipping deals and exclusive offers updated daily.`,
                      `Shop electronics and home essentials at ${brandName} with verified discount codes. Cash-on-delivery available, new deals daily.`,
                      `Order from your favorite restaurants on ${brandName} and save with active promo codes — up to 50% off your first order.`
                    ]}
                    onSelect={(val) => handleNestedChange("content", "shortDescription", val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5">&quot;Why Shop Here?&quot; (Trust &amp; Selling Points)</label>
                <textarea
                  value={formData.content.whyShop}
                  onChange={(e) => handleNestedChange("content", "whyShop", e.target.value)}
                  placeholder="Key brand benefits, rewards program perks..."
                  rows={2}
                  maxLength={3000}
                  className="w-full px-4 py-2.5 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-y"
                />
                <SuggestionChips 
                  suggestions={[
                    `Verified codes only — every ${brandName} coupon is tested.`,
                    `New deals daily — updated as soon as ${brandName} launches a promo.`,
                    `Exclusive offers — unique discounts you won't find elsewhere.`,
                    `Honest about exclusions — if a code doesn't work on sale items, we clearly say so.`,
                    `No fake urgency — we don't use fake countdown timers just to pressure you.`
                  ]}
                  onSelect={(val) => handleNestedChange("content", "whyShop", formData.content.whyShop ? `${formData.content.whyShop}\n• ${val}` : `• ${val}`)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[var(--adm-border,#E2D9CC)]">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[var(--adm-badge-green-text,#1C352D)]" /> Shipping Policy Summary
                  </label>
                  <textarea
                    value={formData.policy.shippingInfo}
                    onChange={(e) => handleNestedChange("policy", "shippingInfo", e.target.value)}
                    placeholder={`e.g. ${brandName} offers free standard shipping on orders over $50.`}
                    rows={2}
                    maxLength={2000}
                    className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-none"
                  />
                  <SuggestionChips 
                    suggestions={[
                      `${brandName} offers free standard shipping on orders over $50. Delivery typically takes 3-5 business days.`,
                      `${brandName} delivers nationwide, usually within 2-5 business days depending on your city. Cash on delivery is available.`
                    ]}
                    onSelect={(val) => handleNestedChange("policy", "shippingInfo", val)}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-[var(--adm-badge-green-text,#1C352D)]" /> Return &amp; Refund Policy Summary
                  </label>
                  <textarea
                    value={formData.policy.returnRefundPolicy}
                    onChange={(e) => handleNestedChange("policy", "returnRefundPolicy", e.target.value)}
                    placeholder={`e.g. ${brandName} accepts returns within 30 days of purchase.`}
                    rows={2}
                    maxLength={2000}
                    className="w-full px-4 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-lg text-[13px] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-none"
                  />
                  <SuggestionChips 
                    suggestions={[
                      `${brandName} accepts returns within 30 days of purchase for unused items in original packaging. Final sale items are excluded.`,
                      `${brandName} allows returns within 7-14 days depending on the category.`
                    ]}
                    onSelect={(val) => handleNestedChange("policy", "returnRefundPolicy", val)}
                  />
                </div>
              </div>
            </div>

            {/* 5. Long Description Text Editor */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl shadow-sm overflow-visible flex flex-col">
              <div className="bg-[var(--adm-forest,#1C352D)] p-3 flex items-center justify-between rounded-t-xl">
                <div className="flex items-center gap-4 text-white/70">
                  <Type size={18} />
                  <span className="text-[12px] font-bold uppercase tracking-widest text-[var(--adm-gold,#D9A441)]">
                    Comprehensive Store Review (Long Description)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={insertLongDescTemplate}
                  className="flex items-center gap-1.5 bg-[var(--adm-gold,#D9A441)] hover:bg-[var(--adm-gold-hover,#BE8E34)] text-white px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors"
                >
                  <Wand2 size={13} /> Insert SEO Template
                </button>
              </div>
              <TextEditor
                value={formData.content.longDescription}
                onChange={(val) => handleNestedChange("content", "longDescription", val)}
                maxLength={50000}
              />
            </div>

            {/* 6. Company Facts & E-E-A-T */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3">
                <Building size={18} className="text-[var(--adm-forest,#1C352D)]" /> Company Facts &amp; E-E-A-T
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1">Founded Year</label>
                  <input
                    type="number"
                    value={formData.facts.foundedYear}
                    onChange={(e) => handleNestedChange("facts", "foundedYear", e.target.value)}
                    placeholder="e.g. 1994"
                    min={1800}
                    max={new Date().getFullYear()}
                    className="w-full px-3 py-2 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1">Headquarters</label>
                  <input
                    type="text"
                    value={formData.facts.headquarters}
                    onChange={(e) => handleNestedChange("facts", "headquarters", e.target.value)}
                    placeholder="e.g. Beaverton, OR"
                    maxLength={200}
                    className="w-full px-3 py-2 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1">Customer Support Info</label>
                  <input
                    type="text"
                    value={formData.facts.customerSupport}
                    onChange={(e) => handleNestedChange("facts", "customerSupport", e.target.value)}
                    placeholder="e.g. 1-800-806-6453 / 24/7 Chat"
                    maxLength={200}
                    className="w-full px-3 py-2 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 7. Search Engine Optimization (SEO) */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3 mb-2">
                <Globe size={18} className="text-[var(--adm-forest,#1C352D)]" /> Search Engine Optimization (SEO)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="Allow Search Engine Indexing" checked={formData.seo.indexable} onChange={(e) => handleNestedChange("seo", "indexable", e.target.checked)} icon={CheckCircle} colorClass="text-[var(--adm-badge-green-text,#1C352D)]" activeBg="bg-[var(--adm-badge-green-border,#BDD6C4)]" />
                <Toggle label="NoFollow Outbound Affiliate Links" checked={formData.seo.noFollow} onChange={(e) => handleNestedChange("seo", "noFollow", e.target.checked)} icon={AlertCircle} colorClass="text-[var(--adm-badge-red-text,#C1432F)]" activeBg="bg-[var(--adm-badge-red-border,#E8D0C5)]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[var(--adm-text-title,#10201B)] mb-1">Meta Title</label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => handleNestedChange("seo", "metaTitle", e.target.value)}
                    placeholder="Defaults to Store Name + Verified Coupons if empty"
                    maxLength={120}
                    className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none"
                  />
                  <SuggestionChips 
                    suggestions={[
                      `${brandName} Coupon Codes for ${currentMonthYear} (Up to 50% Off)`,
                      `${brandName} Promo Codes — Up to 50% Off | ${currentMonthYear}`,
                      `${brandName} Discount Codes: 12 Verified Coupons`,
                      `Save 50% at ${brandName} | ${currentMonthYear} Promo Codes`
                    ]}
                    onSelect={(val) => handleNestedChange("seo", "metaTitle", val)}
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[var(--adm-text-title,#10201B)] mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={formData.seo.canonicalUrl}
                    onChange={(e) => handleNestedChange("seo", "canonicalUrl", e.target.value)}
                    placeholder="Leave empty unless this is a duplicate"
                    className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[var(--adm-text-title,#10201B)] mb-1">Meta Description</label>
                <textarea
                  value={formData.seo.metaDescription}
                  onChange={(e) => handleNestedChange("seo", "metaDescription", e.target.value)}
                  placeholder="Compelling SERP description with active discount figures..."
                  maxLength={320}
                  rows={3}
                  className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none resize-none"
                />
                <SuggestionChips 
                  suggestions={[
                    `Save with verified ${brandName} promo codes for ${currentMonthYear}. Get up to 50% off sitewide — tested daily by our team.`,
                    `9 working ${brandName} discount codes for ${currentMonthYear}. Up to 50% off select categories, updated as soon as new codes drop.`,
                    `Book smarter with verified ${brandName} promo codes. Up to 20% off — no fake urgency, just codes that actually work.`
                  ]}
                  onSelect={(val) => handleNestedChange("seo", "metaDescription", val)}
                />
              </div>
            </div>

            {/* 8. Structured FAQs Builder */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between mb-2 border-b border-[var(--adm-border,#E2D9CC)] pb-4">
                <div className="flex items-center gap-2">
                  <MessageCircleQuestion size={18} className="text-[var(--adm-forest,#1C352D)]" />
                  <div>
                    <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)]">Structured Store FAQs (Schema.org JSON-LD)</h2>
                    <p className="text-[12px] text-[var(--adm-text-muted,#6B7280)]">Q&amp;A accordion displayed on the store page and injected into Google rich snippets.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={loadDefaultFaqs}
                    className="flex items-center gap-1.5 text-[var(--adm-gold,#D9A441)] font-bold text-[12px] hover:text-[var(--adm-gold-hover,#BE8E34)] transition-colors bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] px-3 py-1.5 rounded-md"
                  >
                    <Wand2 size={14} /> Load SEO FAQs
                  </button>
                  <button
                    type="button"
                    onClick={addFaq}
                    disabled={formData.faqs.length >= 20}
                    className="flex items-center gap-1.5 text-[var(--adm-forest,#1C352D)] font-bold text-[13px] hover:opacity-70 disabled:opacity-50 transition-colors"
                  >
                    <Plus size={16} /> Add Blank FAQ ({formData.faqs.length}/20)
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {formData.faqs.length === 0 ? (
                  <p className="text-center py-6 text-[var(--adm-text-muted,#6B7280)] text-[13px] italic border-2 border-dashed border-[var(--adm-border,#E2D9CC)] rounded-lg">
                    No FAQs added. Click &quot;Load SEO FAQs&quot; to auto-fill best performing questions for <b>{brandName}</b>.
                  </p>
                ) : (
                  formData.faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 bg-[var(--adm-surface-alt,#FDFBF7)] border border-[var(--adm-border,#E2D9CC)] rounded-xl relative group shadow-sm">
                      <button type="button" onClick={() => removeFaq(idx)} className="absolute top-4 right-4 text-[var(--adm-text-muted,#6B7280)] hover:text-[var(--adm-badge-red-text,#C1432F)] transition-all">
                        <Trash2 size={16} />
                      </button>
                      <div className="space-y-3 pr-8">
                        <input
                          type="text"
                          placeholder={`Question (e.g. Does ${brandName} offer free shipping?)...`}
                          value={faq.question}
                          onChange={(e) => updateFaq(idx, "question", e.target.value)}
                          maxLength={200}
                          required
                          className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[14px] font-bold text-[var(--adm-text-title,#10201B)] focus:border-[var(--adm-forest,#1C352D)] outline-none"
                        />
                        <textarea
                          placeholder="Detailed answer (1-2 sentences recommended)..."
                          value={faq.answer}
                          onChange={(e) => updateFaq(idx, "answer", e.target.value)}
                          maxLength={1200}
                          required
                          className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] text-[var(--adm-text-body,#16241F)] focus:border-[var(--adm-forest,#1C352D)] outline-none resize-y min-h-[60px]"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* 9. Additional Brand Media Assets (Thumb & OG) */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3">
                <ImageIcon size={18} className="text-[var(--adm-forest,#1C352D)]" /> Additional Brand Media Assets
              </h2>
              <MediaAssetField type="thumb" label="Store Card Thumbnail Banner" folder="Products images/stores/thumbnails" previewClassName="w-20 h-12 rounded-lg" withBorder={false} />
              <MediaAssetField type="og" label="Open Graph Social Share Image" folder="Products images/stores/og" previewClassName="w-24 h-14 rounded-lg" />
            </div>

            {/* 10. Publishing Settings */}
            <div className="bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-[16px] font-bold text-[var(--adm-text-title,#10201B)] flex items-center gap-2 border-b border-[var(--adm-border,#E2D9CC)] pb-3 mb-2">
                <Globe size={18} className="text-[var(--adm-forest,#1C352D)]" /> Publishing Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="Store Active (Live on Site)" checked={formData.isActive} onChange={(e) => handleBasicChange({target:{name:"isActive", type:"checkbox", checked:e.target.checked}})} icon={Globe} colorClass="text-[var(--adm-badge-green-text,#1C352D)]" activeBg="bg-[var(--adm-badge-green-border,#BDD6C4)]" />
                <Toggle label="Feature on Homepage & Menus" checked={formData.isFeatured} onChange={(e) => handleBasicChange({target:{name:"isFeatured", type:"checkbox", checked:e.target.checked}})} icon={Star} colorClass="text-[var(--adm-gold,#D9A441)]" activeBg="bg-[var(--adm-gold,#D9A441)]" />
              </div>
              {formData.isFeatured && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 max-w-xs">
                  <label className="block text-[12px] font-semibold text-[var(--adm-text-title,#10201B)] mb-1">Featured Sort Order (Lower = First)</label>
                  <input type="number" name="featuredOrder" value={formData.featuredOrder} onChange={handleBasicChange} className="w-full px-3 py-2 bg-[var(--adm-surface,#FFFFFF)] border border-[var(--adm-border,#E2D9CC)] rounded-md text-[13px] outline-none focus:border-[var(--adm-forest,#1C352D)]" />
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};

export default NewStoreEditor;