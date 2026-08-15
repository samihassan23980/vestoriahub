/**
 * @model LegalPage
 * @description Manages static and legal content (About Us, Privacy Policy, Terms).
 * Essential for FTC compliance and Google E-E-A-T signals.
 *
 * Audit considerations applied:
 * - isSystemPage added: Prevents accidental deletion of core pages (Privacy, Terms).
 * - lastRevisedAt added: Automatically updates when content changes to show users
 * the "Last Updated: [Date]" notice (a legal requirement).
 * - type enum added: Allows the frontend to easily fetch specific pages like
 * db.legalpages.findOne({ type: "privacy_policy" }) without guessing slugs.
 * - SEO sub-document included for proper search engine indexing.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const SeoSchema = new Schema(
  {
    metaTitle: { type: String, trim: true, default: "", maxlength: 120 },
    metaDescription: { type: String, trim: true, default: "", maxlength: 320 },
    // Custom canonical URL if needed, else falls back to /legal/:slug or /:slug
    canonicalUrl: { type: String, trim: true, default: "" },
    // Generally, legal pages should be indexable
    indexable: { type: Boolean, default: true },
  },
  { _id: false },
);

// ─── Schema ───────────────────────────────────────────────────────────────────

const LegalPageSchema = new Schema(
  {
    // ── 1. Identity ───────────────────────────────────────────────────────

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      maxlength: 150,
    },

    /**
     * Page category for programmatic fetching.
     * "custom" allows admins to create new random static pages.
     */
    type: {
      type: String,
      enum: [
        "about_us",
        "privacy_policy",
        "terms",
        "affiliate_disclosure",
        "custom",
      ],
      default: "custom",
      index: true,
    },

    // ── 2. Content ────────────────────────────────────────────────────────

    /**
     * Raw HTML content from the Rich Text Editor.
     * Must be sanitized on the frontend before rendering.
     */
    content: {
      type: String,
      required: true,
      maxlength: 100000, // ~100KB max text
    },

    // ── 3. Lifecycle & Legal Tracking ─────────────────────────────────────

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    /**
     * Crucial for legal compliance.
     * Updates automatically in the pre-save hook ONLY when `content` is modified.
     * Displayed on frontend as "Last Updated: [Date]".
     */
    lastRevisedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Protects vital pages from accidental deletion by junior admins.
     * If true, the DELETE API route should block the request.
     */
    isSystemPage: {
      type: Boolean,
      default: false,
    },

    // ── 4. SEO & Metadata ─────────────────────────────────────────────────

    seo: { type: SeoSchema, default: () => ({}) },

    // ── 5. Audit Trail ────────────────────────────────────────────────────

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

LegalPageSchema.pre("validate", function () {
  if (this.title) this.title = String(this.title).trim();
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();
});

LegalPageSchema.pre("save", function (next) {
  // Automatically update the revision date ONLY if the actual legal text changes
  if (this.isModified("content")) {
    this.lastRevisedAt = new Date();
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

// Standard lookup: "Get published privacy policy"
LegalPageSchema.index({ type: 1, status: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.LegalPage ||
  mongoose.model("LegalPage", LegalPageSchema);
