/* app/Components/media/MediaUploader.js */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import {
  UploadCloud,
  X,
  Loader2,
  ImagePlus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const COLORS = {
  ink: "#1A1340",
  indigo: "#2D2380",
  violet: "#4A3DBF",
  gold: "#F4A836",
  coral: "#FF6B35",
  mist: "#F7F6FF",
  lilac: "#EEEDFE",
  border: "#E0DEF5",
  slate: "#7775A0",
  success: "#22B07D",
  error: "#E24B4A",
};

const DEFAULT_MAX_SIZE_MB = 8;

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
}

function normalizeArray(value, multiple) {
  if (multiple) return Array.isArray(value) ? value : [];
  return value ? [value] : [];
}

function normalizeImagePayload(img = {}) {
  return {
    galleryId: img.galleryId || img._id || img.id || "",
    url: img.url || "",
    publicId: img.publicId || "",
    alt: img.alt || "",
    title: img.title || "",
    width: img.width || null,
    height: img.height || null,
    format: img.format || "",
    bytes: img.bytes || null,
  };
}

async function getApiErrorMessage(res, fallback = "Something went wrong.") {
  try {
    const data = await res.json();
    return data?.message || data?.error || data?.details || fallback;
  } catch {
    return fallback;
  }
}

async function showError(title, text) {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Got it",
    confirmButtonColor: COLORS.error,
  });
}

async function showSuccess(title, text) {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: COLORS.violet,
  });
}

export default function MediaUploader({
  label = "Images",
  value,
  onChange,
  folder = "Products images/general",
  multiple = false,
  maxFiles = 1,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  required = false,
  disabled = false,
  allowRemove = true,
  saveToGallery = true,
  status = "active",
  className = "",
}) {
  const inputRef = useRef(null);

  const currentImages = useMemo(
    () =>
      normalizeArray(value, multiple)
        .map(normalizeImagePayload)
        .filter((x) => x.url),
    [value, multiple],
  );

  const [items, setItems] = useState(currentImages);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    setItems(currentImages);
  }, [currentImages]);

  const emitChange = (nextItems) => {
    setItems(nextItems);

    if (multiple) {
      onChange?.(nextItems);
      return;
    }

    onChange?.(nextItems[0] || null);
  };

  const validateFiles = (files) => {
    if (!files.length) return [];

    const allowed = [];
    const maxBytes = maxSizeMB * 1024 * 1024;

    for (const file of files) {
      if (!file.type?.startsWith("image/")) {
        showError("Invalid file", `${file.name} is not an image.`);
        continue;
      }

      if (file.size > maxBytes) {
        showError(
          "File too large",
          `${file.name} is ${formatBytes(file.size)}. Max allowed size is ${maxSizeMB} MB.`,
        );
        continue;
      }

      allowed.push(file);
    }

    const availableSlots = multiple ? Math.max(0, maxFiles - items.length) : 1;

    if (allowed.length > availableSlots) {
      showError(
        "Too many images",
        multiple
          ? `You can upload only ${availableSlots} more image(s). Max allowed is ${maxFiles}.`
          : "Only one image is allowed for this field.",
      );
    }

    return allowed.slice(0, availableSlots);
  };

  const uploadOneFile = async (file) => {
    const sigRes = await fetch("/api/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });

    if (!sigRes.ok) {
      const msg = await getApiErrorMessage(
        sigRes,
        "Failed to generate Cloudinary signature.",
      );
      throw new Error(msg);
    }

    const sig = await sigRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("signature", sig.signature);
    formData.append("timestamp", sig.timestamp);
    formData.append("api_key", sig.api_key);
    formData.append("folder", sig.folder);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!cloudinaryRes.ok) {
      const err = await cloudinaryRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Cloudinary upload failed.");
    }

    const cloud = await cloudinaryRes.json();

    const imagePayload = {
      url: cloud.secure_url,
      publicId: cloud.public_id,
      alt: file.name.replace(/\.[^/.]+$/, ""),
      title: file.name.replace(/\.[^/.]+$/, ""),
      width: cloud.width || null,
      height: cloud.height || null,
      format: cloud.format || "",
      bytes: cloud.bytes || null,
    };

    if (!saveToGallery) return imagePayload;

    const saveRes = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...imagePayload,
        status,
        tags: [folder.split("/").filter(Boolean).pop() || "media"],
      }),
    });

    if (!saveRes.ok) {
      const msg = await getApiErrorMessage(
        saveRes,
        "Image uploaded but failed to save metadata.",
      );
      throw new Error(msg);
    }

    const saved = await saveRes.json();
    const savedImage =
      saved?.data?.image || saved?.data || saved?.image || saved;

    return normalizeImagePayload({
      ...imagePayload,
      ...savedImage,
      galleryId: savedImage?._id || savedImage?.id || "",
    });
  };

  const handleFiles = async (event) => {
    const selectedFiles = validateFiles(Array.from(event.target.files || []));
    event.target.value = "";

    if (!selectedFiles.length) return;

    setUploading(true);
    setProgress({ done: 0, total: selectedFiles.length });

    try {
      const uploaded = [];

      for (const file of selectedFiles) {
        const image = await uploadOneFile(file);
        uploaded.push(image);
        setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      const nextItems = multiple
        ? [...items, ...uploaded]
        : uploaded.slice(0, 1);
      emitChange(nextItems);

      await showSuccess(
        "Uploaded successfully",
        `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded.`,
      );
    } catch (error) {
      await showError(
        "Upload failed",
        error?.message || "Could not upload image.",
      );
    } finally {
      setUploading(false);
      setProgress({ done: 0, total: 0 });
    }
  };

  const removeImage = async (index) => {
    if (!allowRemove || disabled) return;

    const img = items[index];

    const result = await Swal.fire({
      icon: "warning",
      title: "Remove image?",
      text: "This removes it from this field only. Gallery file will stay safe.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: COLORS.error,
    });

    if (!result.isConfirmed) return;

    const next = items.filter((_, i) => i !== index);
    emitChange(next);
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      await Swal.fire({
        icon: "success",
        title: "Copied",
        text: "Image URL copied.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      await showError("Copy failed", "Could not copy image URL.");
    }
  };

  const canAddMore = multiple ? items.length < maxFiles : items.length === 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <label
            className="text-sm font-semibold"
            style={{ color: COLORS.ink }}
          >
            {label}{" "}
            {required ? <span style={{ color: COLORS.error }}>*</span> : null}
          </label>
          <p className="text-xs" style={{ color: COLORS.slate }}>
            {multiple
              ? `Upload up to ${maxFiles} images.`
              : "Upload one image."}{" "}
            Max {maxSizeMB} MB each.
          </p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || !canAddMore}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: COLORS.violet, color: "#fff" }}
        >
          {uploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <UploadCloud size={16} />
          )}
          {uploading ? "Uploading..." : "Upload"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={handleFiles}
          disabled={disabled || uploading || !canAddMore}
        />
      </div>

      {uploading && progress.total > 0 ? (
        <div
          className="rounded-2xl border bg-white p-3"
          style={{ borderColor: COLORS.border }}
        >
          <div
            className="mb-2 flex items-center justify-between text-xs"
            style={{ color: COLORS.slate }}
          >
            <span>Uploading to Cloudinary and saving to database...</span>
            <span>
              {progress.done}/{progress.total}
            </span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: COLORS.lilac }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(progress.done / progress.total) * 100}%`,
                backgroundColor: COLORS.gold,
              }}
            />
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex w-full items-center justify-center gap-3 rounded-3xl border border-dashed bg-white px-4 py-8 text-sm disabled:opacity-50"
          style={{ borderColor: COLORS.border, color: COLORS.slate }}
        >
          <ImagePlus size={20} />
          No image selected. Click to upload.
        </button>
      ) : (
        <div
          className={
            multiple
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "grid grid-cols-1 gap-4"
          }
        >
          {items.map((img, index) => (
            <div
              key={`${img.url}-${index}`}
              className="overflow-hidden rounded-3xl border bg-white shadow-sm"
              style={{ borderColor: COLORS.border }}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F7F6FF]">
                <Image
                  src={img.url}
                  alt={img.alt || img.title || "Uploaded image"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />

                <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold shadow">
                  {img.format ? img.format.toUpperCase() : "IMAGE"}
                </div>

                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(img.url)}
                    className="rounded-full bg-white/95 p-2 shadow hover:bg-white"
                    title="Copy URL"
                  >
                    <Copy size={14} />
                  </button>

                  {allowRemove ? (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="rounded-full bg-white/95 p-2 shadow hover:bg-white"
                      title="Remove"
                      style={{ color: COLORS.error }}
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate text-sm font-semibold"
                      style={{ color: COLORS.ink }}
                    >
                      {img.title || "Uploaded image"}
                    </p>
                    <p className="text-xs" style={{ color: COLORS.slate }}>
                      {img.width && img.height
                        ? `${img.width}×${img.height}`
                        : "Dimensions unavailable"}
                      {img.bytes ? ` • ${formatBytes(img.bytes)}` : ""}
                    </p>
                  </div>

                  {img.galleryId ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                      style={{
                        backgroundColor: "#22B07D14",
                        color: COLORS.success,
                      }}
                    >
                      <CheckCircle2 size={12} />
                      Saved
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                      style={{
                        backgroundColor: "#E24B4A14",
                        color: COLORS.error,
                      }}
                    >
                      <AlertCircle size={12} />
                      Unsaved
                    </span>
                  )}
                </div>

                <input
                  value={img.alt || ""}
                  onChange={(e) => {
                    const next = items.map((item, i) =>
                      i === index ? { ...item, alt: e.target.value } : item,
                    );
                    emitChange(next);
                  }}
                  placeholder="Alt text for SEO"
                  className="w-full rounded-2xl border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: COLORS.border }}
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
