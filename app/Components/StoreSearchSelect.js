
"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  ChevronDown,
  Loader2,
  Search,
  X,
} from "lucide-react";

const API_URL = "/api/admin/stores/store-options";

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

const storeCache = new Map();
const MAX_CACHE_ENTRIES = 100;

function cacheStore(store) {
  if (!store?._id) return;

  if (storeCache.has(store._id)) {
    storeCache.delete(store._id);
  }

  storeCache.set(store._id, store);

  if (storeCache.size > MAX_CACHE_ENTRIES) {
    const oldest = storeCache.keys().next().value;
    storeCache.delete(oldest);
  }
}

async function fetchStoreOptions(params, signal) {
  const query = new URLSearchParams(params);

  const response = await fetch(
    `${API_URL}?${query.toString()}`,
    {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    }
  );

  const data = await response.json();

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error || "Unable to load stores."
    );
  }

  return data;
}

export default function StoreSearchSelect({
  value = "",
  onChange,
  disabled = false,
  required = false,
  placeholder = "Select Store",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] =
    useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] =
    useState(null);

  const [error, setError] = useState("");

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(null);
  const selectedRequestRef = useRef(null);
  const requestSequence = useRef(0);

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  // Close when clicking outside.
  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown
      );
    };
  }, []);

  // Resolve selected Store by ID.
  // Important for bulk coupon drafts and edit pages.
  useEffect(() => {
    selectedRequestRef.current?.abort();

    if (!value) {
      setSelectedStore(null);
      return;
    }

    const cached = storeCache.get(String(value));

    if (cached) {
      setSelectedStore(cached);
      return;
    }

    const controller = new AbortController();
    selectedRequestRef.current = controller;

    async function loadSelectedStore() {
      try {
        const data = await fetchStoreOptions(
          { id: String(value) },
          controller.signal
        );

        if (controller.signal.aborted) return;

        if (data?.store) {
          cacheStore(data.store);
          setSelectedStore(data.store);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(
            "Selected store lookup failed:",
            err
          );
        }
      }
    }

    loadSelectedStore();

    return () => controller.abort();
  }, [value]);

  const loadStores = useCallback(
    async ({
      query = "",
      cursor = null,
      append = false,
    } = {}) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      const sequence = ++requestSequence.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setStores([]);
        setNextCursor(null);
        setHasMore(false);
      }

      setError("");

      try {
        const params = {
          limit: String(PAGE_SIZE),
        };

        if (query) params.q = query;
        if (cursor) params.cursor = cursor;

        const data = await fetchStoreOptions(
          params,
          controller.signal
        );

        if (
          controller.signal.aborted ||
          sequence !== requestSequence.current
        ) {
          return;
        }

        const incoming = Array.isArray(data.stores)
          ? data.stores
          : [];

        incoming.forEach(cacheStore);

        setStores((previous) => {
          if (!append) return incoming;

          const merged = new Map(
            previous.map((store) => [
              String(store._id),
              store,
            ])
          );

          incoming.forEach((store) => {
            merged.set(String(store._id), store);
          });

          return Array.from(merged.values());
        });

        setHasMore(Boolean(data.hasMore));
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        if (
          err.name === "AbortError" ||
          sequence !== requestSequence.current
        ) {
          return;
        }

        setError(
          err.message || "Failed to load stores."
        );
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  // Fetch only when dropdown is open.
  useEffect(() => {
    if (!open || disabled) return;

    loadStores({
      query: debouncedSearch,
      append: false,
    });

    return () => {
      requestRef.current?.abort();
    };
  }, [
    open,
    disabled,
    debouncedSearch,
    loadStores,
  ]);

  const handleSelect = (store) => {
    cacheStore(store);
    setSelectedStore(store);

    // Return complete lightweight Store object.
    // Parent handles category/country/link auto-sync.
    onChange?.(String(store._id), store);

    setSearch("");
    setDebouncedSearch("");
    setOpen(false);
  };

  const handleLoadMore = () => {
    if (
      !hasMore ||
      !nextCursor ||
      loading ||
      loadingMore
    ) {
      return;
    }

    loadStores({
      query: debouncedSearch,
      cursor: nextCursor,
      append: true,
    });
  };

  const handleOpen = () => {
    if (disabled) return;

    setOpen((previous) => !previous);
  };

  const handleClear = (event) => {
    event.stopPropagation();

    setSelectedStore(null);
    setSearch("");
    setDebouncedSearch("");
    onChange?.("", null);
  };

  return (
    <div
      ref={rootRef}
      className={`relative w-full min-w-0 ${className}`}
    >
      <input
        type="text"
        tabIndex={-1}
        required={required}
        value={value ? "selected" : ""}
        onChange={() => {}}
        className="absolute h-px w-px opacity-0 pointer-events-none"
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full min-h-[43px] px-3 py-2.5 bg-[var(--adm-surface-alt,#FDFBF7)] border-[1.5px] border-[var(--adm-border,#E2D9CC)] rounded-lg text-[14px] font-medium text-[var(--adm-text-body,#16241F)] outline-none focus:border-[var(--adm-forest,#1C352D)] disabled:opacity-60 flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">
          {selectedStore?.name ||
            (value
              ? "Loading selected store..."
              : placeholder)}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Clear selected store"
              onClick={handleClear}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" ||
                  event.key === " "
                ) {
                  event.preventDefault();
                  handleClear(event);
                }
              }}
              className="rounded p-0.5 hover:bg-black/5"
            >
              <X size={14} />
            </span>
          )}

          <ChevronDown
            size={16}
            className={
              open
                ? "rotate-180 transition-transform"
                : "transition-transform"
            }
          />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 overflow-hidden rounded-xl border border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface,#FFFFFF)] shadow-xl">
          <div className="p-2 border-b border-[var(--adm-border,#E2D9CC)]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--adm-text-muted,#6B7280)]"
              />

              <input
                ref={inputRef}
                autoFocus
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search store by name or slug..."
                className="w-full rounded-lg border border-[var(--adm-border,#E2D9CC)] bg-[var(--adm-surface-alt,#FDFBF7)] py-2.5 pl-9 pr-3 text-[13px] outline-none focus:border-[var(--adm-forest,#1C352D)]"
              />
            </div>
          </div>

          <div
            role="listbox"
            aria-label="Store options"
            className="max-h-[280px] overflow-y-auto overscroll-contain"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-5 text-[13px] text-[var(--adm-text-muted,#6B7280)]">
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Searching stores...
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-[12px] text-red-600">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadStores({
                      query: debouncedSearch,
                    })
                  }
                  className="mt-2 text-[12px] font-semibold underline"
                >
                  Try again
                </button>
              </div>
            ) : stores.length === 0 ? (
              <div className="p-5 text-center text-[13px] text-[var(--adm-text-muted,#6B7280)]">
                No matching stores found.
              </div>
            ) : (
              <>
                {stores.map((store) => {
                  const isSelected =
                    String(store._id) ===
                    String(value);

                  return (
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      key={store._id}
                      onClick={() =>
                        handleSelect(store)
                      }
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left border-b border-[var(--adm-border,#E2D9CC)]/50 last:border-0 hover:bg-[var(--adm-surface-alt,#FDFBF7)] ${
                        isSelected
                          ? "bg-[var(--adm-primary-soft,#F1E7FF)]"
                          : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-[var(--adm-text-title,#10201B)]">
                          {store.name}
                        </span>

                        <span className="block truncate text-[11px] text-[var(--adm-text-muted,#6B7280)]">
                          {store.slug}
                        </span>
                      </span>

                      {isSelected && (
                        <Check
                          size={16}
                          className="shrink-0 text-[var(--adm-primary,#A05AFF)]"
                        />
                      )}
                    </button>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 text-[12px] font-bold text-[var(--adm-forest,#1C352D)] hover:bg-[var(--adm-surface-alt,#FDFBF7)] disabled:opacity-60"
                  >
                    {loadingMore && (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    )}

                    {loadingMore
                      ? "Loading more..."
                      : "Load More Stores"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
