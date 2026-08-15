"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Swal from "sweetalert2";
import { gsap } from "gsap";
import {
  Loader2,
  Trash2,
  UploadCloud,
  X,
  Copy,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ImagePlus,
  Info,
  Tag,
  Edit,
  ExternalLink,
  Database,
  Cloud,
} from "lucide-react";

/* -----------------------------------------
   JJYP Brand Tokens (Official)
------------------------------------------*/
const COLORS = {
  bg: "#ffffff",
  softBg: "#f7f8fb",
  text: "#000000",
  mutedText: "rgba(0,0,0,0.65)",
  border: "rgba(0,0,0,0.10)",
  red: "#ff0000",
  yellow: "#ffde01",
  green: "#1bb402",
  blue: "#0090ff",
};

/* -----------------------------------------
   Helpers
------------------------------------------*/
const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = bytes > 0 ? Math.floor(Math.log(bytes) / Math.log(k)) : 0;
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
};

const sumBytes = (arr) => arr.reduce((acc, f) => acc + (f?.size || 0), 0);

const normalizeTags = (val) =>
  Array.from(
    new Set(
      String(val || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ""))
    )
  );

const getApiErrorMessage = async (res, fallback = "Something went wrong.") => {
  try {
    const data = await res.json();
    return (
      data?.message ||
      data?.error ||
      (Array.isArray(data?.errors) ? data.errors.join(", ") : null) ||
      fallback
    );
  } catch {
    return fallback;
  }
};

/* -----------------------------------------
   SweetAlert wrappers
------------------------------------------*/
const showSuccess = (title, text) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "OK",
    confirmButtonColor: COLORS.red,
  });

const showError = (title, text) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Got it",
    confirmButtonColor: COLORS.red,
  });

const showConfirm = ({ title, text, confirmText = "Yes, delete" }) =>
  Swal.fire({
    icon: "warning",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: COLORS.red,
    cancelButtonColor: "#6b7280",
  });

const showInfo = (title, html) =>
  Swal.fire({
    icon: "info",
    title,
    html,
    confirmButtonText: "Got it",
    confirmButtonColor: COLORS.blue,
  });

/* -----------------------------------------
   Page — Admin Gallery (UPDATED)
------------------------------------------*/
export default function AdminGalleryPage() {
  const topRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [totalSizeBytes, setTotalSizeBytes] = useState(0);

  const [newImage, setNewImage] = useState({
    title: "",
    alt: "",
    caption: "",
    tags: "",
    status: "active",
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlyUnused, setOnlyUnused] = useState(false);

  /* ---------------- Animation ---------------- */
  useEffect(() => {
    if (!topRef.current) return;
    gsap.fromTo(
      topRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  /* ---------------- Fetch images ---------------- */
  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gallery");
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.data) {
        setImages(data.data);
      } else {
        await showError("Could not load gallery", data.message || "Please try again.");
      }
    } catch (error) {
      await showError("Could not load gallery", error?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- File handlers ---------------- */
  const handleMetaChange = (e) => {
    const { name, value } = e.target;
    setNewImage((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file types
    const validFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
    if (validFiles.length !== selectedFiles.length) {
      showError("Invalid files", "Only image files are allowed.");
      return;
    }

    setFiles(validFiles);
    setPreviews(validFiles.map((f) => URL.createObjectURL(f)));
    setTotalSizeBytes(sumBytes(validFiles));
  };

  const removePreview = (index) => {
    setPreviews((prev) => {
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setTotalSizeBytes(sumBytes(next));
      return next;
    });
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => previews.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetUpload = () => {
    setFiles([]);
    setPreviews((prev) => {
      prev.forEach((u) => { try { URL.revokeObjectURL(u); } catch {} });
      return [];
    });
    setTotalSizeBytes(0);
    setUploadProgress({ done: 0, total: 0 });
    setNewImage({ title: "", alt: "", caption: "", tags: "", status: "active" });
  };

  /* ---------------- Usage check ---------------- */
  const canDelete = (img) => {
    const used = img?.usedIn || {};
    return (Number(used.products || 0) + Number(used.categories || 0) + Number(used.banners || 0)) === 0;
  };

  /* ---------------- UPLOAD (UPDATED) ---------------- */
  const handleUpload = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      await showError("No images selected", "Please select at least one image.");
      return;
    }

    const tagsArr = normalizeTags(newImage.tags);
    setUploading(true);
    setUploadProgress({ done: 0, total: files.length });

    try {
      // ✅ Step 1: Get upload signature (supports custom folder)
      const sigRes = await fetch("/api/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "Products images/gallery" }),
      });

      if (!sigRes.ok) {
        const msg = await getApiErrorMessage(sigRes, "Failed to get upload signature.");
        await showError("Upload failed", msg);
        return;
      }

      const { signature, timestamp, api_key, cloud_name, folder } = await sigRes.json();

      // ✅ Step 2: Upload each file to Cloudinary
      const uploadedFiles = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("signature", signature);
        formData.append("timestamp", timestamp);
        formData.append("api_key", api_key);
        formData.append("folder", folder);

        const cloudinaryRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          { method: "POST", body: formData }
        );

        if (!cloudinaryRes.ok) {
          const err = await cloudinaryRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || "Cloudinary upload failed");
        }

        const data = await cloudinaryRes.json();
        uploadedFiles.push({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
          bytes: data.bytes,
        });

        setUploadProgress((prev) => ({ ...prev, done: prev.done + 1 }));
      }

      // ✅ Step 3: Save metadata to database
      for (const img of uploadedFiles) {
        const saveRes = await fetch("/api/gallery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: img.url,
            publicId: img.publicId,
            title: newImage.title,
            alt: newImage.alt,
            caption: newImage.caption,
            tags: tagsArr,
            status: newImage.status,
            width: img.width,
            height: img.height,
            format: img.format,
            bytes: img.bytes,
          }),
        });

        if (!saveRes.ok) {
          const msg = await getApiErrorMessage(saveRes, "Failed to save image metadata.");
          throw new Error(msg);
        }
      }

      await fetchImages();
      resetUpload();
      await showSuccess("Uploaded successfully", `${uploadedFiles.length} image(s) added to gallery.`);
    } catch (error) {
      await showError("Something went wrong", error?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Delete (UPDATED - with Cloudinary) ---------------- */
  const handleDelete = async (img) => {
    if (!canDelete(img)) {
      const used = img.usedIn || {};
      await showError(
        "Image is in use",
        `Products: ${used.products || 0}, Categories: ${used.categories || 0}, Banners: ${used.banners || 0}. Remove it from those places first.`
      );
      return;
    }

    const result = await showConfirm({
      title: "Delete this image?",
      text: "This will permanently remove it from database AND Cloudinary. Cannot be undone.",
      confirmText: "Yes, delete permanently",
    });
    
    if (!result.isConfirmed) return;

    try {
      // ✅ Hard delete: removes from DB + Cloudinary
      const res = await fetch(`/api/gallery?id=${img._id || img.id}&hard=true`, { 
        method: "DELETE" 
      });

      if (!res.ok) {
        const msg = await getApiErrorMessage(res, "Failed to delete.");
        await showError("Delete failed", msg);
        return;
      }

      const data = await res.json();

      // Remove from local state
      setImages((prev) => prev.filter((x) => (x._id || x.id) !== (img._id || img.id)));

      // Show success with details
      if (data.cloudinary?.warning) {
        await showInfo(
          "Deleted from database",
          `<p class="text-sm">Image removed from database.</p>
           <p class="text-xs text-gray-600 mt-2">${data.cloudinary.warning}</p>`
        );
      } else {
        await showSuccess(
          "Deleted successfully", 
          "Image removed from database and Cloudinary."
        );
      }
    } catch (err) {
      await showError("Delete failed", err?.message || "Failed to delete.");
    }
  };

  /* ---------------- Copy URL ---------------- */
  const handleCopyLink = async (url) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      await Swal.fire({ 
        icon: "success", 
        title: "Copied", 
        text: "Link copied to clipboard!", 
        timer: 1500, 
        showConfirmButton: false 
      });
    } catch {
      await showError("Copy failed", "Could not copy the link.");
    }
  };

  /* ---------------- View Image Details ---------------- */
  const handleViewDetails = async (img) => {
    const used = img?.usedIn || {};
    const totalUsage = Number(used.products || 0) + Number(used.categories || 0) + Number(used.banners || 0);

    await Swal.fire({
      title: img.title || "Image Details",
      html: `
        <div class="text-left space-y-3 text-sm">
          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Basic Info</p>
            <p><strong>Dimensions:</strong> ${img.width || "—"}×${img.height || "—"}</p>
            <p><strong>Format:</strong> ${img.format?.toUpperCase() || "—"}</p>
            <p><strong>Size:</strong> ${formatBytes(img.bytes)}</p>
            <p><strong>Status:</strong> <span class="px-2 py-0.5 rounded-full text-xs bg-gray-100">${img.status || "active"}</span></p>
          </div>

          ${img.publicId ? `
          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Cloudinary</p>
            <p class="text-xs break-all bg-gray-50 p-2 rounded">${img.publicId}</p>
          </div>
          ` : ''}

          ${img.alt ? `
          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Alt Text</p>
            <p class="text-xs">${img.alt}</p>
          </div>
          ` : ''}

          ${img.caption ? `
          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Caption</p>
            <p class="text-xs">${img.caption}</p>
          </div>
          ` : ''}

          ${img.tags?.length ? `
          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Tags</p>
            <p class="text-xs">${img.tags.map(t => `#${t}`).join(", ")}</p>
          </div>
          ` : ''}

          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">Usage</p>
            <p><strong>Total:</strong> ${totalUsage} place${totalUsage !== 1 ? 's' : ''}</p>
            <p class="text-xs text-gray-600">Products: ${used.products || 0} • Categories: ${used.categories || 0} • Banners: ${used.banners || 0}</p>
          </div>

          <div class="space-y-1">
            <p class="text-xs text-gray-500 uppercase font-semibold">URL</p>
            <p class="text-xs break-all bg-gray-50 p-2 rounded">${img.url}</p>
          </div>
        </div>
      `,
      confirmButtonText: "Close",
      confirmButtonColor: COLORS.blue,
      width: "32rem",
    });
  };

  /* ---------------- Filtered list ---------------- */
  const filtered = useMemo(() => {
    let list = Array.isArray(images) ? images : [];
    list = list.filter((x) => !x?.isDeleted);
    if (statusFilter !== "all") list = list.filter((x) => x.status === statusFilter);
    if (onlyUnused) list = list.filter((x) => canDelete(x));
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((x) => {
        const tags = Array.isArray(x.tags) ? x.tags.join(" ") : "";
        return (
          String(x.title || "").toLowerCase().includes(needle) ||
          String(x.alt || "").toLowerCase().includes(needle) ||
          String(x.caption || "").toLowerCase().includes(needle) ||
          tags.toLowerCase().includes(needle)
        );
      });
    }
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [images, q, statusFilter, onlyUnused]);

  const usageText = (img) => {
    const u = img?.usedIn || {};
    const p = Number(u.products || 0), c = Number(u.categories || 0), b = Number(u.banners || 0);
    const total = p + c + b;
    if (total === 0) return { 
      label: "Unused", 
      cls: "bg-[#1bb402]/10 text-[#1bb402] border-[#1bb402]/20" 
    };
    return { 
      label: `Used • ${total}`, 
      cls: "bg-[#ffde01]/35 text-black border-black/10", 
      detail: `Products: ${p} • Categories: ${c} • Banners: ${b}` 
    };
  };

  /* ---------------- RENDER ---------------- */
  return (
    <section style={{ backgroundColor: COLORS.softBg, color: COLORS.text }} className="min-h-screen py-8 px-4 md:px-6">
      <div className="max-w-7xl mx-auto space-y-8" ref={topRef}>

        {/* ─── Header ─── */}
        <header className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] border bg-white" style={{ borderColor: COLORS.border }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.blue }} />
              JJYP • Media Library
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border bg-white" style={{ borderColor: COLORS.border }} title="Always add alt text for SEO.">
              <Info size={14} />
              <span className="text-black/70">Alt text improves SEO</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border bg-white" style={{ borderColor: COLORS.border }}>
              <Cloud size={14} style={{ color: COLORS.blue }} />
              <span className="text-black/70">Cloudinary sync enabled</span>
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Gallery Manager</h1>
          <p className="text-sm md:text-base" style={{ color: COLORS.mutedText }}>
            Upload images to Cloudinary. Delete removes from both database and cloud storage.
          </p>
        </header>

        {/* ─── Upload Form ─── */}
        <form
          onSubmit={handleUpload}
          className="rounded-3xl border bg-white p-6 md:p-7 shadow-[0_14px_40px_rgba(0,0,0,0.08)] space-y-6"
          style={{ borderColor: COLORS.border }}
        >
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">Upload Images</h2>
            <p className="text-xs" style={{ color: COLORS.mutedText }}>
              Files upload directly to Cloudinary via server. Metadata saves to your database.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left — file picker + previews + progress */}
            <div className="lg:col-span-2 flex flex-col gap-2">
              <label className="text-xs font-medium" style={{ color: COLORS.mutedText }}>Select Images</label>

              <label className="group flex items-center justify-between gap-3 rounded-3xl border border-dashed px-4 py-4 cursor-pointer bg-white hover:bg-gray-50 transition" style={{ borderColor: "rgba(0,144,255,0.35)" }}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: COLORS.blue, color: "#fff" }}>
                    <UploadCloud size={18} />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">Click to choose files</span>
                    <span className="text-[11px]" style={{ color: COLORS.mutedText }}>JPG, PNG, WEBP — any size, multiple allowed</span>
                  </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] border" style={{ borderColor: COLORS.border, backgroundColor: COLORS.yellow }}>
                  <ImagePlus size={14} /> Add images
                </span>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Selected file previews */}
              {files.length > 0 && (
                <div className="rounded-2xl border bg-white p-3" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs" style={{ color: COLORS.mutedText }}>
                      Selected: <span className="font-semibold text-black">{files.length}</span> • Size:{" "}
                      <span className="font-semibold text-black">{formatBytes(totalSizeBytes)}</span>
                    </p>
                    <button type="button" onClick={resetUpload} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium hover:bg-black/5 transition" style={{ borderColor: COLORS.border }}>
                      <X size={14} /> Clear
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative rounded-2xl border bg-white p-1 shadow-sm" style={{ borderColor: COLORS.border }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="Preview" className="h-24 w-24 rounded-xl object-cover" />
                        <button type="button" onClick={() => removePreview(i)} className="absolute -top-2 -right-2 rounded-full border bg-white p-1 shadow-sm hover:bg-red-50 transition" style={{ borderColor: COLORS.border }} aria-label="Remove">
                          <X size={12} style={{ color: COLORS.red }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {uploading && uploadProgress.total > 0 && (
                <div className="rounded-2xl border bg-white p-4 space-y-2" style={{ borderColor: COLORS.border }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: COLORS.mutedText }}>
                      {uploadProgress.done < uploadProgress.total ? "Uploading to Cloudinary…" : "Saving to database…"}
                    </p>
                    <p className="text-xs font-semibold text-black">{uploadProgress.done} / {uploadProgress.total}</p>
                  </div>
                  <div className="w-full rounded-full overflow-hidden" style={{ height: 6, backgroundColor: "rgba(0,0,0,0.08)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%`, backgroundColor: COLORS.blue }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right — Meta panel */}
            <div className="rounded-3xl border bg-white p-4 space-y-3" style={{ borderColor: COLORS.border }}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: COLORS.mutedText }}>Meta Details</p>

              <Select label="Status" name="status" value={newImage.status} onChange={handleMetaChange}
                options={[{ value: "active", label: "Active" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" }]}
              />
              <Input label="Title (optional)" name="title" value={newImage.title} onChange={handleMetaChange} />
              <Input label="Alt Text (SEO)" name="alt" value={newImage.alt} onChange={handleMetaChange} placeholder="e.g. Kids cotton tee - JJYP" />
              <Textarea label="Caption (optional)" name="caption" value={newImage.caption} onChange={handleMetaChange} rows={3} />

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: COLORS.mutedText }}>Tags (comma separated)</label>
                <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2" style={{ borderColor: COLORS.border }}>
                  <Tag size={16} className="text-black/60" />
                  <input name="tags" value={newImage.tags} onChange={handleMetaChange} placeholder="kids, summer, banner" className="w-full bg-transparent text-sm outline-none" />
                </div>
                <p className="text-[11px]" style={{ color: COLORS.mutedText }}>Tip: use consistent tags (e.g. kids, category, banner)</p>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={uploading || files.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition hover:opacity-90"
                  style={{ backgroundColor: COLORS.red, color: "#fff" }}
                >
                  {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                  {uploading ? "Uploading..." : "Upload & Save Images"}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* ─── Filter Controls ─── */}
        <section className="rounded-3xl border bg-white p-4 md:p-5 shadow-[0_14px_40px_rgba(0,0,0,0.06)]" style={{ borderColor: COLORS.border }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2" style={{ borderColor: COLORS.border }}>
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, alt, caption, tags..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-2xl border bg-white px-3 py-2" style={{ borderColor: COLORS.border }}>
                <Filter size={16} />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent text-sm outline-none">
                  <option value="all">All status</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <button type="button" onClick={() => setOnlyUnused((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium hover:bg-black/5 transition"
                style={{ borderColor: COLORS.border, backgroundColor: onlyUnused ? COLORS.green : "white", color: onlyUnused ? "white" : "black" }}
              >
                {onlyUnused ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {onlyUnused ? "Unused only" : "All images"}
              </button>
              <div className="text-xs" style={{ color: COLORS.mutedText }}>
                Showing <span className="font-semibold text-black">{filtered.length}</span> of <span className="font-semibold text-black">{images.filter((x) => !x?.isDeleted).length}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Image Grid ─── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gallery Images</h2>
            <span className="text-xs rounded-full border bg-white px-3 py-1" style={{ borderColor: COLORS.border }}>
              <Database size={12} className="inline mr-1" />
              Hover cards for actions
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed py-10 text-center text-sm" style={{ borderColor: COLORS.border, backgroundColor: "#fff", color: COLORS.mutedText }}>
              No images found. Try changing filters or upload new images.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {filtered.map((img) => {
                const id = img._id || img.id;
                const usage = usageText(img);
                const deletable = canDelete(img);

                return (
                  <div key={id} className="group relative flex flex-col rounded-3xl border bg-white p-3 shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]" style={{ borderColor: COLORS.border }}>
                    <div className="relative w-full overflow-hidden rounded-2xl border bg-[#f3f4f6]" style={{ borderColor: COLORS.border }}>
                      <div className="relative aspect-[3/4] w-full">
                        <Image
                          src={img.url}
                          alt={img.alt || img.title || "Gallery image"}
                          fill
                          className="object-contain transition duration-300 group-hover:scale-[1.04]"
                          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, (max-width:1536px) 33vw, 20vw"
                          loading="lazy"
                        />
                      </div>

                      {/* Hover actions */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleCopyLink(img.url)} className="inline-flex items-center justify-center rounded-full border bg-white/95 p-2 shadow-sm hover:bg-black/5 transition" style={{ borderColor: COLORS.border }} type="button" aria-label="Copy URL" title="Copy URL">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => handleViewDetails(img)} className="inline-flex items-center justify-center rounded-full border bg-white/95 p-2 shadow-sm hover:bg-black/5 transition" style={{ borderColor: COLORS.border }} type="button" aria-label="View details" title="View details">
                            <Info size={14} />
                          </button>
                          <a href={img.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border bg-white/95 p-2 shadow-sm hover:bg-black/5 transition" style={{ borderColor: COLORS.border }} aria-label="Open in new tab" title="Open in new tab">
                            <ExternalLink size={14} />
                          </a>
                        </div>
                        <button onClick={() => handleDelete(img)} className="inline-flex items-center justify-center rounded-full border bg-white/95 p-2 shadow-sm hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition" style={{ borderColor: COLORS.border, color: deletable ? COLORS.red : "rgba(0,0,0,0.35)" }} type="button" aria-label="Delete" title={deletable ? "Delete from DB + Cloudinary" : "Cannot delete: image in use"} disabled={!deletable}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Bottom badges */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${usage.cls}`}>{usage.label}</span>
                        <span className="inline-flex items-center rounded-full border bg-white/90 px-2 py-0.5 text-[10px] font-semibold" style={{ borderColor: COLORS.border }}>{img.status || "active"}</span>
                      </div>
                    </div>

                    {/* Card info */}
                    <div className="mt-3 space-y-1">
                      <h3 className="text-sm font-semibold truncate">{img.title || "Untitled Image"}</h3>
                      {usage.detail ? (
                        <p className="text-[11px]" style={{ color: COLORS.mutedText }}>{usage.detail}</p>
                      ) : (
                        <p className="text-[11px]" style={{ color: COLORS.mutedText }}>Safe to delete if you don't need it.</p>
                      )}
                      {(img.width || img.height || img.format || img.bytes) && (
                        <p className="text-[11px]" style={{ color: COLORS.mutedText }}>
                          {img.width && img.height ? `${img.width}×${img.height}` : "—"}
                          {img.format ? ` • ${String(img.format).toUpperCase()}` : ""}
                          {img.bytes ? ` • ${formatBytes(img.bytes)}` : ""}
                        </p>
                      )}
                      {!!img.caption && <p className="text-xs line-clamp-2" style={{ color: COLORS.mutedText }}>{img.caption}</p>}
                      {!!img.tags?.length && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {img.tags.slice(0, 6).map((tag, i) => (
                            <span key={i} className="text-[10px] rounded-full border px-2 py-0.5 font-medium bg-white" style={{ borderColor: COLORS.border, color: "rgba(0,0,0,0.7)" }}>#{tag}</span>
                          ))}
                          {img.tags.length > 6 && <span className="text-[10px] rounded-full border px-2 py-0.5 font-medium bg-white" style={{ borderColor: COLORS.border, color: "rgba(0,0,0,0.7)" }}>+{img.tags.length - 6}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

/* -----------------------------------------
   Reusable Input Components
------------------------------------------*/
function Input({ label, name, type = "text", value, onChange, required, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: COLORS.mutedText }}>
        {label} {required ? <span style={{ color: COLORS.red }}>*</span> : null}
      </label>
      <input type={type} name={name} value={value} onChange={onChange} required={required} placeholder={placeholder}
        className="rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition"
        style={{ borderColor: COLORS.border, backgroundColor: "#fff", color: "#000" }}
      />
    </div>
  );
}

function Select({ label, name, value, onChange, options = [] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: COLORS.mutedText }}>{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="rounded-2xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition"
        style={{ borderColor: COLORS.border, color: "#000" }}
      >
        {options.map((opt) =>
          typeof opt === "string"
            ? <option key={opt} value={opt}>{opt}</option>
            : <option key={opt.value} value={opt.value}>{opt.label}</option>
        )}
      </select>
    </div>
  );
}

function Textarea({ label, name, value, onChange, rows = 3 }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium" style={{ color: COLORS.mutedText }}>{label}</label>
      <textarea name={name} value={value} onChange={onChange} rows={rows}
        className="rounded-2xl border px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 transition resize-none"
        style={{ borderColor: COLORS.border, color: "#000" }}
      />
    </div>
  );
}