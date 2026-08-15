/* /app/(admin)/admin/stores/[id]/page.js */
"use client";

/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
  ExternalLink,
  MessageCircleQuestion,
  Search,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

const EMPTY_FORM_DATA = {
  _id: "",
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

  createdBy: null,
  updatedBy: null,
  createdAt: "",
  updatedAt: "",
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

      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return [];
};

const getRefId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return String(value._id || value.id || value.value || value.key || "");
};

const normalizeReferenceItem = (item, fallbackName = "Unnamed") => {
  if (!item || typeof item !== "object") return null;

  const id = getRefId(item);
  if (!id) return null;

  return {
    _id: id,
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

const cleanString = (value) => String(value ?? "").trim();

const isHttpUrl = (value) => {
  if (!value) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const formatDate = (value) => {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toISOString().slice(0, 10);
};

const formatCountryName = (country) => {
  if (!country) return "Unknown Country";
  if (country.name && country.code) return `${country.name} (${country.code})`;

  return country.name || country.code || "Unknown Country";
};

const normalizeStoreForForm = (store = {}) => {
  return {
    ...EMPTY_FORM_DATA,

    _id: getRefId(store),
    name: store.name || "",
    slug: store.slug || "",
    officialUrl: store.officialUrl || "",

    countryId: getRefId(store.countryId),
    primaryCategoryId: getRefId(store.primaryCategoryId),
    subCategoryIds: Array.isArray(store.subCategoryIds)
      ? store.subCategoryIds.map(getRefId).filter(Boolean)
      : [],

    affiliateNetworkId: getRefId(store.affiliateNetworkId),

    tracking: {
      trackingLink: store.tracking?.trackingLink || "",
      defaultSubid: store.tracking?.defaultSubid || "",
    },

    isActive: typeof store.isActive === "boolean" ? store.isActive : true,

    isFeatured:
      typeof store.isFeatured === "boolean" ? store.isFeatured : false,

    featuredOrder: Number.isFinite(Number(store.featuredOrder))
      ? Number(store.featuredOrder)
      : 0,

    content: {
      heading: store.content?.heading || "",
      shortDescription: store.content?.shortDescription || "",
      longDescription: store.content?.longDescription || "",
      whyShop: store.content?.whyShop || "",
    },

    policy: {
      shippingInfo: store.policy?.shippingInfo || "",
      returnRefundPolicy: store.policy?.returnRefundPolicy || "",
    },

    facts: {
      foundedYear:
        store.facts?.foundedYear === null ||
        store.facts?.foundedYear === undefined
          ? ""
          : String(store.facts.foundedYear),
      headquarters: store.facts?.headquarters || "",
      customerSupport: store.facts?.customerSupport || "",
    },

    images: {
      logo: {
        url: store.images?.logo?.url || "",
        alt: store.images?.logo?.alt || "",
      },
      thumb: {
        url: store.images?.thumb?.url || "",
        alt: store.images?.thumb?.alt || "",
      },
      og: {
        url: store.images?.og?.url || "",
        alt: store.images?.og?.alt || "",
      },
    },

    seo: {
      metaTitle: store.seo?.metaTitle || "",
      metaDescription: store.seo?.metaDescription || "",
      canonicalUrl: store.seo?.canonicalUrl || "",
      indexable:
        typeof store.seo?.indexable === "boolean" ? store.seo.indexable : true,
      noFollow:
        typeof store.seo?.noFollow === "boolean" ? store.seo.noFollow : false,
      ogTitle: store.seo?.ogTitle || "",
      ogDescription: store.seo?.ogDescription || "",
    },

    faqs: Array.isArray(store.faqs)
      ? store.faqs.map((faq) => ({
          question: faq.question || "",
          answer: faq.answer || "",
        }))
      : [],

    createdBy: store.createdBy || null,
    updatedBy: store.updatedBy || null,
    createdAt: store.createdAt || "",
    updatedAt: store.updatedAt || "",
  };
};

const buildStorePayload = (data) => ({
  name: cleanString(data.name),
  slug: slugify(data.slug),
  officialUrl: cleanString(data.officialUrl),

  countryId: data.countryId || null,
  primaryCategoryId: data.primaryCategoryId,
  subCategoryIds: [...new Set(data.subCategoryIds.filter(Boolean))].slice(
    0,
    10,
  ),

  affiliateNetworkId: data.affiliateNetworkId || null,

  tracking: {
    trackingLink: cleanString(data.tracking.trackingLink),
    defaultSubid: cleanString(data.tracking.defaultSubid),
  },

  isActive: Boolean(data.isActive),
  isFeatured: Boolean(data.isFeatured),
  featuredOrder: Number.isFinite(Number(data.featuredOrder))
    ? Number(data.featuredOrder)
    : 0,

  content: {
    heading: cleanString(data.content.heading),
    shortDescription: cleanString(data.content.shortDescription),
    longDescription: cleanString(data.content.longDescription),
    whyShop: cleanString(data.content.whyShop),
  },

  policy: {
    shippingInfo: cleanString(data.policy.shippingInfo),
    returnRefundPolicy: cleanString(data.policy.returnRefundPolicy),
  },

  facts: {
    foundedYear:
      data.facts.foundedYear === "" ||
      data.facts.foundedYear === null ||
      data.facts.foundedYear === undefined
        ? null
        : Number(data.facts.foundedYear),
    headquarters: cleanString(data.facts.headquarters),
    customerSupport: cleanString(data.facts.customerSupport),
  },

  images: {
    logo: {
      url: cleanString(data.images.logo.url),
      alt: cleanString(data.images.logo.alt),
    },
    thumb: {
      url: cleanString(data.images.thumb.url),
      alt: cleanString(data.images.thumb.alt),
    },
    og: {
      url: cleanString(data.images.og.url),
      alt: cleanString(data.images.og.alt),
    },
  },

  seo: {
    metaTitle: cleanString(data.seo.metaTitle),
    metaDescription: cleanString(data.seo.metaDescription),
    canonicalUrl: cleanString(data.seo.canonicalUrl),
    indexable: Boolean(data.seo.indexable),
    noFollow: Boolean(data.seo.noFollow),
    ogTitle: cleanString(data.seo.ogTitle),
    ogDescription: cleanString(data.seo.ogDescription),
  },

  faqs: data.faqs.map((faq) => ({
    question: cleanString(faq.question),
    answer: cleanString(faq.answer),
  })),
});

const validateStorePayload = (payload) => {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!payload.name) errors.push("Store name is required.");
  if (!payload.slug) errors.push("Store slug is required.");
  if (!payload.officialUrl) errors.push("Official website URL is required.");
  if (!payload.primaryCategoryId) errors.push("Primary category is required.");

  if (payload.officialUrl && !isHttpUrl(payload.officialUrl)) {
    errors.push("Official website URL must be a valid http/https URL.");
  }

  if (
    payload.tracking.trackingLink &&
    !isHttpUrl(payload.tracking.trackingLink)
  ) {
    errors.push("Affiliate tracking link must be a valid http/https URL.");
  }

  if (payload.seo.canonicalUrl && !isHttpUrl(payload.seo.canonicalUrl)) {
    errors.push("Canonical URL must be a valid http/https URL.");
  }

  if (payload.images.logo.url && !isHttpUrl(payload.images.logo.url)) {
    errors.push("Logo image URL must be a valid http/https URL.");
  }

  if (payload.images.thumb.url && !isHttpUrl(payload.images.thumb.url)) {
    errors.push("Thumbnail image URL must be a valid http/https URL.");
  }

  if (payload.images.og.url && !isHttpUrl(payload.images.og.url)) {
    errors.push("Open Graph image URL must be a valid http/https URL.");
  }

  if (payload.name.length > 140)
    errors.push("Store name cannot exceed 140 characters.");
  if (payload.slug.length > 160)
    errors.push("Slug cannot exceed 160 characters.");
  if (payload.tracking.defaultSubid.length > 100) {
    errors.push("Default SubID cannot exceed 100 characters.");
  }

  if (payload.content.heading.length > 200) {
    errors.push("Heading cannot exceed 200 characters.");
  }

  if (payload.content.shortDescription.length > 500) {
    errors.push("Short description cannot exceed 500 characters.");
  }

  if (payload.content.longDescription.length > 15000) {
    errors.push("Long SEO description cannot exceed 15,000 characters.");
  }

  if (payload.content.whyShop.length > 3000) {
    errors.push("Why shop content cannot exceed 3,000 characters.");
  }

  if (payload.policy.shippingInfo.length > 2000) {
    errors.push("Shipping policy cannot exceed 2,000 characters.");
  }

  if (payload.policy.returnRefundPolicy.length > 2000) {
    errors.push("Return/refund policy cannot exceed 2,000 characters.");
  }

  if (payload.facts.headquarters.length > 200) {
    errors.push("Headquarters cannot exceed 200 characters.");
  }

  if (payload.facts.customerSupport.length > 300) {
    errors.push("Customer support cannot exceed 300 characters.");
  }

  if (
    payload.facts.foundedYear !== null &&
    (!Number.isFinite(payload.facts.foundedYear) ||
      payload.facts.foundedYear < 1800 ||
      payload.facts.foundedYear > currentYear)
  ) {
    errors.push(`Founded year must be between 1800 and ${currentYear}.`);
  }

  if (payload.faqs.length > 20) {
    errors.push("FAQs cannot exceed 20 items.");
  }

  payload.faqs.forEach((faq, index) => {
    if (!faq.question) {
      errors.push(`FAQ ${index + 1}: question is required.`);
    }

    if (!faq.answer) {
      errors.push(`FAQ ${index + 1}: answer is required.`);
    }

    if (faq.question.length > 200) {
      errors.push(`FAQ ${index + 1}: question cannot exceed 200 characters.`);
    }

    if (faq.answer.length > 1200) {
      errors.push(`FAQ ${index + 1}: answer cannot exceed 1,200 characters.`);
    }
  });

  return errors;
};

const EditStorePage = () => {
  const router = useRouter();
  const params = useParams();

  const routeKey = useMemo(() => {
    const value = params?.id || params?.slug || params?.storeId || "";
    return Array.isArray(value) ? value[0] : String(value || "");
  }, [params]);

  const [activeTab, setActiveTab] = useState("content");

  const [formData, setFormData] = useState(EMPTY_FORM_DATA);
  const [originalSnapshot, setOriginalSnapshot] = useState("");
  const [resolvedStoreId, setResolvedStoreId] = useState("");

  const [mediaMode, setMediaMode] = useState({
    logo: "link",
    thumb: "link",
    og: "link",
  });

  const [categories, setCategories] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [countries, setCountries] = useState([]);

  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [isReferenceLoading, setIsReferenceLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [notice, setNotice] = useState(null);
  const [referenceError, setReferenceError] = useState("");

  const isDirty = useMemo(() => {
    if (!originalSnapshot) return false;
    return JSON.stringify(buildStorePayload(formData)) !== originalSnapshot;
  }, [formData, originalSnapshot]);

  const canSave =
    !isSaving &&
    !isStoreLoading &&
    formData.name.trim() &&
    formData.slug.trim() &&
    formData.officialUrl.trim() &&
    formData.primaryCategoryId;

  const fetchReferenceData = useCallback(async () => {
    setIsReferenceLoading(true);
    setReferenceError("");

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

    const [categoryResult, networkResult, countryResult] =
      await Promise.allSettled([
        fetchReference("/api/public/categories/module/store?limit=100"),
        fetchReference("/api/admin/affiliate-networks?limit=100"),
        fetchReference("/api/admin/countries?limit=250"),
      ]);

    const failed = [];

    if (categoryResult.status === "fulfilled") {
      setCategories(
        normalizeReferenceList(
          categoryResult.value,
          [
            "categories",
            "categoryList",
            "data.categories",
            "data.categoryList",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Category",
        ),
      );
    } else {
      console.error("Categories fetch failed:", categoryResult.reason);
      failed.push("categories");
    }

    if (networkResult.status === "fulfilled") {
      setNetworks(
        normalizeReferenceList(
          networkResult.value,
          [
            "networks",
            "affiliateNetworks",
            "affiliateNetworkList",
            "data.networks",
            "data.affiliateNetworks",
            "data.affiliateNetworkList",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Network",
        ),
      );
    } else {
      console.error("Affiliate networks fetch failed:", networkResult.reason);
      failed.push("affiliate networks");
    }

    if (countryResult.status === "fulfilled") {
      setCountries(
        normalizeReferenceList(
          countryResult.value,
          [
            "countries",
            "countryList",
            "data.countries",
            "data.countryList",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ],
          "Unnamed Country",
        ),
      );
    } else {
      console.error("Countries fetch failed:", countryResult.reason);
      failed.push("countries");
    }

    if (failed.length > 0) {
      setReferenceError(`Could not load ${failed.join(", ")}.`);
    }

    setIsReferenceLoading(false);
  }, []);

  const fetchStoreById = async (storeId) => {
    const response = await fetch(
      `/api/admin/stores/${encodeURIComponent(storeId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const payload = await safeJson(response);

    if (!response.ok) {
      throw new Error(
        payload?.error || payload?.message || "Failed to fetch store.",
      );
    }

    return payload.store || payload.data?.store || payload;
  };

  const resolveStoreFromRoute = useCallback(async () => {
    if (!routeKey) {
      setNotice({
        type: "error",
        message: "Missing store ID or slug in route.",
      });
      setIsStoreLoading(false);
      return;
    }

    setIsStoreLoading(true);
    setNotice(null);

    try {
      let store = null;
      let directError = "";

      try {
        store = await fetchStoreById(routeKey);
      } catch (error) {
        directError = error.message;
      }

      if (!store) {
        const searchResponse = await fetch(
          `/api/admin/stores?search=${encodeURIComponent(routeKey)}&limit=20`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const searchPayload = await safeJson(searchResponse);

        if (searchResponse.ok) {
          const list = extractArrayFromPayload(searchPayload, [
            "stores",
            "data.stores",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ]);

          const exactStore = list.find((item) => {
            const id = getRefId(item);
            const slug = String(item.slug || "").toLowerCase();

            return (
              id === routeKey ||
              slug === routeKey.toLowerCase() ||
              String(item.name || "").toLowerCase() === routeKey.toLowerCase()
            );
          });

          if (exactStore) {
            const exactId = getRefId(exactStore);
            store = exactId ? await fetchStoreById(exactId) : exactStore;
          }
        }
      }

      if (!store) {
        const listResponse = await fetch("/api/admin/stores?page=1&limit=100", {
          method: "GET",
          cache: "no-store",
        });

        const listPayload = await safeJson(listResponse);

        if (listResponse.ok) {
          const list = extractArrayFromPayload(listPayload, [
            "stores",
            "data.stores",
            "data.items",
            "data.results",
            "items",
            "results",
            "docs",
          ]);

          const exactStore = list.find((item) => {
            const id = getRefId(item);
            const slug = String(item.slug || "").toLowerCase();

            return id === routeKey || slug === routeKey.toLowerCase();
          });

          if (exactStore) {
            const exactId = getRefId(exactStore);
            store = exactId ? await fetchStoreById(exactId) : exactStore;
          }
        }
      }

      if (!store) {
        throw new Error(directError || "Store not found.");
      }

      const normalizedStore = normalizeStoreForForm(store);
      const normalizedPayload = buildStorePayload(normalizedStore);

      setFormData(normalizedStore);
      setResolvedStoreId(normalizedStore._id);
      setOriginalSnapshot(JSON.stringify(normalizedPayload));
    } catch (error) {
      console.error("Store load failed:", error);

      setNotice({
        type: "error",
        message: error.message || "Failed to load store.",
      });
    } finally {
      setIsStoreLoading(false);
    }
  }, [routeKey]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  useEffect(() => {
    resolveStoreFromRoute();
  }, [resolveStoreFromRoute]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isDirty) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

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
      [category]: {
        ...prev[category],
        [field]: value,
      },
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
            galleryId,
            url,
            publicId,
            title:
              image.title ||
              image.original_filename ||
              currentImage.title ||
              "",
            alt: image.alt || image.title || currentImage.alt || "",
            width: image.width || currentImage.width || "",
            height: image.height || currentImage.height || "",
            format: image.format || currentImage.format || "",
            bytes: image.bytes || currentImage.bytes || "",
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
      const nextFaqs = [...prev.faqs];

      nextFaqs[index] = {
        ...nextFaqs[index],
        [field]: value,
      };

      return {
        ...prev,
        faqs: nextFaqs,
      };
    });
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    const payload = buildStorePayload(formData);
    const validationErrors = validateStorePayload(payload);

    if (validationErrors.length > 0) {
      setNotice({
        type: "error",
        message: validationErrors.join(" "),
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const storeId = resolvedStoreId || formData._id;

    if (!storeId) {
      setNotice({
        type: "error",
        message: "Store ID is missing. Please reload this page.",
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/admin/stores/${encodeURIComponent(storeId)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const responsePayload = await safeJson(response);

      if (!response.ok) {
        const details = Array.isArray(responsePayload?.details)
          ? ` ${responsePayload.details.join(" ")}`
          : "";

        throw new Error(
          `${responsePayload?.error || responsePayload?.message || "Failed to update store."}${details}`,
        );
      }

      const updatedStore = responsePayload.store ||
        responsePayload.data?.store ||
        responsePayload.updatedStore || {
          ...formData,
          ...payload,
          _id: storeId,
        };

      const normalizedStore = normalizeStoreForForm(updatedStore);
      const normalizedPayload = buildStorePayload(normalizedStore);

      setFormData(normalizedStore);
      setResolvedStoreId(normalizedStore._id || storeId);
      setOriginalSnapshot(JSON.stringify(normalizedPayload));

      setNotice({
        type: "success",
        message: responsePayload.message || "Store updated successfully.",
      });

      router.refresh();
    } catch (error) {
      console.error("Store update failed:", error);

      setNotice({
        type: "error",
        message: error.message || "Failed to update store.",
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSaving(false);
    }
  };

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
    centeredPreview = false,
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

        {centeredPreview && (
          <div className="flex justify-center mb-4">
            <div
              className={`${previewClassName} border border-[#E0DEF5] bg-[#F7F6FF] flex items-center justify-center overflow-hidden shadow-inner`}
            >
              {image.url ? (
                <img
                  src={image.url}
                  alt={image.alt || label}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Store size={32} className="text-[#E0DEF5]" />
              )}
            </div>
          </div>
        )}

        <div
          className={centeredPreview ? "space-y-3" : "flex gap-4 items-start"}
        >
          {!centeredPreview && (
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
          )}

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
                placeholder={`${label} URL`}
                className={`w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none ${
                  centeredPreview ? "text-center" : ""
                }`}
              />
            )}

            <input
              type="text"
              value={image.alt || ""}
              onChange={(e) => handleImageChange(type, "alt", e.target.value)}
              placeholder={`${label} alt text`}
              maxLength={200}
              className={`w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none ${
                centeredPreview ? "text-center" : ""
              }`}
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
                <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                    <Store size={24} className="text-[#F4A836]" />
                    Edit Store: {formData.name || "Loading..."}
                  </h1>

                  {formData.isActive && (
                    <span className="px-2 py-0.5 bg-[#22B07D]/15 text-[#22B07D] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
                      Live
                    </span>
                  )}

                  {isDirty && (
                    <span className="px-2 py-0.5 bg-[#F4A836]/15 text-[#BA7517] text-[10px] font-bold uppercase tracking-wider rounded-md border border-[#F4A836]/30">
                      Unsaved
                    </span>
                  )}
                </div>

                <p className="text-[#7775A0] text-[13px] mt-0.5">
                  Last updated on {formatDate(formData.updatedAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={formData.slug ? `/store/${formData.slug}` : "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] hover:border-[#4A3DBF] px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-colors duration-150"
              >
                <ExternalLink size={16} className="text-[#7775A0]" />
                View Live Page
              </a>

              <button
                type="submit"
                disabled={!canSave}
                className={`flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-colors duration-150 ${
                  !canSave
                    ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                    : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
                }`}
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Save Changes
              </button>
            </div>
          </div>

          {notice && (
            <div
              className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-[14px] font-medium ${
                notice.type === "success"
                  ? "bg-[#22B07D]/10 border-[#22B07D]/25 text-[#167A57]"
                  : "bg-[#E24B4A]/10 border-[#E24B4A]/25 text-[#B63837]"
              }`}
            >
              {notice.type === "success" ? (
                <Check size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
          )}

          {referenceError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#F4A836]/30 bg-[#F4A836]/10 p-4 text-[14px] font-medium text-[#BA7517]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{referenceError}</span>
            </div>
          )}

          {isStoreLoading ? (
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-12 shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
              <div className="flex items-center justify-center gap-3 text-[#7775A0] font-semibold">
                <Loader2 size={20} className="animate-spin" />
                Loading store details...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* ─── LEFT COLUMN ─── */}
              <div className="xl:col-span-2 flex flex-col h-full space-y-6">
                {/* TABS NAVIGATION */}
                <div className="flex items-center gap-6 border-b border-[#E0DEF5]">
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className={`pb-3 text-[15px] font-bold transition-colors relative ${
                      activeTab === "content"
                        ? "text-[#2D2380]"
                        : "text-[#7775A0] hover:text-[#1A1340]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText size={18} /> Content & Tracking
                    </span>
                    {activeTab === "content" && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2380] rounded-t-sm" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("seo")}
                    className={`pb-3 text-[15px] font-bold transition-colors relative ${
                      activeTab === "seo"
                        ? "text-[#2D2380]"
                        : "text-[#7775A0] hover:text-[#1A1340]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Search size={18} /> SEO & Meta
                    </span>
                    {activeTab === "seo" && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2380] rounded-t-sm" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("faqs")}
                    className={`pb-3 text-[15px] font-bold transition-colors relative ${
                      activeTab === "faqs"
                        ? "text-[#2D2380]"
                        : "text-[#7775A0] hover:text-[#1A1340]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircleQuestion size={18} /> FAQs (
                      {formData.faqs.length})
                    </span>
                    {activeTab === "faqs" && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#2D2380] rounded-t-sm" />
                    )}
                  </button>
                </div>

                {/* TAB PANELS */}
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] min-h-[600px]">
                  {/* TAB 1: CONTENT & TRACKING */}
                  {activeTab === "content" && (
                    <div className="space-y-8 animate-in fade-in duration-200">
                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Store Name <span className="text-[#E24B4A]">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleBasicChange}
                            maxLength={140}
                            required
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center justify-between">
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
                            required
                            className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none lowercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                          Official Website URL{" "}
                          <span className="text-[#E24B4A]">*</span>
                        </label>
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

                      {/* Affiliate Tracking */}
                      <div className="p-5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg space-y-4">
                        <h3 className="text-[14px] font-bold text-[#1A1340] flex items-center gap-2">
                          <LinkIcon size={16} className="text-[#2D2380]" />{" "}
                          Master Tracking Configuration
                        </h3>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Affiliate Tracking Link
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
                            placeholder="https://track.example.com/?subid={subId}"
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                              Affiliate Network
                            </label>
                            <select
                              name="affiliateNetworkId"
                              value={formData.affiliateNetworkId}
                              onChange={handleBasicChange}
                              className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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
                              maxLength={100}
                              className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Editorial Content */}
                      <div className="space-y-4 pt-2 border-t border-[#E0DEF5]">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Store Page H1 Heading
                          </label>
                          <input
                            type="text"
                            value={formData.content.heading}
                            onChange={(e) =>
                              handleNestedChange(
                                "content",
                                "heading",
                                e.target.value,
                              )
                            }
                            maxLength={200}
                            placeholder="e.g. Amazon Promo Codes & Best Deals"
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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
                            rows={2}
                            maxLength={500}
                            className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[13px] font-semibold text-[#1A1340]">
                              Long SEO Description (HTML/Markdown)
                            </label>
                            <span className="text-[11px] text-[#7775A0] bg-[#EEEDFE] px-2 py-0.5 rounded font-bold">
                              {formData.content.longDescription.length} / 15000
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
                            rows={6}
                            maxLength={15000}
                            className="w-full px-4 py-2.5 bg-[#1A1340] border-[1.5px] border-[#1A1340] rounded-lg text-[13px] font-mono text-[#F7F6FF] focus:border-[#2D2380] outline-none resize-y"
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Why Shop Here?
                          </label>
                          <textarea
                            value={formData.content.whyShop}
                            onChange={(e) =>
                              handleNestedChange(
                                "content",
                                "whyShop",
                                e.target.value,
                              )
                            }
                            rows={3}
                            maxLength={3000}
                            className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-y"
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
                              rows={2}
                              maxLength={2000}
                              className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
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
                              rows={2}
                              maxLength={2000}
                              className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SEO & META */}
                  {activeTab === "seo" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Toggle
                          label="Allow Search Engine Indexing"
                          onChange={(e) =>
                            handleNestedChange(
                              "seo",
                              "indexable",
                              e.target.checked,
                            )
                          }
                          checked={formData.seo.indexable}
                          icon={Globe}
                          colorClass="text-[#22B07D]"
                          activeBg="bg-[#22B07D]"
                        />

                        <Toggle
                          label="Apply rel='nofollow' to links"
                          onChange={(e) =>
                            handleNestedChange(
                              "seo",
                              "noFollow",
                              e.target.checked,
                            )
                          }
                          checked={formData.seo.noFollow}
                          icon={LinkIcon}
                          colorClass="text-[#E24B4A]"
                          activeBg="bg-[#E24B4A]"
                        />
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Meta Title
                          </label>
                          <input
                            type="text"
                            value={formData.seo.metaTitle}
                            onChange={(e) =>
                              handleNestedChange(
                                "seo",
                                "metaTitle",
                                e.target.value,
                              )
                            }
                            maxLength={120}
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                          />
                          <p className="text-[11px] text-[#7775A0] mt-1 text-right">
                            {formData.seo.metaTitle.length} / 120
                          </p>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
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
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                          />
                          <p className="text-[11px] text-[#7775A0] mt-1 text-right">
                            {formData.seo.metaDescription.length} / 320
                          </p>
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Canonical URL Override
                          </label>
                          <input
                            type="url"
                            value={formData.seo.canonicalUrl}
                            onChange={(e) =>
                              handleNestedChange(
                                "seo",
                                "canonicalUrl",
                                e.target.value,
                              )
                            }
                            placeholder="Leave blank to use default /store/slug"
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Open Graph Title
                          </label>
                          <input
                            type="text"
                            value={formData.seo.ogTitle}
                            onChange={(e) =>
                              handleNestedChange(
                                "seo",
                                "ogTitle",
                                e.target.value,
                              )
                            }
                            maxLength={120}
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                            Open Graph Description
                          </label>
                          <textarea
                            value={formData.seo.ogDescription}
                            onChange={(e) =>
                              handleNestedChange(
                                "seo",
                                "ogDescription",
                                e.target.value,
                              )
                            }
                            maxLength={320}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FAQS BUILDER */}
                  {activeTab === "faqs" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[#7775A0] text-[13px]">
                          Add FAQs to generate FAQPage JSON-LD rich snippets.
                          Max 20.
                        </p>

                        <button
                          type="button"
                          onClick={addFaq}
                          disabled={formData.faqs.length >= 20}
                          className="flex items-center gap-1.5 text-[#2D2380] font-bold text-[13px] hover:text-[#4A3DBF] disabled:opacity-50"
                        >
                          <Plus size={16} /> Add FAQ
                        </button>
                      </div>

                      <div className="space-y-4">
                        {formData.faqs.length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed border-[#E0DEF5] rounded-xl">
                            <MessageCircleQuestion
                              size={32}
                              className="text-[#E0DEF5] mx-auto mb-2"
                            />
                            <p className="text-[#7775A0] font-medium">
                              No FAQs added yet.
                            </p>
                          </div>
                        ) : (
                          formData.faqs.map((faq, index) => (
                            <div
                              key={index}
                              className="flex gap-4 p-4 border border-[#E0DEF5] rounded-xl bg-[#F7F6FF] relative group"
                            >
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-[#2D2380] border border-[#E0DEF5] shrink-0">
                                {index + 1}
                              </div>

                              <div className="flex-1 space-y-3">
                                <input
                                  type="text"
                                  placeholder="Question (Max 200 chars)"
                                  value={faq.question}
                                  onChange={(e) =>
                                    updateFaq(index, "question", e.target.value)
                                  }
                                  maxLength={200}
                                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-md text-[14px] font-semibold text-[#1A1340] focus:border-[#2D2380] outline-none"
                                />

                                <textarea
                                  placeholder="Answer (Max 1200 chars)"
                                  value={faq.answer}
                                  onChange={(e) =>
                                    updateFaq(index, "answer", e.target.value)
                                  }
                                  maxLength={1200}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => removeFaq(index)}
                                className="absolute top-4 right-4 text-[#7775A0] hover:text-[#E24B4A] opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded shadow-sm border border-[#E0DEF5]"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── RIGHT COLUMN ─── */}
              <div className="space-y-6">
                {/* Visibility & Curation */}
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                    <Settings size={18} className="text-[#2D2380]" />
                    Publishing Settings
                  </h2>

                  <Toggle
                    label="Store Active (Live)"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleBasicChange}
                    icon={Globe}
                    colorClass="text-[#22B07D]"
                    activeBg="bg-[#22B07D]"
                  />

                  <Toggle
                    label="Feature on Homepage"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleBasicChange}
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
                        className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Taxonomy & Geo */}
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Primary Category <span className="text-[#E24B4A]">*</span>
                    </label>
                    <select
                      name="primaryCategoryId"
                      value={formData.primaryCategoryId}
                      onChange={handleBasicChange}
                      required
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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
                                !formData.subCategoryIds.includes(
                                  category._id,
                                ) && formData.subCategoryIds.length >= 10
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

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Geo Target (Country)
                    </label>
                    <select
                      name="countryId"
                      value={formData.countryId}
                      onChange={handleBasicChange}
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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

                {/* Brand Assets */}
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                    <ImageIcon size={18} className="text-[#2D2380]" />
                    Store Media
                  </h2>

                  <MediaAssetField
                    type="logo"
                    label="Square Logo"
                    folder="Products images/stores/logos"
                    previewClassName="w-24 h-24 rounded-full"
                    centeredPreview
                    withBorder={false}
                  />

                  <MediaAssetField
                    type="thumb"
                    label="Thumbnail"
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
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                    <Building size={18} className="text-[#2D2380]" />
                    Company Facts
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
                        min={1800}
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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
                        maxLength={200}
                        className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[12px] font-semibold text-[#1A1340] mb-1">
                      Customer Support
                    </label>
                    <input
                      type="text"
                      value={formData.facts.customerSupport}
                      onChange={(e) =>
                        handleNestedChange(
                          "facts",
                          "customerSupport",
                          e.target.value,
                        )
                      }
                      maxLength={300}
                      className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditStorePage;
