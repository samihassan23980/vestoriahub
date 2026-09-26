/**
 * POST /api/tracking/event
 *
 * Ingestion endpoint for the AnalyticsEvent log.
 *
 * Pipeline
 *  1. Size + rate-limit guards, JSON parse
 *  2. Validate eventType and ObjectIds; enforce required entities per event
 *  3. Drop bots
 *  4. Resolve entities (exists + derive storeId/categoryId, short in-memory cache)
 *  5. Insert with a dedupeKey (unique index rejects repeats -> E11000 -> ignored)
 *  6. Increment the entity counter ONLY when the event was newly recorded
 *
 * Responses
 *  202 accepted (recorded, or intentionally skipped: duplicate / bot)
 *  400 invalid payload   413 body too large   429 rate limited   500 server error
 * The frontend must treat every non-2xx as "ignore silently".
 */

import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { connectDB } from "@/app/lib/mongodb";
import AnalyticsEvent, {
  ANALYTICS_EVENT_TYPES,
} from "@/app/models/analyticsEvent";
import Blog from "@/app/models/blog";
import Coupon from "@/app/models/coupon";
import Store from "@/app/models/store";
import AmazonDeal from "@/app/models/amazonDeal";
import AffiliateProduct from "@/app/models/affiliateProduct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─── Config ──────────────────────────────────────────────────────────────────

const EVENT_TYPES = new Set(ANALYTICS_EVENT_TYPES);
const MAX_BODY_CHARS = 4096;

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const SID_RE = /^[\w-]{8,128}$/;
const BOT_RE =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|monitor|uptime/i;

// Same sid + event + entity inside this window counts once.
const VIEW_WINDOW_MS = 30 * 60 * 1000; // views: once per 30 minutes
const CLICK_WINDOW_MS = 10 * 1000; // clicks: guards double-clicks only

// Best-effort per-instance limiter. On serverless each instance has its own
// memory, so also enable Vercel WAF / Upstash rate limiting for hard limits.
const RATE_LIMIT = { windowMs: 60 * 1000, max: 120 };

const ID_FIELDS = [
  "couponId",
  "amazonDealId",
  "productId",
  "blogId",
  "storeId",
  "categoryId",
];

// Ids that identify "what was interacted with" (used for the dedupe key).
const DEDUPE_ENTITY_FIELDS = [
  "couponId",
  "productId",
  "amazonDealId",
  "blogId",
  "storeId",
];

/**
 * Per-event rules.
 *  all     : every field must be present
 *  any     : at least one field must be present
 *  dedupe  : "view" | "click" | null
 *  counter : entity counter to $inc when the event is newly recorded
 *            (the field must exist in that model's schema, see notes)
 */
const EVENT_RULES = {
  coupon_view: { any: ["couponId"], dedupe: "view" },
  coupon_click: {
    any: ["couponId"],
    dedupe: "click",
    counter: { model: Coupon, idField: "couponId", field: "clickCount" },
  },
  outbound_redirect: {
    any: ["couponId", "productId", "amazonDealId", "storeId"],
    dedupe: "click",
  },
  amazon_deal_click: {
    any: ["amazonDealId"],
    dedupe: "click",
    counter: { model: AmazonDeal, idField: "amazonDealId", field: "clickCount" },
  },
  product_click: {
    any: ["productId"],
    dedupe: "click",
    counter: {
      model: AffiliateProduct,
      idField: "productId",
      field: "clickCount",
    },
  },
  embed_click: { all: ["blogId", "blockId"], dedupe: "click" },
  blog_view: {
    any: ["blogId"],
    dedupe: "view",
    counter: { model: Blog, idField: "blogId", field: "viewCount" },
  },
  store_visit: {
    any: ["storeId"],
    dedupe: "view",
    counter: { model: Store, idField: "storeId", field: "visitCount" },
  },
};

// How to verify an entity exists and which parent ids we can derive from it.
const pickStoreAndCategory = (d) => ({
  storeId: d.storeId ? String(d.storeId) : undefined,
  categoryId: d.categoryId ? String(d.categoryId) : undefined,
});

const ENTITY_LOOKUP = {
  couponId: {
    model: Coupon,
    select: "storeId categoryId",
    pick: pickStoreAndCategory,
  },
  productId: {
    model: AffiliateProduct,
    select: "storeId categoryId",
    pick: pickStoreAndCategory,
  },
  amazonDealId: {
    model: AmazonDeal,
    select: "storeId categoryId",
    pick: pickStoreAndCategory,
  },
  blogId: { model: Blog, select: "_id", pick: () => ({}) },
  storeId: { model: Store, select: "_id", pick: () => ({}) },
};
const LOOKUP_ORDER = ["couponId", "productId", "amazonDealId", "blogId", "storeId"];

// ─── Small helpers ───────────────────────────────────────────────────────────

const respond = (body, status = 202) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function getDeviceType(userAgent) {
  if (!userAgent) return "unknown";
  if (/tablet|ipad|playbook|silk|android(?!.*mobi)/i.test(userAgent)) {
    return "tablet";
  }
  if (
    /mobile|iphone|ipod|android|blackberry|iemobile|kindle|webos|opera mini/i.test(
      userAgent,
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

function getCountryCode(req) {
  const raw = (
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    ""
  ).toUpperCase();
  // Cloudflare uses XX (unknown) and T1 (Tor): treat as unknown.
  return /^[A-Z]{2}$/.test(raw) && raw !== "XX" ? raw : "GLOBAL";
}

// ─── Rate limiter (in-memory, best effort; IP is never stored) ───────────────

const rateBuckets = new Map();

function isRateLimited(req) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const bucket = rateBuckets.get(ip);

  if (!bucket || now > bucket.reset) {
    if (rateBuckets.size > 10000) {
      for (const [key, b] of rateBuckets) if (now > b.reset) rateBuckets.delete(key);
    }
    rateBuckets.set(ip, { count: 1, reset: now + RATE_LIMIT.windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT.max;
}

// ─── Entity resolution (exists + derive parents) with a tiny TTL cache ───────

const entityCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 5000;

async function resolveEntity(field, id) {
  const key = `${field}:${id}`;
  const hit = entityCache.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;

  const cfg = ENTITY_LOOKUP[field];
  const doc = await cfg.model.findById(id).select(cfg.select).lean();
  if (!doc) return null; // never cache misses

  const value = cfg.pick(doc);
  if (entityCache.size >= CACHE_MAX) {
    entityCache.delete(entityCache.keys().next().value); // evict oldest
  }
  entityCache.set(key, { value, exp: Date.now() + CACHE_TTL_MS });
  return value;
}

// ─── Dedupe key ──────────────────────────────────────────────────────────────

function buildDedupeKey({ sid, eventType, ids, blockId, mode }) {
  if (!sid || !mode) return undefined;
  const windowMs = mode === "view" ? VIEW_WINDOW_MS : CLICK_WINDOW_MS;
  const bucket = Math.floor(Date.now() / windowMs);
  const entity = DEDUPE_ENTITY_FIELDS.map((f) => ids[f] || "-").join(".");
  return createHash("sha1")
    .update(`${sid}|${eventType}|${entity}|${blockId || "-"}|${bucket}`)
    .digest("hex");
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    // 1. Guards + parse ----------------------------------------------------
    if (isRateLimited(req)) {
      return respond({ error: "Too many requests." }, 429);
    }

    const raw = await req.text();
    if (raw.length > MAX_BODY_CHARS) {
      return respond({ error: "Payload too large." }, 413);
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return respond({ error: "Invalid JSON." }, 400);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid payload." }, 400);
    }

    // 2. Validate ----------------------------------------------------------
    const { eventType } = body;
    if (!EVENT_TYPES.has(eventType)) {
      return respond({ error: "Invalid eventType." }, 400);
    }
    const rule = EVENT_RULES[eventType];

    // Malformed ids are a client bug: reject loudly instead of dropping them.
    const ids = {};
    for (const field of [...ID_FIELDS, "blockId"]) {
      const v = body[field];
      if (v === undefined || v === null || v === "") continue;
      if (typeof v !== "string" || !OBJECT_ID_RE.test(v)) {
        return respond({ error: `Invalid ${field}.` }, 400);
      }
      ids[field] = v;
    }
    const { blockId } = ids;
    delete ids.blockId;

    const missingAll = (rule.all || []).filter((f) => !(ids[f] || (f === "blockId" && blockId)));
    if (missingAll.length) {
      return respond({ error: `Missing: ${missingAll.join(", ")}.` }, 400);
    }
    if (rule.any && !rule.any.some((f) => ids[f])) {
      return respond(
        { error: `${eventType} requires one of: ${rule.any.join(", ")}.` },
        400,
      );
    }

    // 3. Bots --------------------------------------------------------------
    const rawUa = req.headers.get("user-agent") || "";
    if (BOT_RE.test(rawUa)) {
      return respond({ success: true, recorded: false, reason: "bot" });
    }

    // 4. Resolve entities (needs DB) --------------------------------------
    await connectDB();

    const present = LOOKUP_ORDER.filter((f) => ids[f]);
    const resolved = await Promise.all(present.map((f) => resolveEntity(f, ids[f])));
    const missingIdx = resolved.findIndex((r) => r === null);
    if (missingIdx !== -1) {
      return respond({ error: `Unknown ${present[missingIdx]}.` }, 400);
    }

    if (eventType === "embed_click") {
      const blockExists = await Blog.exists({
        _id: ids.blogId,
        "embeddedBlocks._id": blockId,
      });
      if (!blockExists) return respond({ error: "Unknown blockId." }, 400);
    }

    // Trusted, server-derived parents. storeId: derived wins.
    // categoryId: a client-sent category page context wins, else derived.
    const derivedStore = resolved.map((r) => r.storeId).find(Boolean);
    const derivedCategory = resolved.map((r) => r.categoryId).find(Boolean);
    const dedupeIds = { ...ids }; // stable key: built from client ids only
    if (derivedStore) ids.storeId = derivedStore;
    if (!ids.categoryId && derivedCategory) ids.categoryId = derivedCategory;

    // 5. Build + insert ----------------------------------------------------
    const sidRaw = clean(body.sid, 128);
    const sid = SID_RE.test(sidRaw) ? sidRaw : undefined;

    const doc = {
      eventType,
      countryCode: getCountryCode(req),
      deviceType: getDeviceType(rawUa),
      ua: rawUa.slice(0, 300),
      // The Referer header would be our own page: only trust the client value.
      referrer: clean(body.referrer, 500),
      createdAt: new Date(),
    };
    if (sid) doc.sid = sid;
    if (blockId) doc.blockId = blockId;
    for (const f of ID_FIELDS) if (ids[f]) doc[f] = ids[f];

    const dedupeKey = buildDedupeKey({
      sid,
      eventType,
      ids: dedupeIds,
      blockId,
      mode: rule.dedupe,
    });
    if (dedupeKey) doc.dedupeKey = dedupeKey;

    try {
      await AnalyticsEvent.create(doc);
    } catch (err) {
      if (err?.code === 11000) {
        return respond({ success: true, recorded: false, reason: "duplicate" });
      }
      throw err;
    }

    // 6. Counter (never let a counter failure lose the recorded event) ------
    if (rule.counter) {
      const { model, idField, field } = rule.counter;
      try {
        await model.updateOne(
          { _id: ids[idField] },
          { $inc: { [field]: 1 } },
          // Do not bump updatedAt on every view/click (breaks "recently updated").
          { timestamps: false },
        );
      } catch (err) {
        console.error(`[tracking] counter ${model.modelName}.${field} failed:`, err);
      }
    }

    return respond({ success: true, recorded: true });
  } catch (error) {
    console.error("POST /api/tracking/event error:", error);
    return respond({ error: "Server error." }, 500);
  }
}