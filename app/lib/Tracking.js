/**
 * Client-side tracking helper. Import only from client components.
 *
 *   trackEvent("coupon_click",  { couponId })
 *   trackEvent("coupon_view",   { couponId })
 *   trackEvent("product_click", { productId })
 *   trackEvent("amazon_deal_click", { amazonDealId })
 *   trackEvent("blog_view",     { blogId })
 *   trackEvent("embed_click",   { blogId, blockId })   // blockId = embeddedBlocks[]._id
 *   trackEvent("store_visit",   { storeId })
 *   trackEvent("outbound_redirect", { couponId })
 *
 * Optional extras: categoryId (category page the user is on).
 * Never throws, never blocks navigation (uses sendBeacon / keepalive fetch).
 */

const ENDPOINT = "/api/tracking/event";
const SID_KEY = "_sid";

let memorySid = null;

function getSid() {
  try {
    let sid = sessionStorage.getItem(SID_KEY);
    if (!sid) {
      sid = crypto.randomUUID();
      sessionStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    // Storage blocked (private mode etc.): keep a per-page-load id in memory.
    if (!memorySid) {
      memorySid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `m-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    }
    return memorySid;
  }
}

export function trackEvent(eventType, ids = {}) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    eventType,
    sid: getSid(),
    referrer: document.referrer || "",
    ...ids,
  });

  try {
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(
        ENDPOINT,
        new Blob([payload], { type: "application/json" }),
      );
      if (queued) return;
    }
  } catch {
    /* fall through to fetch */
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}