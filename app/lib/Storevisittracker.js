"use client";

import { useEffect } from "react";
import { trackEvent } from "./Tracking";



/**
 * Invisible component. Drop it into the store detail page (/stores/[slug]).
 * Records one `store_visit` event per session window (server dedupes repeats).
 *
 *   <StoreVisitTracker storeId={String(store._id)} />
 */
export default function StoreVisitTracker({ storeId, categoryId }) {
  useEffect(() => {
    if (!storeId) return;
    trackEvent("store_visit", {
      storeId,
      ...(categoryId ? { categoryId } : {}),
    });
  }, [storeId, categoryId]);

  return null;
}