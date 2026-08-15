"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Monitor,
  Smartphone,
  Image as ImageIcon,
  Type,
  MousePointerClick,
  Settings,
  Calendar,
  Globe,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sun,
  Moon,
  Loader2,
  LayoutTemplate,
  Video,
  Layers,
  Target,
  Activity,
  Highlighter,
  RefreshCw,
  Trash2,
} from "lucide-react";

const API_URL = "/api/admin/hero-slides";

const initialFormData = {
  internalName: "",
  campaignRef: "",
  slideType: "full_cta",
  design: {
    alignment: "left",
    theme: "dark",
    overlay: { active: true, color: "#1A1340", opacity: 0.5 },
  },
  media: {
    mediaType: "image",
    desktopUrl: "",
    mobileUrl: "",
    posterUrl: "",
    altText: "",
    globalLink: "",
    videoSettings: { autoPlay: true, loop: true, muted: true },
  },
  content: {
    badge: "",
    heading: "",
    subheading: "",
    highlightWord: "",
  },
  buttons: {
    primary: { label: "", url: "", style: "primary", icon: "" },
    secondary: { label: "", url: "", style: "ghost", icon: "" },
  },
  targeting: {
    countries: [],
    deviceVisibility: "all",
  },
  status: "draft",
  schedule: {
    startDate: "",
    endDate: "",
    timezone: "UTC",
  },
  sortOrder: 0,
};

function formatDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function mapSlideToFormData(slide) {
  return {
    internalName: slide?.internalName || "",
    campaignRef: slide?.campaignRef || "",
    slideType: slide?.slideType || "full_cta",

    design: {
      alignment: slide?.design?.alignment || "left",
      theme: slide?.design?.theme || "dark",
      overlay: {
        active: Boolean(slide?.design?.overlay?.active),
        color: slide?.design?.overlay?.color || "#1A1340",
        opacity:
          slide?.design?.overlay?.opacity === 0
            ? 0
            : Number(slide?.design?.overlay?.opacity ?? 0.5),
      },
    },

    media: {
      mediaType: slide?.media?.mediaType || "image",
      desktopUrl: slide?.media?.desktopUrl || "",
      mobileUrl: slide?.media?.mobileUrl || "",
      posterUrl: slide?.media?.posterUrl || "",
      altText: slide?.media?.altText || "",
      globalLink: slide?.media?.globalLink || "",
      videoSettings: {
        autoPlay: slide?.media?.videoSettings?.autoPlay ?? true,
        loop: slide?.media?.videoSettings?.loop ?? true,
        muted: slide?.media?.videoSettings?.muted ?? true,
      },
    },

    content: {
      badge: slide?.content?.badge || "",
      heading: slide?.content?.heading || "",
      subheading: slide?.content?.subheading || "",
      highlightWord: slide?.content?.highlightWord || "",
    },

    buttons: {
      primary: {
        label: slide?.buttons?.primary?.label || "",
        url: slide?.buttons?.primary?.url || "",
        style: slide?.buttons?.primary?.style || "primary",
        icon: slide?.buttons?.primary?.icon || "",
      },
      secondary: {
        label: slide?.buttons?.secondary?.label || "",
        url: slide?.buttons?.secondary?.url || "",
        style: slide?.buttons?.secondary?.style || "ghost",
        icon: slide?.buttons?.secondary?.icon || "",
      },
    },

    targeting: {
      countries: Array.isArray(slide?.targeting?.countries)
        ? slide.targeting.countries
        : [],
      deviceVisibility: slide?.targeting?.deviceVisibility || "all",
    },

    status: slide?.status || "draft",

    schedule: {
      startDate: formatDateTimeLocal(slide?.schedule?.startDate),
      endDate: formatDateTimeLocal(slide?.schedule?.endDate),
      timezone: slide?.schedule?.timezone || "UTC",
    },

    sortOrder: Number(slide?.sortOrder || 0),
  };
}

const EditHeroSlidePage = () => {
  const router = useRouter();
  const params = useParams();
  const slideId = params?.id;

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const availableCountries = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "PK", name: "Pakistan" },
    { code: "AE", name: "UAE" },
  ];

  const fetchSlide = useCallback(async () => {
    if (!slideId) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/${slideId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch hero slide.");
      }

      setFormData(mapSlideToFormData(data.slide));
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to load hero slide.",
        icon: "error",
        confirmButtonColor: "#E24B4A",
        customClass: { popup: "rounded-[12px]" },
      });

      router.push("/admin/slider");
    } finally {
      setLoading(false);
    }
  }, [slideId, router]);

  useEffect(() => {
    fetchSlide();
  }, [fetchSlide]);

  const handleBasicChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "sortOrder" ? Number(value) : value,
    }));
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

  const handleCountryToggle = (code) => {
    setFormData((prev) => {
      const current = prev.targeting.countries;

      const updated = current.includes(code)
        ? current.filter((countryCode) => countryCode !== code)
        : [...current, code];

      return {
        ...prev,
        targeting: {
          ...prev.targeting,
          countries: updated,
        },
      };
    });
  };

  const buildHeroSlidePayload = () => {
    const isImageOnly = formData.slideType === "image_only";
    const isFullCta = formData.slideType === "full_cta";
    const isVideo = formData.media.mediaType === "video";

    const primaryLabel = formData.buttons.primary.label.trim();
    const primaryUrl = formData.buttons.primary.url.trim();
    const secondaryLabel = formData.buttons.secondary.label.trim();
    const secondaryUrl = formData.buttons.secondary.url.trim();

    return {
      internalName: formData.internalName.trim(),
      campaignRef: formData.campaignRef.trim(),

      slideType: formData.slideType,

      design: {
        alignment: formData.design.alignment,
        theme: formData.design.theme,
        overlay: {
          active: Boolean(formData.design.overlay.active),
          color: formData.design.overlay.color || "#1A1340",
          opacity: Number(formData.design.overlay.opacity ?? 0.5),
        },
      },

      media: {
        mediaType: formData.media.mediaType,
        desktopUrl: formData.media.desktopUrl.trim(),
        mobileUrl: formData.media.mobileUrl.trim(),
        posterUrl: isVideo ? formData.media.posterUrl.trim() : "",
        altText: formData.media.altText.trim(),
        globalLink: isFullCta ? "" : formData.media.globalLink.trim(),
        videoSettings: {
          autoPlay: Boolean(formData.media.videoSettings.autoPlay),
          loop: Boolean(formData.media.videoSettings.loop),
          muted: Boolean(formData.media.videoSettings.muted),
        },
      },

      content: {
        badge: isImageOnly ? "" : formData.content.badge.trim(),
        heading: isImageOnly ? "" : formData.content.heading.trim(),
        subheading: isImageOnly ? "" : formData.content.subheading.trim(),
        highlightWord: isImageOnly ? "" : formData.content.highlightWord.trim(),
      },

      buttons: {
        primary:
          isFullCta && primaryLabel
            ? {
                label: primaryLabel,
                url: primaryUrl,
                style: "primary",
                icon: formData.buttons.primary.icon.trim(),
              }
            : null,

        secondary:
          isFullCta && secondaryLabel
            ? {
                label: secondaryLabel,
                url: secondaryUrl,
                style: formData.buttons.secondary.style || "ghost",
                icon: formData.buttons.secondary.icon?.trim() || "",
              }
            : null,
      },

      targeting: {
        countries: Array.isArray(formData.targeting.countries)
          ? formData.targeting.countries
              .filter(Boolean)
              .map((country) => String(country).trim().toUpperCase())
          : [],
        deviceVisibility: formData.targeting.deviceVisibility || "all",
      },

      status: formData.status || "draft",

      schedule: {
        startDate: formData.schedule.startDate || null,
        endDate: formData.schedule.endDate || null,
        timezone: formData.schedule.timezone || "UTC",
      },

      sortOrder: Number(formData.sortOrder || 0),
    };
  };

  const validateHeroSlide = (payload) => {
    if (!payload.internalName) return "Internal name is required.";
    if (!payload.slideType) return "Slide type is required.";
    if (!payload.media.desktopUrl) return "Desktop media URL is required.";
    if (!payload.media.altText) return "Alt text is required.";

    if (payload.media.mediaType === "video" && !payload.media.posterUrl) {
      return "Poster image fallback is required for video slides.";
    }

    if (
      payload.schedule.startDate &&
      payload.schedule.endDate &&
      new Date(payload.schedule.startDate) >= new Date(payload.schedule.endDate)
    ) {
      return "Schedule end date must be after start date.";
    }

    if (
      payload.slideType === "full_cta" &&
      payload.buttons.primary &&
      !payload.buttons.primary.url
    ) {
      return "Primary CTA URL is required when primary button label is added.";
    }

    if (
      payload.slideType === "full_cta" &&
      payload.buttons.secondary &&
      !payload.buttons.secondary.url
    ) {
      return "Secondary CTA URL is required when secondary button label is added.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = buildHeroSlidePayload();
    const validationError = validateHeroSlide(payload);

    if (validationError) {
      Swal.fire({
        title: "Validation Error",
        text: validationError,
        icon: "warning",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/${slideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to update hero slide.",
        );
      }

      await Swal.fire({
        title: "Slide Updated!",
        text: data.message || "Hero slide updated successfully.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });

      router.push("/admin/slider");
      router.refresh();
    } catch (error) {
      Swal.fire({
        title: "Update Failed",
        text: error.message || "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#E24B4A",
        customClass: { popup: "rounded-[12px]" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Delete this slide?",
      text: "This action will permanently remove this hero slide.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#E24B4A",
      cancelButtonColor: "transparent",
      confirmButtonText: "Yes, delete it",
      customClass: {
        popup: "rounded-[12px]",
        cancelButton: "text-[#7775A0] border border-[#E0DEF5]",
      },
    });

    if (!result.isConfirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`${API_URL}/${slideId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete hero slide.");
      }

      await Swal.fire({
        title: "Deleted!",
        text: data.message || "Hero slide deleted successfully.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });

      router.push("/admin/slider");
      router.refresh();
    } catch (error) {
      Swal.fire({
        title: "Delete Failed",
        text: error.message || "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#E24B4A",
        customClass: { popup: "rounded-[12px]" },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const showTextConfig = formData.slideType !== "image_only";
  const showButtonConfig = formData.slideType === "full_cta";
  const showGlobalLink = formData.slideType !== "full_cta";
  const isVideo = formData.media.mediaType === "video";

  const SectionHeader = ({ title, icon: Icon, dark = false }) => (
    <h2
      className={`text-[16px] font-bold flex items-center gap-2 border-b pb-4 mb-5 ${
        dark ? "text-white border-white/10" : "text-[#1A1340] border-[#E0DEF5]"
      }`}
    >
      <Icon size={18} className={dark ? "text-[#F4A836]" : "text-[#2D2380]"} />
      {title}
    </h2>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 font-sans flex items-center justify-center">
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-8 shadow-sm flex items-center gap-3 text-[#7775A0] font-semibold">
          <Loader2 size={22} className="animate-spin text-[#2D2380]" />
          Loading hero slide...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 font-sans">
      <div className="max-w-[1200px] mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/slider"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <LayoutTemplate size={24} className="text-[#F4A836]" />
                  Edit Hero Banner
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Update homepage slide media, content, targeting, schedule, and
                  CTA configuration.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={fetchSlide}
                disabled={isSubmitting || isDeleting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-[14px] bg-white border border-[#E0DEF5] text-[#2D2380] hover:bg-[#EEEDFE] transition-all disabled:opacity-60"
              >
                <RefreshCw size={17} />
                Reset
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-[14px] bg-[#FCEBEB] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white transition-all disabled:opacity-60"
              >
                {isDeleting ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Trash2 size={17} />
                )}
                Delete
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  isDeleting ||
                  !formData.internalName ||
                  !formData.media.desktopUrl ||
                  !formData.media.altText
                }
                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-[0_4px_14px_rgba(255,107,53,0.3)] transition-all duration-150 ${
                  isSubmitting ||
                  isDeleting ||
                  !formData.internalName ||
                  !formData.media.desktopUrl ||
                  !formData.media.altText
                    ? "bg-[#FF6B35]/40 text-white cursor-not-allowed shadow-none"
                    : "bg-[#FF6B35] hover:bg-[#e05520] hover:-translate-y-0.5 text-white"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Update Banner
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <SectionHeader
                  title="Banner Identity & Architecture"
                  icon={Activity}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Internal Name <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="internalName"
                      value={formData.internalName}
                      onChange={handleBasicChange}
                      maxLength={100}
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Campaign Ref
                    </label>
                    <input
                      type="text"
                      name="campaignRef"
                      value={formData.campaignRef}
                      onChange={handleBasicChange}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Slide Layout Type
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      {
                        value: "image_only",
                        label: "Image/Video Only",
                        icon: ImageIcon,
                      },
                      {
                        value: "text_overlay",
                        label: "Text Overlay",
                        icon: Type,
                      },
                      {
                        value: "full_cta",
                        label: "Full CTA Block",
                        icon: MousePointerClick,
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isActive = formData.slideType === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              slideType: item.value,
                            }))
                          }
                          className={`p-3 border-[1.5px] rounded-xl flex flex-col items-center gap-2 transition-all ${
                            isActive && item.value === "full_cta"
                              ? "border-[#F4A836] bg-[#FAEEDA] text-[#BA7517]"
                              : isActive
                                ? "border-[#2D2380] bg-[#EEEDFE] text-[#2D2380]"
                                : "border-[#E0DEF5] bg-white text-[#7775A0]"
                          }`}
                        >
                          <Icon size={24} />
                          <span className="text-[13px] font-bold">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#E0DEF5] pb-4 mb-5">
                  <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2">
                    <ImageIcon size={18} className="text-[#2D2380]" /> Media
                    Assets
                  </h2>

                  <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                    <button
                      type="button"
                      onClick={() =>
                        handleNestedChange("media", "mediaType", "image")
                      }
                      className={`px-4 py-1.5 flex items-center gap-2 text-[12px] font-bold rounded-md transition-colors ${
                        !isVideo
                          ? "bg-white text-[#2D2380] shadow-sm"
                          : "text-[#7775A0]"
                      }`}
                    >
                      <ImageIcon size={14} /> Image
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleNestedChange("media", "mediaType", "video")
                      }
                      className={`px-4 py-1.5 flex items-center gap-2 text-[12px] font-bold rounded-md transition-colors ${
                        isVideo
                          ? "bg-[#1A1340] text-white shadow-sm"
                          : "text-[#7775A0]"
                      }`}
                    >
                      <Video size={14} /> Video
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340]">
                      <Monitor size={16} className="text-[#2D2380]" /> Desktop{" "}
                      {isVideo ? "Video" : "Banner"}{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.media.desktopUrl}
                      onChange={(e) =>
                        handleNestedChange(
                          "media",
                          "desktopUrl",
                          e.target.value,
                        )
                      }
                      required
                      className="w-full px-3 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340]">
                      <Smartphone size={16} className="text-[#2D2380]" /> Mobile
                      Portrait
                    </label>
                    <input
                      type="url"
                      value={formData.media.mobileUrl}
                      onChange={(e) =>
                        handleNestedChange("media", "mobileUrl", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>
                </div>

                {isVideo && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Poster Image Fallback{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.media.posterUrl}
                      onChange={(e) =>
                        handleNestedChange("media", "posterUrl", e.target.value)
                      }
                      required
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Alt Text <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.media.altText}
                    onChange={(e) =>
                      handleNestedChange("media", "altText", e.target.value)
                    }
                    maxLength={150}
                    required
                    className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                  />
                </div>

                {showGlobalLink && (
                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Global Slide Link
                    </label>
                    <input
                      type="url"
                      value={formData.media.globalLink}
                      onChange={(e) =>
                        handleNestedChange(
                          "media",
                          "globalLink",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                )}
              </div>

              {showTextConfig && (
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                  <SectionHeader title="Design & Typography" icon={Type} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#F7F6FF]">
                    <div>
                      <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                        Text Alignment
                      </label>
                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        {["left", "center", "right"].map((align) => (
                          <button
                            key={align}
                            type="button"
                            onClick={() =>
                              handleNestedChange("design", "alignment", align)
                            }
                            className={`flex-1 py-1.5 flex justify-center items-center rounded-md transition-colors ${
                              formData.design.alignment === align
                                ? "bg-white text-[#2D2380] shadow-sm"
                                : "text-[#7775A0]"
                            }`}
                          >
                            {align === "left" && <AlignLeft size={16} />}
                            {align === "center" && <AlignCenter size={16} />}
                            {align === "right" && <AlignRight size={16} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                        Text Theme
                      </label>
                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        <button
                          type="button"
                          onClick={() =>
                            handleNestedChange("design", "theme", "dark")
                          }
                          className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[12px] font-bold rounded-md ${
                            formData.design.theme === "dark"
                              ? "bg-[#1A1340] text-white shadow-sm"
                              : "text-[#7775A0]"
                          }`}
                        >
                          <Moon size={14} /> White Text
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleNestedChange("design", "theme", "light")
                          }
                          className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[12px] font-bold rounded-md ${
                            formData.design.theme === "light"
                              ? "bg-white text-[#1A1340] shadow-sm"
                              : "text-[#7775A0]"
                          }`}
                        >
                          <Sun size={14} /> Dark Text
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-[#F7F6FF] rounded-lg border border-[#E0DEF5] space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1340]">
                        <Layers size={16} className="text-[#F4A836]" /> Overlay
                        Filter
                      </label>
                      <input
                        type="checkbox"
                        checked={formData.design.overlay.active}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "design",
                            "overlay",
                            "active",
                            e.target.checked,
                          )
                        }
                        className="w-4 h-4 rounded border-[#E0DEF5]"
                      />
                    </div>

                    {formData.design.overlay.active && (
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="color"
                          value={formData.design.overlay.color}
                          onChange={(e) =>
                            handleDeepNestedChange(
                              "design",
                              "overlay",
                              "color",
                              e.target.value,
                            )
                          }
                          className="w-full h-10 rounded cursor-pointer"
                        />

                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={formData.design.overlay.opacity}
                          onChange={(e) =>
                            handleDeepNestedChange(
                              "design",
                              "overlay",
                              "opacity",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full accent-[#2D2380]"
                        />
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={formData.content.badge}
                    onChange={(e) =>
                      handleNestedChange("content", "badge", e.target.value)
                    }
                    placeholder="Top Badge"
                    maxLength={30}
                    className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                  />

                  <input
                    type="text"
                    value={formData.content.heading}
                    onChange={(e) =>
                      handleNestedChange("content", "heading", e.target.value)
                    }
                    placeholder="Main Heading"
                    maxLength={80}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[16px] font-bold outline-none focus:border-[#2D2380]"
                  />

                  <input
                    type="text"
                    value={formData.content.highlightWord}
                    onChange={(e) =>
                      handleNestedChange(
                        "content",
                        "highlightWord",
                        e.target.value,
                      )
                    }
                    placeholder="Highlight Word"
                    className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                  />

                  <textarea
                    value={formData.content.subheading}
                    onChange={(e) =>
                      handleNestedChange(
                        "content",
                        "subheading",
                        e.target.value,
                      )
                    }
                    placeholder="Subheading"
                    rows={2}
                    maxLength={160}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380] resize-none"
                  />
                </div>
              )}

              {showButtonConfig && (
                <div className="bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 shadow-md space-y-5">
                  <SectionHeader
                    title="Call To Action Buttons"
                    icon={MousePointerClick}
                    dark
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {["primary", "secondary"].map((buttonType) => (
                      <div
                        key={buttonType}
                        className="space-y-3 bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]"
                      >
                        <h3
                          className={`text-[13px] font-bold ${
                            buttonType === "primary"
                              ? "text-[#FF6B35]"
                              : "text-[#A09EC0]"
                          }`}
                        >
                          {buttonType === "primary"
                            ? "Primary Button"
                            : "Secondary Button"}
                        </h3>

                        <input
                          type="text"
                          value={formData.buttons[buttonType].label}
                          onChange={(e) =>
                            handleDeepNestedChange(
                              "buttons",
                              buttonType,
                              "label",
                              e.target.value,
                            )
                          }
                          placeholder="Label"
                          maxLength={40}
                          className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                        />

                        <input
                          type="url"
                          value={formData.buttons[buttonType].url}
                          onChange={(e) =>
                            handleDeepNestedChange(
                              "buttons",
                              buttonType,
                              "url",
                              e.target.value,
                            )
                          }
                          placeholder="Target URL"
                          className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                        />

                        <input
                          type="text"
                          value={formData.buttons[buttonType].icon}
                          onChange={(e) =>
                            handleDeepNestedChange(
                              "buttons",
                              buttonType,
                              "icon",
                              e.target.value,
                            )
                          }
                          placeholder="Icon Name"
                          className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                        />

                        {buttonType === "secondary" && (
                          <select
                            value={formData.buttons.secondary.style}
                            onChange={(e) =>
                              handleDeepNestedChange(
                                "buttons",
                                "secondary",
                                "style",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-[#A09EC0] text-[13px] outline-none"
                          >
                            <option value="ghost">Ghost</option>
                            <option value="secondary">Outlined</option>
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Delivery & Devices" icon={Globe} />

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleBasicChange}
                  className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="scheduled">Scheduled</option>
                </select>

                <select
                  value={formData.targeting.deviceVisibility}
                  onChange={(e) =>
                    handleNestedChange(
                      "targeting",
                      "deviceVisibility",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                >
                  <option value="all">Show on All Devices</option>
                  <option value="desktop_only">Desktop Only</option>
                  <option value="mobile_only">Mobile Only</option>
                </select>

                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-2 p-2 hover:bg-[#F7F6FF] rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.targeting.countries.length === 0}
                      onChange={() =>
                        handleNestedChange("targeting", "countries", [])
                      }
                      className="w-4 h-4 rounded border-[#E0DEF5]"
                    />
                    <span className="text-[13px] text-[#1A1340] font-medium">
                      Global
                    </span>
                  </label>

                  {availableCountries.map((country) => (
                    <label
                      key={country.code}
                      className="flex items-center gap-2 p-2 hover:bg-[#F7F6FF] rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.targeting.countries.includes(
                          country.code,
                        )}
                        onChange={() => handleCountryToggle(country.code)}
                        className="w-4 h-4 rounded border-[#E0DEF5]"
                      />
                      <span className="text-[13px] text-[#7775A0]">
                        {country.name} ({country.code})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Automation" icon={Calendar} />

                <input
                  type="datetime-local"
                  value={formData.schedule.startDate}
                  onChange={(e) =>
                    handleNestedChange("schedule", "startDate", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                />

                <input
                  type="datetime-local"
                  value={formData.schedule.endDate}
                  onChange={(e) =>
                    handleNestedChange("schedule", "endDate", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                />
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Sequence" icon={Settings} />

                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleBasicChange}
                  className="w-full px-3 py-2 bg-[#F7F6FF] border border-[#E0DEF5] rounded-md text-[14px] outline-none"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditHeroSlidePage;
