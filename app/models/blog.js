/**
 * @model Blog
 * @description Editorial blog posts and shopping guides.
 * Powers the "Information Engine" pillar of Sociantech — buying guides,
 * trend analysis, and how-to articles that drive organic SEO traffic
 * and funnel readers to affiliate coupon/deal pages.
 *
 * Content storage: `content` stores raw HTML from the rich-text editor.
 * A stripped plain-text copy (`contentText`) is maintained automatically
 * for efficient full-text search indexing (indexing raw HTML tags is wasteful).
 *
 * Audit fixes applied:
 * - author.name typo "Eoupon Finder Team" → "Sociantech Team" (was on all posts)
 * - category changed from raw String to ObjectId ref (Category model)
 * - publishedAt auto-set in pre-save when status flips to "published"
 * - updatedBy field added (audit trail in multi-editor environments)
 * - contentText (plain-text) field added; text index moved to contentText
 * - viewCount added for popularity sorting / trending articles widget
 * - readTimeMinutes added (auto-calculated from word count in pre-save)
 * - tags per-item maxlength enforced (60 chars)
 * - relatedStores array limit validation added (max 10)
 * - faqs array limit validation added (max 15)
 * - seo.canonicalUrl URL format validator added
 * - slug auto-normalization (lowercase + trim) in pre-validate
 *
 * 🆕 NEW ADDITIONS:
 * - embeddedBlocks: Sub-schema added to handle dynamic product injections,
 * Amazon galleries, and custom CTA buttons directly inside the blog body
 * using placement tokens (e.g., {{embed:item-1}}).
 */

import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

/** Structured FAQ entry — renders as FAQPage JSON-LD rich snippet */
const FaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { _id: false },
);

/** * 🆕 NEW: Structured Embedded Block
 * Allows injecting diverse, high-converting product UI or custom buttons
 * into the middle of raw HTML content without hardcoding layout tags.
 */
const EmbeddedBlockSchema = new mongoose.Schema(
  {
    // The shortcode token placed in the rich-text editor (e.g., "{{embed:top-pick}}")
    placementToken: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Determines which frontend UI component to render
    blockType: {
      type: String,
      enum: [
        "product_card",
        "custom_button",
        "deal_highlight",
        "amazon_gallery",
      ],
      required: true,
    },
    // Optional: Link directly to an existing product in your database
    productRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Change to match your actual Product model name if different
      default: null,
    },
    // Custom overrides (useful if not using productRef or building custom CTAs)
    title: { type: String, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true },
    price: { type: String, trim: true, maxlength: 50 }, // e.g., "$8800", "$6500"
    discountBadge: { type: String, trim: true, maxlength: 50 }, // e.g., "50% OFF", "Editor's Choice"

    // Button Configuration
    button: {
      text: { type: String, trim: true, maxlength: 50, default: "View Deal" },
      url: { type: String, trim: true },
      // True = open in new tab with noopener/noreferrer (vital for affiliate links)
      isExternal: { type: Boolean, default: true },
    },
  },
  { _id: true }, // Enables targeted CRUD operations for specific blocks
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip HTML tags to extract plain text for search indexing */
function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Estimate reading time: avg reading speed = 200 words/min */
function calcReadTime(html = "") {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const BlogSchema = new mongoose.Schema(
  {
    // ── 1. Core Content ───────────────────────────────────────────────────

    // Article headline (also used as H1 on the page)
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },

    // URL slug: /blog/:slug — always lowercase
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      maxlength: 200,
    },

    // Short teaser shown on blog listing cards (1–2 sentences)
    excerpt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 400,
    },

    /**
     * Full article body as HTML from the rich-text editor (Quill, TipTap, etc.)
     * IMPORTANT: Always sanitize on display (DOMPurify on frontend or
     * sanitize-html on backend). Never trust raw stored HTML as safe.
     */
    content: {
      type: String,
      required: true,
      maxlength: 200000, // ~200KB max per article
    },

    /**
     * Auto-generated plain-text version of `content` (HTML stripped).
     * Used exclusively for MongoDB full-text search indexing.
     * Never shown to users. Updated automatically in pre-save hook.
     * Indexing raw HTML is wasteful — <p>, <div> etc. are noise words.
     */
    contentText: {
      type: String,
      default: "",
      select: false, // Never returned in queries by default (keep payloads lean)
    },

    // Estimated reading time in minutes (auto-calculated in pre-save)
    readTimeMinutes: {
      type: Number,
      default: 1,
      min: 1,
    },

    // ── 2. Media ──────────────────────────────────────────────────────────

    featuredImage: {
      // Full URL to the hero image (Cloudinary, S3, or external CDN)
      url: { type: String, default: "" },
      // Descriptive alt text for accessibility and Google Image SEO
      alt: { type: String, default: "", maxlength: 200 },
    },

    // ── 3. Taxonomy ───────────────────────────────────────────────────────

    /**
     * Primary category — ObjectId ref to Category model.
     * Used to build category-filtered blog pages (/blog/category/:slug).
     * Changed from raw String: string categories broke programmatic filtering.
     */
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    // Keyword tags for cross-category discovery (e.g. "Black Friday", "Laptops")
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 60,
      },
    ],

    // ── 4. Author (Google E-E-A-T Signal) ─────────────────────────────────

    author: {
      // Display name shown on article byline
      // Default corrected from "Eoupon Finder Team" (was a typo causing live SEO damage)
      name: { type: String, default: "Sociantech Team", maxlength: 120 },

      // URL to author avatar image
      avatar: { type: String, default: "" },

      // Author's role/title shown under name (e.g. "Senior Deal Analyst")
      role: { type: String, default: "Deal Expert", maxlength: 80 },
    },

    // ── 5. Analytics ──────────────────────────────────────────────────────

    /**
     * Total page view count. Incremented via AnalyticsEvent pipeline.
     * Use $inc in the update — never read-modify-write to avoid race conditions.
     * Used for "Most Popular" sorting and trending article widgets.
     */
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },

    // ── 6. Internal Linking & Injectables ─────────────────────────────────

    /**
     * Stores linked in this article — enables "Featured Stores" widgets
     * within article content and drives internal link equity to store pages.
     * Max 10 to keep document size reasonable.
     */
    relatedStores: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: "relatedStores cannot exceed 10 items.",
      },
    },

    /**
     * 🆕 NEW: Product and CTA Embeds
     * Stores the dynamic data for items you want to place inside the article content.
     */
    embeddedBlocks: {
      type: [EmbeddedBlockSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 30, // Prevents document bloat, adjust as needed
        message: "embeddedBlocks cannot exceed 30 items per article.",
      },
    },

    // ── 7. Rich Snippets ──────────────────────────────────────────────────

    /**
     * FAQ entries — rendered as FAQPage JSON-LD for Google rich results.
     * Max 15 FAQs per article (Google typically shows 3–5 in SERPs anyway).
     */
    faqs: {
      type: [FaqSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 15,
        message: "faqs cannot exceed 15 items.",
      },
    },

    // ── 8. SEO Metadata ───────────────────────────────────────────────────

    seo: {
      // <title> tag override (defaults to article title if empty)
      metaTitle: { type: String, default: "", maxlength: 120 },

      // <meta name="description"> content (ideally 150–160 chars)
      metaDescription: { type: String, default: "", maxlength: 320 },

      // Canonical URL — validates URL format (empty string = no canonical set)
      canonicalUrl: {
        type: String,
        default: "",
        validate: {
          validator: (v) => !v || isValidUrl(v),
          message: "seo.canonicalUrl must be a valid http/https URL.",
        },
      },

      // false = add <meta name="robots" content="noindex">
      indexable: { type: Boolean, default: true },

      // Open Graph overrides for social sharing
      ogTitle: { type: String, default: "", maxlength: 120 },
      ogDescription: { type: String, default: "", maxlength: 320 },
    },

    // ── 9. Publishing Controls ────────────────────────────────────────────

    /**
     * Article lifecycle status.
     * "draft"     = work in progress, not publicly visible.
     * "published" = live on the frontend.
     */
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },

    /**
     * The datetime this article was (or is scheduled to be) published.
     * Auto-set to now when status first changes to "published".
     * Can be pre-set to a future date for scheduled publishing
     * (frontend should check publishedAt <= now before rendering).
     */
    publishedAt: {
      type: Date,
      default: null,
      index: true,
    },

    // ── 10. Audit Trail ───────────────────────────────────────────────────

    // User who created this post (set at creation, never changed)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /**
     * User who last modified this post.
     * Updated by the API route handler on every save/update operation.
     * Critical in multi-editor teams to audit who changed affiliate links or content.
     */
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

// ─── Pre-save Hook ────────────────────────────────────────────────────────────

BlogSchema.pre("save", function () {
  // 1. Auto-set publishedAt when status first transitions to "published"
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // 2. Rebuild plain-text content for search indexing (strip HTML)
  if (this.isModified("content") && this.content) {
    this.contentText = stripHtml(this.content);
  }

  // 3. Recalculate estimated read time whenever content changes
  if (this.isModified("content") && this.content) {
    this.readTimeMinutes = calcReadTime(this.content);
  }

  // 4. Normalize slug
  if (this.slug) this.slug = String(this.slug).trim().toLowerCase();

  // 5. Deduplicate tags
  if (Array.isArray(this.tags)) {
    const cleaned = this.tags
      .map((t) =>
        String(t || "")
          .trim()
          .toLowerCase(),
      )
      .filter(Boolean);
    this.tags = [...new Set(cleaned)];
  }
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * Full-text search index on plain-text content + meta fields.
 * contentText instead of content — avoids indexing HTML markup noise.
 */
BlogSchema.index({
  title: "text",
  contentText: "text",
  excerpt: "text",
  tags: "text",
});

// Blog listing page: active posts ordered by publish date
BlogSchema.index({ status: 1, publishedAt: -1 });

// Category-filtered blog pages (/blog/category/:id)
BlogSchema.index({ category: 1, status: 1, publishedAt: -1 });

// "Most Popular" article widget
BlogSchema.index({ viewCount: -1, status: 1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
