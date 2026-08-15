"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Loader2,
  Package,
  Tag,
  FileText,
  ListChecks,
  DollarSign,
  Image as ImageIcon,
  Link2,
  Settings,
  Award,
  Plus,
  X,
  ListPlus,
  Check,
  Trash2,
} from "lucide-react";

const getArrayFromApi = (data, key) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data?.[key])) return data.data[key];
  return [];
};

const specsObjectToArray = (specifications) => {
  if (!specifications || typeof specifications !== "object") return [];

  return Object.entries(specifications).map(([key, value]) => ({
    key,
    value: String(value || ""),
  }));
};

const formatDateForInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
};

export default function EditAffiliateProductEditor() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);

  const [proInput, setProInput] = useState("");
  const [conInput, setConInput] = useState("");
  const [highlightInput, setHighlightInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    brandName: "",

    expertScore: "",
    ribbonText: "",
    pros: [],
    cons: [],
    bottomLine: "",
    awardBadge: "",

    images: [],
    specifications: [],
    highlights: [],

    price: "",
    originalPrice: "",
    currency: "USD",
    affiliateLink: "",
    ctaText: "View Deal",
    lastVerifiedAt: "",

    rating: "",
    reviewCount: "",

    categoryId: "",
    storeId: "",

    status: "draft",
    displayVariant: "standard",
    isTopPick: false,
    isTrending: false,
    isHotDeal: false,
    showInCategoryPage: true,
    sortOrder: 100,

    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        setLoadingRefs(true);

        const [categoriesRes, storesRes] = await Promise.all([
          fetch("/api/admin/categories", { cache: "no-store" }),
          fetch("/api/admin/stores", { cache: "no-store" }),
        ]);

        const categoriesData = await categoriesRes.json();
        const storesData = await storesRes.json();

        setCategories(getArrayFromApi(categoriesData, "categories"));
        setStores(getArrayFromApi(storesData, "stores"));
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Reference data failed",
          text: "Categories or stores could not be loaded.",
          confirmButtonColor: "#E24B4A",
        });
      } finally {
        setLoadingRefs(false);
      }
    };

    fetchReferences();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setIsLoading(true);

        const res = await fetch(`/api/admin/affiliate-products/${productId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || data?.success === false) {
          throw new Error(data?.error || "Failed to fetch affiliate product.");
        }

        const product = data.product;

        setFormData({
          title: product?.title || "",
          slug: product?.slug || "",
          shortDescription: product?.shortDescription || "",
          description: product?.description || "",
          brandName: product?.brandName || "",

          expertScore:
            product?.expertScore === null || product?.expertScore === undefined
              ? ""
              : String(product.expertScore),
          ribbonText: product?.ribbonText || "",
          pros: Array.isArray(product?.pros) ? product.pros : [],
          cons: Array.isArray(product?.cons) ? product.cons : [],
          bottomLine: product?.bottomLine || "",
          awardBadge: product?.awardBadge || "",

          images: Array.isArray(product?.images)
            ? product.images.map((img, index) => ({
                url: img?.url || "",
                alt: img?.alt || "",
                isPrimary: Boolean(img?.isPrimary || index === 0),
              }))
            : [],

          specifications: specsObjectToArray(product?.specifications),
          highlights: Array.isArray(product?.highlights)
            ? product.highlights
            : [],

          price:
            product?.price === null || product?.price === undefined
              ? ""
              : String(product.price),
          originalPrice:
            product?.originalPrice === null ||
            product?.originalPrice === undefined
              ? ""
              : String(product.originalPrice),
          currency: product?.currency || "USD",
          affiliateLink: product?.affiliateLink || "",
          ctaText: product?.ctaText || "View Deal",
          lastVerifiedAt: formatDateForInput(product?.lastVerifiedAt),

          rating:
            product?.rating === null || product?.rating === undefined
              ? ""
              : String(product.rating),
          reviewCount:
            product?.reviewCount === null || product?.reviewCount === undefined
              ? ""
              : String(product.reviewCount),

          categoryId:
            typeof product?.categoryId === "object"
              ? product.categoryId?._id || ""
              : product?.categoryId || "",
          storeId:
            typeof product?.storeId === "object"
              ? product.storeId?._id || ""
              : product?.storeId || "",

          status: product?.status || "draft",
          displayVariant: product?.displayVariant || "standard",
          isTopPick: Boolean(product?.isTopPick),
          isTrending: Boolean(product?.isTrending),
          isHotDeal: Boolean(product?.isHotDeal),
          showInCategoryPage:
            product?.showInCategoryPage === undefined
              ? true
              : Boolean(product.showInCategoryPage),
          sortOrder:
            product?.sortOrder === null || product?.sortOrder === undefined
              ? 100
              : product.sortOrder,

          seoTitle: product?.seoTitle || "",
          seoDescription: product?.seoDescription || "",
        });
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Product not loaded",
          text: error.message || "Failed to fetch affiliate product.",
          confirmButtonColor: "#E24B4A",
        });

        router.push("/admin/affiliate-products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  const handleBasicChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addArrayItem = (type, value, setInputFn) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], value.trim()],
    }));

    setInputFn("");
  };

  const removeArrayItem = (type, index) => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const addSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;

    setFormData((prev) => ({
      ...prev,
      specifications: [
        ...prev.specifications,
        { key: specKey.trim(), value: specValue.trim() },
      ],
    }));

    setSpecKey("");
    setSpecValue("");
  };

  const removeSpec = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  const addImage = () => {
    if (!imgUrl.trim()) return;

    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: imgUrl.trim(),
          alt: imgAlt.trim(),
          isPrimary: prev.images.length === 0,
        },
      ],
    }));

    setImgUrl("");
    setImgAlt("");
  };

  const removeImage = (index) => {
    setFormData((prev) => {
      const nextImages = prev.images.filter((_, i) => i !== index);

      return {
        ...prev,
        images: nextImages.map((img, i) => ({
          ...img,
          isPrimary: i === 0,
        })),
      };
    });
  };

  const buildPayload = () => ({
    ...formData,

    expertScore:
      formData.expertScore === "" ? null : Number(formData.expertScore),
    price: Number(formData.price),
    originalPrice:
      formData.originalPrice === "" ? null : Number(formData.originalPrice),
    rating: formData.rating === "" ? null : Number(formData.rating),
    reviewCount: formData.reviewCount === "" ? 0 : Number(formData.reviewCount),
    sortOrder: formData.sortOrder === "" ? 100 : Number(formData.sortOrder),

    storeId: formData.storeId || null,

    images: formData.images.map((img, index) => ({
      url: img.url,
      alt: img.alt || "",
      isPrimary: index === 0,
    })),

    specifications: formData.specifications.reduce((acc, item) => {
      if (item.key && item.value) acc[item.key] = item.value;
      return acc;
    }, {}),

    lastVerifiedAt: formData.lastVerifiedAt || new Date().toISOString(),
  });

  const validateBeforeSubmit = () => {
    if (!formData.title.trim()) return "Product title is required.";
    if (!formData.slug.trim()) return "Slug is required.";
    if (!formData.shortDescription.trim()) {
      return "Short description is required.";
    }
    if (!formData.categoryId) return "Primary category is required.";
    if (!formData.price) return "Price is required.";
    if (!formData.affiliateLink.trim()) return "Affiliate link is required.";
    if (!formData.images.length)
      return "At least one product image is required.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateBeforeSubmit();

    if (validationError) {
      Swal.fire({
        icon: "warning",
        title: "Missing required field",
        text: validationError,
        confirmButtonColor: "#2D2380",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await fetch(`/api/admin/affiliate-products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        const firstError =
          data?.errors && Object.values(data.errors).length
            ? Object.values(data.errors)[0]
            : data?.error;

        throw new Error(firstError || "Failed to update affiliate product.");
      }

      await Swal.fire({
        icon: "success",
        title: "Product updated",
        text: data?.message || "Affiliate product updated successfully.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/affiliate-products");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.message || "Failed to update affiliate product.",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete affiliate product?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "#7775A0",
    });

    if (!result.isConfirmed) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/affiliate-products/${productId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || data?.success === false) {
        throw new Error(data?.error || "Failed to delete product.");
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted",
        text: data?.message || "Affiliate product deleted successfully.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/affiliate-products");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Failed to delete product.",
        confirmButtonColor: "#E24B4A",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const submitDisabled =
    isSubmitting ||
    isLoading ||
    loadingRefs ||
    !formData.title ||
    !formData.slug ||
    !formData.shortDescription ||
    !formData.categoryId ||
    !formData.price ||
    !formData.affiliateLink ||
    !formData.images.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#2D2380] font-bold">
          <Loader2 size={22} className="animate-spin" />
          Loading affiliate product...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/affiliate-products"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <Package size={24} className="text-[#F4A836]" />
                  Edit Affiliate Product
                </h1>
                <p className="text-[#7775A0] text-[14px] mt-1">
                  Update product details, category placement, pricing, and
                  frontend section controls.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-white border border-[#FCEBEB] text-[#E24B4A] rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
                Delete
              </button>

              <button
                type="submit"
                disabled={submitDisabled}
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                  submitDisabled
                    ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                    : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSubmitting ? "Saving..." : "Update Product"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Tag size={18} className="text-[#2D2380]" /> Identity &
                  Branding
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Product Title <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleBasicChange}
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
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
                      required
                      className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] focus:border-[#2D2380] outline-none lowercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleBasicChange}
                      placeholder="e.g. Herman Miller"
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <FileText size={18} className="text-[#2D2380]" /> Editorial
                  Content
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Short Description <span className="text-[#E24B4A]">*</span>
                  </label>
                  <textarea
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleBasicChange}
                    rows={2}
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex justify-between">
                    Full Review / Description
                    <span className="text-[#7775A0] bg-[#EEEDFE] px-2 py-0.5 rounded text-[11px]">
                      HTML
                    </span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleBasicChange}
                    rows={6}
                    className="w-full px-4 py-2.5 bg-[#1A1340] border-[1.5px] border-[#1A1340] rounded-lg text-[13px] font-mono text-[#F7F6FF] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Expert Score / 10
                    </label>
                    <input
                      type="number"
                      name="expertScore"
                      value={formData.expertScore}
                      onChange={handleBasicChange}
                      min="0"
                      max="10"
                      step="0.1"
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Ribbon Text
                    </label>
                    <input
                      type="text"
                      name="ribbonText"
                      value={formData.ribbonText}
                      onChange={handleBasicChange}
                      placeholder="EDITOR'S CHOICE"
                      maxLength={50}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Editor's Bottom Line
                    </label>
                    <textarea
                      name="bottomLine"
                      value={formData.bottomLine}
                      onChange={handleBasicChange}
                      rows={2}
                      placeholder="Final verdict..."
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex items-center gap-2">
                      <Award size={14} className="text-[#F4A836]" /> Award Badge
                    </label>
                    <input
                      type="text"
                      name="awardBadge"
                      value={formData.awardBadge}
                      onChange={handleBasicChange}
                      placeholder="e.g. Premium Pick"
                      className="w-full px-4 py-2.5 bg-[#FFFBF4] border-[1.5px] border-[#F4A836]/40 rounded-lg text-[14px] text-[#BA7517] focus:border-[#F4A836] font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <ListChecks size={18} className="text-[#2D2380]" /> Pros, Cons
                  & Highlights
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[13px] font-bold text-[#22B07D] mb-2">
                      The Good Pros
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={proInput}
                        onChange={(e) => setProInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(),
                          addArrayItem("pros", proInput, setProInput))
                        }
                        placeholder="Add a pro..."
                        className="flex-1 px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#22B07D] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          addArrayItem("pros", proInput, setProInput)
                        }
                        className="bg-[#E1F5EE] text-[#22B07D] p-2 rounded-md hover:bg-[#22B07D] hover:text-white transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <ul className="space-y-2">
                      {formData.pros.map((pro, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between bg-[#F7F6FF] px-3 py-2 rounded border border-[#E0DEF5] text-[13px] text-[#1A1340]"
                        >
                          <span className="flex items-center gap-2">
                            <Check size={14} className="text-[#22B07D]" />
                            {pro}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArrayItem("pros", idx)}
                            className="text-[#7775A0] hover:text-[#E24B4A]"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-[#E24B4A] mb-2">
                      The Bad Cons
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={conInput}
                        onChange={(e) => setConInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          (e.preventDefault(),
                          addArrayItem("cons", conInput, setConInput))
                        }
                        placeholder="Add a con..."
                        className="flex-1 px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#E24B4A] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          addArrayItem("cons", conInput, setConInput)
                        }
                        className="bg-[#FCEBEB] text-[#E24B4A] p-2 rounded-md hover:bg-[#E24B4A] hover:text-white transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <ul className="space-y-2">
                      {formData.cons.map((con, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between bg-[#F7F6FF] px-3 py-2 rounded border border-[#E0DEF5] text-[13px] text-[#1A1340]"
                        >
                          <span className="flex items-center gap-2">
                            <X size={14} className="text-[#E24B4A]" />
                            {con}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeArrayItem("cons", idx)}
                            className="text-[#7775A0] hover:text-[#E24B4A]"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-[#2D2380] mb-2">
                    Highlights
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={highlightInput}
                      onChange={(e) => setHighlightInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(),
                        addArrayItem(
                          "highlights",
                          highlightInput,
                          setHighlightInput,
                        ))
                      }
                      placeholder="Add a product highlight..."
                      className="flex-1 px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addArrayItem(
                          "highlights",
                          highlightInput,
                          setHighlightInput,
                        )
                      }
                      className="bg-[#EEEDFE] text-[#2D2380] p-2 rounded-md hover:bg-[#2D2380] hover:text-white transition-colors"
                    >
                      <Plus size={18} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {formData.highlights.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-[#F7F6FF] px-3 py-2 rounded border border-[#E0DEF5] text-[13px] text-[#1A1340]"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeArrayItem("highlights", idx)}
                          className="text-[#7775A0] hover:text-[#E24B4A]"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <ImageIcon size={18} className="text-[#2D2380]" /> Media &
                  Specifications
                </h2>

                <div className="mb-6">
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Product Images <span className="text-[#E24B4A]">*</span>
                  </label>

                  <div className="flex gap-2 mb-4">
                    <input
                      type="url"
                      value={imgUrl}
                      onChange={(e) => setImgUrl(e.target.value)}
                      placeholder="Image URL..."
                      className="flex-[2] px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                    <input
                      type="text"
                      value={imgAlt}
                      onChange={(e) => setImgAlt(e.target.value)}
                      placeholder="Alt text..."
                      className="flex-1 px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                    <button
                      type="button"
                      onClick={addImage}
                      className="bg-[#EEEDFE] text-[#2D2380] px-4 rounded-md font-bold hover:bg-[#E0DEF5]"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {formData.images.map((img, idx) => (
                      <div
                        key={`${img.url}-${idx}`}
                        className="relative w-24 h-24 rounded-lg border border-[#E0DEF5] shrink-0 group"
                      >
                        <img
                          src={img.url}
                          alt={img.alt}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 rounded">
                          {idx === 0 ? "Main" : idx}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-[#E24B4A] text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Specifications Table
                  </label>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={specKey}
                      onChange={(e) => setSpecKey(e.target.value)}
                      placeholder="e.g. Weight"
                      className="flex-1 px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                    <input
                      type="text"
                      value={specValue}
                      onChange={(e) => setSpecValue(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addSpec())
                      }
                      placeholder="e.g. 15 kg"
                      className="flex-[2] px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                    <button
                      type="button"
                      onClick={addSpec}
                      className="bg-[#EEEDFE] text-[#2D2380] px-3 rounded-md hover:bg-[#E0DEF5]"
                    >
                      <ListPlus size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.specifications.map((spec, idx) => (
                      <div
                        key={`${spec.key}-${idx}`}
                        className="flex items-center justify-between bg-[#F7F6FF] px-3 py-2 rounded border border-[#E0DEF5] text-[13px]"
                      >
                        <div>
                          <span className="font-bold text-[#1A1340]">
                            {spec.key}:
                          </span>{" "}
                          <span className="text-[#7775A0]">{spec.value}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSpec(idx)}
                          className="text-[#7775A0] hover:text-[#E24B4A]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#2D2380] rounded-xl p-6 shadow-lg space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#2D2380]"></div>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <DollarSign size={18} className="text-[#2D2380]" /> Pricing &
                  Links
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Affiliate Redirect URL{" "}
                    <span className="text-[#E24B4A]">*</span>
                  </label>
                  <div className="relative">
                    <Link2
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
                    />
                    <input
                      type="url"
                      name="affiliateLink"
                      value={formData.affiliateLink}
                      onChange={handleBasicChange}
                      required
                      placeholder="https://..."
                      className="w-full pl-9 pr-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Deal Price <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleBasicChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] font-mono text-[#2D2380] focus:border-[#2D2380] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      MSRP Original
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={formData.originalPrice}
                      onChange={handleBasicChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] font-mono text-[#7775A0] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Currency
                    </label>
                    <input
                      type="text"
                      name="currency"
                      value={formData.currency}
                      onChange={handleBasicChange}
                      maxLength={3}
                      className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] font-bold text-[#1A1340] outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Button CTA
                    </label>
                    <input
                      type="text"
                      name="ctaText"
                      value={formData.ctaText}
                      onChange={handleBasicChange}
                      maxLength={50}
                      className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Taxonomy &
                  Setup
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Primary Category <span className="text-[#E24B4A]">*</span>
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleBasicChange}
                    required
                    disabled={loadingRefs}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="">
                      {loadingRefs
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>
                    {categories.map((category) => (
                      <option
                        key={category._id || category.id}
                        value={category._id || category.id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Store / Merchant Optional
                  </label>
                  <select
                    name="storeId"
                    value={formData.storeId}
                    onChange={handleBasicChange}
                    disabled={loadingRefs}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="">
                      {loadingRefs ? "Loading stores..." : "None / Direct"}
                    </option>
                    {stores.map((store) => (
                      <option
                        key={store._id || store.id}
                        value={store._id || store.id}
                      >
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mt-4 mb-1.5">
                    Publishing Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[13px] font-bold text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="draft">Draft Hidden</option>
                    <option value="published">Published Live</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Settings size={18} className="text-[#2D2380]" /> Category
                  Page Sections
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Display Variant
                  </label>
                  <select
                    name="displayVariant"
                    value={formData.displayVariant}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="featured_horizontal">
                      Featured Horizontal
                    </option>
                    <option value="compact_grid">Compact Grid</option>
                    <option value="hero_spotlight">Hero Spotlight</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    ["isTopPick", "Show in Top Picks"],
                    ["isTrending", "Show in Trending"],
                    ["isHotDeal", "Show in Hot Deals"],
                    ["showInCategoryPage", "Show on Category Page"],
                  ].map(([name, label]) => (
                    <label
                      key={name}
                      className="flex items-center justify-between bg-[#F7F6FF] border border-[#E0DEF5] rounded-md px-3 py-2 text-[13px] font-semibold text-[#1A1340]"
                    >
                      {label}
                      <input
                        type="checkbox"
                        name={name}
                        checked={Boolean(formData[name])}
                        onChange={handleBasicChange}
                      />
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Last Verified At
                  </label>
                  <input
                    type="date"
                    name="lastVerifiedAt"
                    value={formData.lastVerifiedAt}
                    onChange={handleBasicChange}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <FileText size={18} className="text-[#2D2380]" /> SEO
                </h2>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    SEO Title
                  </label>
                  <input
                    type="text"
                    name="seoTitle"
                    value={formData.seoTitle}
                    onChange={handleBasicChange}
                    maxLength={70}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    SEO Description
                  </label>
                  <textarea
                    name="seoDescription"
                    value={formData.seoDescription}
                    onChange={handleBasicChange}
                    maxLength={160}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] focus:border-[#2D2380] outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
