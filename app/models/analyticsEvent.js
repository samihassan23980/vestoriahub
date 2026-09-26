/**
 * @model AnalyticsEvent
 * @description Append-only event log for user interaction tracking.
 * Every meaningful user action (views, clicks, outbound redirects) is stored as
 * an immutable event. No PII is stored, only an anonymous session id (`sid`).
 *
 * Design principles
 *  - Write-heavy, read-light: documents are inserted, never updated.
 *  - Retention: 90-day rolling window via a TTL index on `createdAt`.
 *  - Fan-out: one event can reference coupon / product / deal / blog / store /
 *    category at once (cross-entity attribution).
 *  - Sparse documents: entity fields are OMITTED (not null) when they do not
 *    apply, so partial indexes only contain relevant events.
 *  - DB-level dedupe: `dedupeKey` (sha1 of sid + event + entity + time bucket)
 *    has a unique partial index. A repeated view/click inside its window is
 *    rejected with E11000 and ignored by the API, so counters never inflate.
 *
 * Changes vs previous version
 *  + eventType: `product_click` (AffiliateProduct), `embed_click` (blog embed block)
 *  + productId (ref AffiliateProduct), blockId (Blog.embeddedBlocks[]._id)
 *  + dedupeKey + unique partial index
 *  - Removed all single-field `index: true` (compound indexes cover them)
 *  - Removed duplicate createdAt index (only the TTL index remains)
 *  - Entity fields no longer default to null; entity indexes are partial
 *  - categoryId now has a compound index like the other entities
 *
 * IMPORTANT: run `AnalyticsEvent.syncIndexes()` once after deploying so old
 * indexes are dropped and the new ones (incl. the unique dedupe index) exist.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Shared constants (also imported by the API route) ───────────────────────

export const ANALYTICS_EVENT_TYPES = Object.freeze([
  "coupon_view", // coupon card shown in a listing
  "coupon_click", // "Show Code" / "Get Deal" on a coupon
  "outbound_redirect", // user sent to the affiliate link
  "amazon_deal_click", // "Get Deal" on an AmazonDeal card
  "product_click", // CTA click on an AffiliateProduct card
  "embed_click", // CTA click on a blog embedded block
  "blog_view", // blog article opened
  "store_visit", // store landing page opened
]);

export const DEVICE_TYPES = Object.freeze([
  "mobile",
  "tablet",
  "desktop",
  "unknown",
]);

const RETENTION_SECONDS = 60 * 60 * 24 * 90; // 90 days

// Entity reference fields. Omitted from the document when not applicable.
const ENTITY_FIELDS = [
  "couponId",
  "amazonDealId",
  "productId",
  "blogId",
  "storeId",
  "categoryId",
];

// ─── Schema ──────────────────────────────────────────────────────────────────

const AnalyticsEventSchema = new Schema(
  {
    eventType: {
      type: String,
      enum: ANALYTICS_EVENT_TYPES,
      required: true,
    },

    // ── Entity references (all optional, set whichever apply) ──────────────
    couponId: { type: Schema.Types.ObjectId, ref: "Coupon" },
    amazonDealId: { type: Schema.Types.ObjectId, ref: "AmazonDeal" },
    productId: { type: Schema.Types.ObjectId, ref: "AffiliateProduct" },
    blogId: { type: Schema.Types.ObjectId, ref: "Blog" },
    storeId: { type: Schema.Types.ObjectId, ref: "Store" },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },

    // _id of the Blog.embeddedBlocks[] entry that was clicked (embed_click).
    // No ref: it points into a sub-document array, not a collection.
    blockId: { type: Schema.Types.ObjectId },

    // ── Geo & session context ──────────────────────────────────────────────

    // ISO 3166-1 alpha-2, or "GLOBAL" when unknown.
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      maxlength: 10,
    },

    // Anonymous session id (UUID). Optional: absent = no dedupe possible.
    sid: { type: String, trim: true, maxlength: 128 },

    // External traffic source (document.referrer sent by the client).
    referrer: { type: String, trim: true, default: "", maxlength: 500 },

    // Parsed by the API layer at write time.
    deviceType: {
      type: String,
      enum: DEVICE_TYPES,
      default: "unknown",
    },

    // Raw user agent, debugging/forensics only.
    ua: { type: String, trim: true, default: "", maxlength: 300 },

    // sha1(sid|eventType|entity ids|time bucket). Only present for
    // dedupe-enabled events that carry a valid sid. Never returned by default.
    dedupeKey: { type: String, maxlength: 64, select: false },

    // Managed manually (no `timestamps`) so the TTL index can live on it.
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false },
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

// TTL: auto-delete events older than 90 days (TTL monitor runs ~every 60s).
AnalyticsEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: RETENTION_SECONDS, name: "createdAt_ttl" },
);

// Atomic dedupe: only documents that actually have a dedupeKey participate.
AnalyticsEventSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
    name: "dedupeKey_unique",
  },
);

// Time-series: "how many events of type X in the last 7 days?"
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });

// Per-entity performance. Partial: only events that reference that entity.
for (const field of ENTITY_FIELDS) {
  AnalyticsEventSchema.index(
    { [field]: 1, eventType: 1, createdAt: -1 },
    {
      partialFilterExpression: { [field]: { $exists: true } },
      name: `${field}_type_created`,
    },
  );
}

// Which embedded blocks perform best inside a blog post.
AnalyticsEventSchema.index(
  { blogId: 1, blockId: 1, createdAt: -1 },
  {
    partialFilterExpression: { blockId: { $exists: true } },
    name: "blog_block_created",
  },
);

// Geo and device breakdowns.
AnalyticsEventSchema.index({ countryCode: 1, eventType: 1, createdAt: -1 });
AnalyticsEventSchema.index({ deviceType: 1, eventType: 1, createdAt: -1 });

// ─── Export ──────────────────────────────────────────────────────────────────

export default mongoose.models.AnalyticsEvent ||
  mongoose.model("AnalyticsEvent", AnalyticsEventSchema);