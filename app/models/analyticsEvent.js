/**
 * @model AnalyticsEvent
 * @description Append-only event log for user interaction tracking.
 * Every meaningful user action (views, clicks, outbound redirects) is recorded
 * here as an immutable event. No PII is stored — only anonymous session IDs.
 *
 * Design principles:
 *  - Write-heavy, read-light: documents are inserted but rarely updated.
 *  - Retention: 90-day rolling window via TTL index. Old events auto-expire.
 *  - Fan-out: a single event can reference coupon, store, category, amazonDeal,
 *    AND blog simultaneously (for cross-entity attribution analysis).
 *
 * Audit fixes applied:
 *  - eventType enum extended: amazon_deal_click, blog_view, store_visit added
 *  - amazonDealId ref added (was completely missing — Amazon deals untrackable)
 *  - blogId ref added (blog content performance now measurable)
 *  - TTL index added (90-day retention; prevents unbounded collection growth)
 *  - ua maxlength: 300 added (full UA strings can be 500+ chars)
 *  - referrer field added (enables traffic source / SEO attribution analysis)
 *  - deviceType field added (mobile vs desktop conversion analysis)
 *  - Compound indexes updated to cover new event types and entities
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// ─── Schema ──────────────────────────────────────────────────────────────────

const AnalyticsEventSchema = new Schema(
  {
    /**
     * The type of interaction recorded.
     *
     * coupon_view        — user sees a coupon card in listing
     * coupon_click       — user clicks "Show Code" / "Get Deal" on a coupon
     * outbound_redirect  — user is redirected to store's affiliate link
     * amazon_deal_click  — user clicks "Get Deal" on an Amazon deal card
     * blog_view          — user lands on / scrolls a blog article
     * store_visit        — user views a store's dedicated page
     */
    eventType: {
      type: String,
      enum: [
        "coupon_view",
        "coupon_click",
        "outbound_redirect",
        "amazon_deal_click",
        "blog_view",
        "store_visit",
      ],
      required: true,
      index: true,
    },

    // ── Entity References (all optional; set whichever apply to the event) ─

    // The coupon involved (set for coupon_* and outbound_redirect events)
    couponId: {
      type: Schema.Types.ObjectId,
      ref: "Coupon",
      index: true,
      default: null,
    },

    // The Amazon deal involved (set for amazon_deal_click events)
    amazonDealId: {
      type: Schema.Types.ObjectId,
      ref: "AmazonDeal",
      index: true,
      default: null,
    },

    // The blog post involved (set for blog_view events)
    blogId: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      index: true,
      default: null,
    },

    // The store involved (set for store_visit and outbound_redirect events)
    storeId: {
      type: Schema.Types.ObjectId,
      ref: "Store",
      index: true,
      default: null,
    },

    // The category page the event occurred on (if applicable)
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      index: true,
      default: null,
    },

    // ── Geo & Session Context ─────────────────────────────────────────────

    /**
     * ISO 3166-1 alpha-2 country code of the user (from IP lookup or header).
     * "GLOBAL" = country could not be determined.
     * Used for geo-performance reporting (which countries drive the most clicks).
     */
    countryCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "GLOBAL",
      index: true,
    },

    /**
     * Anonymous session identifier (hashed or UUID — no personal data).
     * Used to deduplicate events within a session (e.g. avoid counting
     * the same coupon_view 20 times if user scrolls back and forth).
     */
    sid: {
      type: String,
      trim: true,
      index: true,
      maxlength: 128,
    },

    /**
     * Traffic referrer URL (where the user came from).
     * Essential for SEO attribution: did this click come from Google, social,
     * or direct? Truncated to 500 chars — full referrer URLs can be very long.
     */
    referrer: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    /**
     * Device category derived from user-agent: mobile, tablet, desktop.
     * Computed by the API layer (e.g. using the "ua-parser-js" package)
     * before inserting — do not store raw UA then parse later at query time.
     */
    deviceType: {
      type: String,
      enum: ["mobile", "tablet", "desktop", "unknown"],
      default: "unknown",
      index: true,
    },

    /**
     * Raw user-agent string (truncated to 300 chars).
     * Stored for debugging/forensics only. Use deviceType for analytics.
     * Full UA strings can exceed 500 chars — the 300 char limit is intentional.
     */
    ua: {
      type: String,
      trim: true,
      default: "",
      maxlength: 300,
    },

    /**
     * Event timestamp — manually defined (not auto via timestamps: true)
     * so we can place a TTL index directly on this field.
     * TTL: 7,776,000 seconds = 90 days. Events older than 90 days are
     * automatically deleted by MongoDB. Adjust for your retention policy.
     */
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    // timestamps: false — we manage createdAt manually for TTL index control.
    // updatedAt is irrelevant for an append-only event log.
    timestamps: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

/**
 * TTL Index — auto-delete events older than 90 days.
 * Keeps the collection bounded. Adjust expireAfterSeconds for your policy.
 * Note: TTL is approximate; MongoDB's TTL monitor runs every 60 seconds.
 */
AnalyticsEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 }, // 90 days
);

// Time-series queries: "how many coupon clicks in last 7 days?"
AnalyticsEventSchema.index({ eventType: 1, createdAt: -1 });

// Per-coupon performance: clicks + views over time
AnalyticsEventSchema.index({ couponId: 1, eventType: 1, createdAt: -1 });

// Per-store performance dashboard
AnalyticsEventSchema.index({ storeId: 1, eventType: 1, createdAt: -1 });

// Per-Amazon-deal performance
AnalyticsEventSchema.index({ amazonDealId: 1, eventType: 1, createdAt: -1 });

// Per-blog performance (which articles drive the most deal clicks)
AnalyticsEventSchema.index({ blogId: 1, eventType: 1, createdAt: -1 });

// Geo performance: clicks by country
AnalyticsEventSchema.index({ countryCode: 1, eventType: 1, createdAt: -1 });

// Device breakdown reporting
AnalyticsEventSchema.index({ deviceType: 1, eventType: 1, createdAt: -1 });

// ─── Export ───────────────────────────────────────────────────────────────────

export default mongoose.models.AnalyticsEvent ||
  mongoose.model("AnalyticsEvent", AnalyticsEventSchema);
