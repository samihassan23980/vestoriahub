// app/models/galleryImage.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const GALLERY_STATUS = ["active", "draft", "archived"];

const UsedInSchema = new Schema(
  {
    products: { type: Number, default: 0, min: 0, index: true },
    categories: { type: Number, default: 0, min: 0, index: true },
    banners: { type: Number, default: 0, min: 0, index: true },
  },
  { _id: false },
);

const GalleryImageSchema = new Schema(
  {
    /* -----------------------------
       Storage / Source
    ----------------------------- */
    url: {
      type: String,
      required: [true, "Image url is required"],
      trim: true,
      unique: true,
      index: true,
    },

    // Cloudinary only (optional)
    publicId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },

    // Optional: Where it came from (helps if you use stock images too)
    source: {
      type: String,
      enum: ["cloudinary", "backblaze", "s3", "stock", "other"],
      default: "other",
      index: true,
    },

    /* -----------------------------
       SEO / Content
    ----------------------------- */
    alt: { type: String, trim: true, maxlength: 160 },
    title: { type: String, trim: true, maxlength: 160 },
    caption: { type: String, trim: true, maxlength: 500 },
    tags: [{ type: String, trim: true, index: true }],

    /* -----------------------------
       Next/Image Performance
    ----------------------------- */
    width: { type: Number, min: 1, default: 800 },
    height: { type: Number, min: 1, default: 800 },
    format: { type: String, trim: true, maxlength: 12 }, // jpg, png, webp, avif
    bytes: { type: Number, min: 0 }, // file size

    // Optional: if you generate blur placeholder
    blurDataURL: { type: String, trim: true },

    /* -----------------------------
       Usage Tracking (Safety)
    ----------------------------- */
    usedIn: { type: UsedInSchema, default: () => ({}) },

    /* -----------------------------
       Admin Controls
    ----------------------------- */
    status: {
      type: String,
      enum: GALLERY_STATUS,
      default: "active",
      index: true,
    },

    // Soft delete (optional but safe)
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: { virtuals: true },
  },
);

/* -----------------------------
   Business Rules
----------------------------- */
GalleryImageSchema.pre("validate", function () {
  // normalize tags (trim + remove empty + unique)
  if (Array.isArray(this.tags)) {
    const cleaned = this.tags
      .map((t) => String(t || "").trim())
      .filter(Boolean);
    this.tags = Array.from(new Set(cleaned));
  }

  // If url exists but alt missing, you can auto-fill a safe default (optional)
  if (!this.alt && this.title) this.alt = this.title;

  // If soft deleted, set deletedAt
  if (this.isDeleted && !this.deletedAt) this.deletedAt = new Date();
  if (!this.isDeleted && this.deletedAt) this.deletedAt = null;

  // Safety: ensure usedIn never goes negative (in case of bad updates)
  const ui = this.usedIn || {};
  ["products", "categories", "banners"].forEach((k) => {
    if (ui[k] == null) ui[k] = 0;
    ui[k] = Math.max(0, Number(ui[k] || 0));
  });
  this.usedIn = ui;
});

/* -----------------------------
   Indexes
----------------------------- */
// Fast filters
GalleryImageSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
GalleryImageSchema.index({ source: 1, status: 1, createdAt: -1 });

// Search
GalleryImageSchema.index({
  title: "text",
  caption: "text",
  alt: "text",
  tags: "text",
});

// Useful for cleanup queries: "unused images"
GalleryImageSchema.index({
  "usedIn.products": 1,
  "usedIn.categories": 1,
  "usedIn.banners": 1,
});

/* -----------------------------
   Exports
----------------------------- */
export const GALLERY_STATUS_OPTIONS = GALLERY_STATUS;

export default mongoose.models.GalleryImage ||
  mongoose.model("GalleryImage", GalleryImageSchema);
