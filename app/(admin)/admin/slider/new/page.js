"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  BookOpen,
  LayoutTemplate,
  Video,
  Layers,
  Target,
  Activity,
  Highlighter,
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
  status: "active",
  schedule: {
    startDate: "",
    endDate: "",
  },
  sortOrder: 0,
};

const NewHeroSlideEditor = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const availableCountries = [
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "PK", name: "Pakistan" },
    { code: "AE", name: "UAE" },
  ];

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

    const primaryButtonLabel = formData.buttons.primary.label.trim();
    const primaryButtonUrl = formData.buttons.primary.url.trim();

    const secondaryButtonLabel = formData.buttons.secondary.label.trim();
    const secondaryButtonUrl = formData.buttons.secondary.url.trim();

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
          isFullCta && primaryButtonLabel
            ? {
                label: primaryButtonLabel,
                url: primaryButtonUrl,
                style: "primary",
                icon: formData.buttons.primary.icon.trim(),
              }
            : null,

        secondary:
          isFullCta && secondaryButtonLabel
            ? {
                label: secondaryButtonLabel,
                url: secondaryButtonUrl,
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
        timezone: "UTC",
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
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Failed to create hero slide.",
        );
      }

      await Swal.fire({
        title: "Slide Created!",
        text: data.message || "The hero slide has been successfully added.",
        icon: "success",
        confirmButtonColor: "#2D2380",
        customClass: { popup: "rounded-[12px]" },
      });

      setFormData(initialFormData);
      router.push("/admin/slider");
      router.refresh();
    } catch (error) {
      console.error("POST /api/admin/hero-slides Error:", error);

      Swal.fire({
        title: "Error!",
        text: error.message || "Something went wrong.",
        icon: "error",
        confirmButtonColor: "#E24B4A",
        customClass: { popup: "rounded-[12px]" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showTextConfig = formData.slideType !== "image_only";
  const showButtonConfig = formData.slideType === "full_cta";
  const showGlobalLink = formData.slideType !== "full_cta";
  const isVideo = formData.media.mediaType === "video";

  const SectionHeader = ({ title, icon: Icon }) => (
    <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4 mb-5">
      <Icon size={18} className="text-[#2D2380]" />
      {title}
    </h2>
  );

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
                  Design Hero Banner
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Build dynamic homepage slides with the DealVerse dual media
                  engine.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.internalName ||
                !formData.media.desktopUrl ||
                !formData.media.altText
              }
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-[0_4px_14px_rgba(255,107,53,0.3)] transition-all duration-150 ${
                isSubmitting ||
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
              Publish Banner
            </button>
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
                      Internal Name (Admin Only){" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="internalName"
                      value={formData.internalName}
                      onChange={handleBasicChange}
                      placeholder="e.g. Black Friday - Tech Video"
                      maxLength={100}
                      required
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Campaign Ref (UTM)
                    </label>
                    <input
                      type="text"
                      name="campaignRef"
                      value={formData.campaignRef}
                      onChange={handleBasicChange}
                      placeholder="e.g. bf_tech_2026"
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-2">
                    Slide Layout Type
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          slideType: "image_only",
                        }))
                      }
                      className={`p-3 border-[1.5px] rounded-xl flex flex-col items-center gap-2 transition-all ${
                        formData.slideType === "image_only"
                          ? "border-[#2D2380] bg-[#EEEDFE] text-[#2D2380]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0]"
                      }`}
                    >
                      <ImageIcon size={24} />
                      <span className="text-[13px] font-bold">
                        Image/Video Only
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          slideType: "text_overlay",
                        }))
                      }
                      className={`p-3 border-[1.5px] rounded-xl flex flex-col items-center gap-2 transition-all ${
                        formData.slideType === "text_overlay"
                          ? "border-[#2D2380] bg-[#EEEDFE] text-[#2D2380]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0]"
                      }`}
                    >
                      <Type size={24} />
                      <span className="text-[13px] font-bold">
                        Text Overlay
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          slideType: "full_cta",
                        }))
                      }
                      className={`p-3 border-[1.5px] rounded-xl flex flex-col items-center gap-2 transition-all ${
                        formData.slideType === "full_cta"
                          ? "border-[#F4A836] bg-[#FAEEDA] text-[#BA7517]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0]"
                      }`}
                    >
                      <MousePointerClick size={24} />
                      <span className="text-[13px] font-bold">
                        Full CTA Block
                      </span>
                    </button>
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
                      {isVideo ? "Video (MP4)" : "Banner"}{" "}
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
                      placeholder={
                        isVideo ? "https://.../video.mp4" : "Image URL..."
                      }
                      required
                      className="w-full px-3 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340]">
                      <Smartphone size={16} className="text-[#2D2380]" /> Mobile
                      Portrait (Optional)
                    </label>
                    <input
                      type="url"
                      value={formData.media.mobileUrl}
                      onChange={(e) =>
                        handleNestedChange("media", "mobileUrl", e.target.value)
                      }
                      placeholder={
                        isVideo
                          ? "Vertical Video URL..."
                          : "Mobile Image URL..."
                      }
                      className="w-full px-3 py-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-md text-[13px] outline-none"
                    />
                  </div>
                </div>

                {isVideo && (
                  <div className="pt-2 animate-in fade-in">
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Poster Image Fallback URL{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.media.posterUrl}
                      onChange={(e) =>
                        handleNestedChange("media", "posterUrl", e.target.value)
                      }
                      placeholder="Image shown while video loads..."
                      required={isVideo}
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                    <p className="text-[11px] text-[#7775A0] mt-1">
                      Required to prevent blank spaces on mobile devices that
                      block autoplay.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Alt Text (Accessibility){" "}
                    <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.media.altText}
                    onChange={(e) =>
                      handleNestedChange("media", "altText", e.target.value)
                    }
                    placeholder="Describe the image/video..."
                    required
                    maxLength={150}
                    className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                  />
                </div>

                {showGlobalLink && (
                  <div className="pt-2 border-t border-[#F7F6FF]">
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
                      placeholder="Redirect URL when user clicks banner..."
                      className="w-full px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>
                )}
              </div>

              {showTextConfig && (
                <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-bottom-4">
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
                                : "text-[#7775A0] hover:text-[#1A1340]"
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
                        Text Theme (Contrast)
                      </label>
                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        <button
                          type="button"
                          onClick={() =>
                            handleNestedChange("design", "theme", "dark")
                          }
                          className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[12px] font-bold rounded-md transition-colors ${
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
                          className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 text-[12px] font-bold rounded-md transition-colors ${
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
                        <Layers size={16} className="text-[#F4A836]" />{" "}
                        Background Overlay Filter
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
                        className="w-4 h-4 rounded border-[#E0DEF5] text-[#2D2380] focus:ring-[#2D2380]"
                      />
                    </div>

                    {formData.design.overlay.active && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in">
                        <div>
                          <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                            Color (Hex)
                          </label>
                          <div className="flex items-center gap-2">
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
                              className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            />
                            <input
                              type="text"
                              value={formData.design.overlay.color}
                              onChange={(e) =>
                                handleDeepNestedChange(
                                  "design",
                                  "overlay",
                                  "color",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 bg-white border border-[#E0DEF5] rounded text-[12px] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-[#7775A0] uppercase mb-1">
                            Opacity ({formData.design.overlay.opacity})
                          </label>
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
                            className="w-full h-2 bg-[#E0DEF5] rounded-lg appearance-none cursor-pointer accent-[#2D2380]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Top Badge
                    </label>
                    <input
                      type="text"
                      value={formData.content.badge}
                      onChange={(e) =>
                        handleNestedChange("content", "badge", e.target.value)
                      }
                      placeholder="e.g. Flash Sale"
                      maxLength={30}
                      className="w-full md:w-1/2 px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Main Heading (H2)
                    </label>
                    <input
                      type="text"
                      value={formData.content.heading}
                      onChange={(e) =>
                        handleNestedChange("content", "heading", e.target.value)
                      }
                      placeholder="e.g. Up to 80% Off Amazon Tech"
                      maxLength={80}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[16px] font-bold outline-none focus:border-[#2D2380]"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      <Highlighter size={14} className="text-[#F4A836]" />{" "}
                      Highlight Word (Auto Gold Color)
                    </label>
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
                      placeholder="e.g. Amazon Tech (must match text in heading)"
                      className="w-full md:w-1/2 px-4 py-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] outline-none focus:border-[#2D2380]"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                      Subheading
                    </label>
                    <textarea
                      value={formData.content.subheading}
                      onChange={(e) =>
                        handleNestedChange(
                          "content",
                          "subheading",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Grab the latest gadgets before they run out."
                      rows={2}
                      maxLength={160}
                      className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] outline-none focus:border-[#2D2380] resize-none"
                    />
                  </div>
                </div>
              )}

              {showButtonConfig && (
                <div className="bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 shadow-md space-y-5 animate-in fade-in slide-in-from-bottom-4">
                  <SectionHeader
                    title="Call To Action Buttons"
                    icon={MousePointerClick}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <h3 className="text-[#FF6B35] text-[13px] font-bold">
                        Primary Button
                      </h3>
                      <input
                        type="text"
                        value={formData.buttons.primary.label}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "buttons",
                            "primary",
                            "label",
                            e.target.value,
                          )
                        }
                        placeholder="Label (e.g. Shop Now)"
                        maxLength={40}
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                      />
                      <input
                        type="url"
                        value={formData.buttons.primary.url}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "buttons",
                            "primary",
                            "url",
                            e.target.value,
                          )
                        }
                        placeholder="Target URL"
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                      />
                      <input
                        type="text"
                        value={formData.buttons.primary.icon}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "buttons",
                            "primary",
                            "icon",
                            e.target.value,
                          )
                        }
                        placeholder="Icon Name (e.g. Tag, ArrowRight)"
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                      />
                    </div>

                    <div className="space-y-3 bg-[rgba(255,255,255,0.05)] p-4 rounded-lg border border-[rgba(255,255,255,0.1)]">
                      <h3 className="text-[#A09EC0] text-[13px] font-bold">
                        Secondary Button (Optional)
                      </h3>
                      <input
                        type="text"
                        value={formData.buttons.secondary.label}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "buttons",
                            "secondary",
                            "label",
                            e.target.value,
                          )
                        }
                        placeholder="Label (e.g. Read Guide)"
                        maxLength={40}
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                      />
                      <input
                        type="url"
                        value={formData.buttons.secondary.url}
                        onChange={(e) =>
                          handleDeepNestedChange(
                            "buttons",
                            "secondary",
                            "url",
                            e.target.value,
                          )
                        }
                        placeholder="Target URL"
                        className="w-full px-3 py-2 bg-[rgba(0,0,0,0.3)] border border-[#4A3DBF] rounded-md text-white text-[13px] outline-none"
                      />
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
                        <option value="ghost">Ghost (Transparent)</option>
                        <option value="secondary">Outlined</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Delivery & Devices" icon={Globe} />

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Slide Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleBasicChange}
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active (Live Immediately)</option>
                    <option value="inactive">Inactive</option>
                    <option value="scheduled">
                      Scheduled (Waits for Date)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Device Visibility
                  </label>
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
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340] mb-2">
                    <Target size={16} className="text-[#E24B4A]" />{" "}
                    Geo-Targeting
                  </label>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                    <label className="flex items-center gap-2 p-2 hover:bg-[#F7F6FF] rounded cursor-pointer transition-colors border border-transparent hover:border-[#E0DEF5]">
                      <input
                        type="checkbox"
                        checked={formData.targeting.countries.length === 0}
                        onChange={() =>
                          handleNestedChange("targeting", "countries", [])
                        }
                        className="w-4 h-4 rounded border-[#E0DEF5] text-[#22B07D] focus:ring-[#22B07D]"
                      />
                      <span className="text-[13px] text-[#1A1340] font-medium">
                        Global (All Regions)
                      </span>
                    </label>

                    {availableCountries.map((country) => (
                      <label
                        key={country.code}
                        className="flex items-center gap-2 p-2 hover:bg-[#F7F6FF] rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.targeting.countries.includes(
                            country.code,
                          )}
                          onChange={() => handleCountryToggle(country.code)}
                          className="w-4 h-4 rounded border-[#E0DEF5] text-[#2D2380] focus:ring-[#2D2380]"
                        />
                        <span className="text-[13px] text-[#7775A0]">
                          {country.name} ({country.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Automation" icon={Calendar} />
                <p className="text-[12px] text-[#7775A0] mb-3">
                  Set dates to automatically push the banner live and hide it
                  when sales end.
                </p>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.schedule.startDate}
                    onChange={(e) =>
                      handleNestedChange(
                        "schedule",
                        "startDate",
                        e.target.value,
                      )
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.schedule.endDate}
                    onChange={(e) =>
                      handleNestedChange("schedule", "endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                  />
                </div>
              </div>

              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-4">
                <SectionHeader title="Sequence" icon={Settings} />
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Sort Order (0 = First)
                  </label>
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
          </div>
        </form>

        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              DealVerse Slider Guide
            </h2>
          </div>

          <p className="text-[#A09EC0] text-[14px] mb-8 leading-relaxed">
            The Hero Slider is built dynamically. Everything you enter here
            automatically adjusts on the front-end to ensure perfect design and
            mobile responsiveness without writing code.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg">
              <h3 className="text-[#F4A836] font-bold text-[14px] flex items-center gap-2">
                <LayoutTemplate size={16} /> Slide Types
              </h3>
              <ul className="text-[12px] text-[#E0DEF5] space-y-2 list-disc pl-4">
                <li>
                  <b>Image Only:</b> Purely graphical. The entire image becomes
                  clickable.
                </li>
                <li>
                  <b>Text Overlay:</b> Shows your background with text on top.
                  No buttons.
                </li>
                <li>
                  <b>Full CTA:</b> Maximum conversion layout. Includes text,
                  search bar, and action buttons.
                </li>
              </ul>
            </div>

            <div className="space-y-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg">
              <h3 className="text-[#22B07D] font-bold text-[14px] flex items-center gap-2">
                <Video size={16} /> Dual Media Engine
              </h3>
              <p className="text-[12px] text-[#E0DEF5] leading-relaxed">
                You can use a standard Image, or set it to Video to make your
                banner come alive. If you upload a mobile vertical URL, phone
                users will see the portrait version to save data and screen
                space. <b>Always upload a poster image for videos!</b>
              </p>
            </div>

            <div className="space-y-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg">
              <h3 className="text-white font-bold text-[14px] flex items-center gap-2">
                <Highlighter size={16} /> Highlighting & Overlay
              </h3>
              <p className="text-[12px] text-[#E0DEF5] leading-relaxed">
                Use the <b>Highlight Word</b> field to automatically paint a
                specific word in your heading Gold. Use the{" "}
                <b>Overlay Filter</b> to darken a bright image so your white
                text remains perfectly readable (WCAG AA compliant).
              </p>
            </div>

            <div className="space-y-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg">
              <h3 className="text-[#E24B4A] font-bold text-[14px] flex items-center gap-2">
                <Target size={16} /> Geo-Targeting
              </h3>
              <p className="text-[12px] text-[#E0DEF5] leading-relaxed">
                By default, a banner is <b>Global</b>. However, if you are
                running a Daraz sale just for Pakistan, select "PK" from the
                Geo-Targeting list. A user visiting from the US will not see
                this banner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHeroSlideEditor;
