/* models/category.js */
import mongoose from "mongoose";

const { Schema } = mongoose;

function isValidUrl(str) {
  if (!str) return true;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeSlug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const SeoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, default: "", maxlength: 120 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 320 },
    canonicalUrl: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrl,
        message: "seo.canonicalUrl must be a valid http/https URL.",
      },
    },
    indexable: { type: Boolean, default: true },
  },
  { _id: false },
);

const ImageSchema = new Schema(
  {
    url: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: isValidUrl,
        message: "Image URL must be a valid http/https URL.",
      },
    },
    alt: { type: String, trim: true, default: "", maxlength: 200 },
  },
  { _id: false },
);

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      maxlength: 120,
    },

    // 🔥 NOTE: 'unique: true' removed here to allow same slug across different types
    slug: {
      type: String,
      required: [true, "Category slug is required."],
      trim: true,
      lowercase: true,
      index: true,
      maxlength: 160,
    },

    type: {
      type: String,
      enum: ["store", "blog", "product", "general"],
      default: "general",
      index: true,
    },

    shortDescription: { type: String, trim: true, default: "", maxlength: 300 },
    description: { type: String, trim: true, default: "", maxlength: 5000 },

    image: { type: ImageSchema, default: () => ({}) },
    icon: { type: String, trim: true, default: "", maxlength: 200 },

    uiConfig: {
      heroBanner: { type: ImageSchema, default: () => ({}) },
      heroHeadline: { type: String, trim: true, default: "", maxlength: 150 },
      heroSubtitle: { type: String, trim: true, default: "", maxlength: 300 },
      themeColor: { type: String, trim: true, default: "", maxlength: 20 },
      keyFeatures: {
        type: [{ type: String, trim: true, maxlength: 60 }],
        default: [],
        validate: {
          validator: (items) => items.length <= 8,
          message: "uiConfig.keyFeatures cannot exceed 8 items.",
        },
      },
    },

    aggregateRating: {
      ratingValue: { type: Number, default: 0, min: 0, max: 5 },
      reviewCount: { type: Number, default: 0, min: 0 },
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true,
    },

    isFeatured: { type: Boolean, default: false, index: true },
    featuredOrder: { type: Number, default: 1000, index: true },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },

    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
      index: true,
    },

    ancestors: [{ type: Schema.Types.ObjectId, ref: "Category" }],

    sortOrder: { type: Number, default: 1000, index: true },

    bestStores: {
      type: [{ type: Schema.Types.ObjectId, ref: "Store" }],
      default: [],
      validate: {
        validator: (items) => items.length <= 10,
        message: "bestStores cannot exceed 10 items.",
      },
    },

    seo: { type: SeoSchema, default: () => ({}) },
  },
  { timestamps: true },
);

// ─── Normalization Middleware ────────────────────────────────────────────────
CategorySchema.pre("validate", function () {
  if (this.name) this.name = String(this.name).trim();
  if (this.slug) this.slug = normalizeSlug(this.slug);
  if (this.icon) this.icon = String(this.icon).trim();
  if (this.uiConfig?.themeColor) this.uiConfig.themeColor = String(this.uiConfig.themeColor).trim();

  if (Array.isArray(this.uiConfig?.keyFeatures)) {
    const cleaned = this.uiConfig.keyFeatures
      .map((item) => String(item || "").trim())
      .filter(Boolean);
    this.uiConfig.keyFeatures = [...new Set(cleaned)];
  }
});

// ─── Hierarchy Middleware ───────────────────────────────────────────────────
CategorySchema.pre("save", async function () {
  if (!this.isModified("parentId")) return;

  if (!this.parentId) {
    this.ancestors = [];
    this.level = 0;
    return;
  }

  if (this._id && String(this.parentId) === String(this._id)) {
    throw new Error("Category parentId cannot reference itself.");
  }

  const parent = await mongoose
    .model("Category")
    .findById(this.parentId)
    .select("_id ancestors level status")
    .lean();

  if (!parent) throw new Error("Parent category not found.");
  if (parent.status !== "active") throw new Error("Inactive parent cannot be assigned.");

  const parentAncestors = parent.ancestors || [];
  const newAncestors = [...parentAncestors, parent._id];

  if (this._id && newAncestors.some((id) => String(id) === String(this._id))) {
    throw new Error("Circular category hierarchy detected.");
  }

  const newLevel = Number(parent.level || 0) + 1;
  if (newLevel > 2) throw new Error("Category hierarchy cannot exceed 3 levels.");

  this.ancestors = newAncestors;
  this.level = newLevel;
});

// ─── Production Compound Indexes ───────────────────────────────────────────

// 🔥 Compound Unique Index: Allows same slug across different types (e.g. store: 'accessories' & product: 'accessories')
CategorySchema.index({ slug: 1, type: 1 }, { unique: true, name: "slug_1_type_1_unique" });

// High-performance query indexes
CategorySchema.index({ type: 1, status: 1, sortOrder: 1 });
CategorySchema.index({ status: 1, parentId: 1, sortOrder: 1, name: 1 });
CategorySchema.index({ status: 1, isFeatured: 1, featuredOrder: 1 });
CategorySchema.index({ ancestors: 1 });
CategorySchema.index({ status: 1, level: 1, sortOrder: 1 });
CategorySchema.index({ name: "text", shortDescription: "text", description: "text" });

export default mongoose.models.Category || mongoose.model("Category", CategorySchema);