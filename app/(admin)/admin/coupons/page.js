
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Tag,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Pin,
  CheckCircle,
  Globe,
  CalendarX,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Save,
  Loader2,
  ChevronDown,
  X,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* ============================================================
   CONFIG
============================================================ */

const COUPONS_API = "/api/admin/coupons";
const STORE_OPTIONS_API = "/api/admin/stores/store-options";
const REORDER_API = "/api/admin/coupons/reorder";

const PAGE_SIZE = 10;
const STORE_PAGE_SIZE = 20;
const SORT_BATCH_SIZE = 100;
const MAX_BATCH_PAGES = 1000;
const SEARCH_DELAY = 300;

const FILTER_CLASS =
  "bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[13px] font-semibold py-2 px-3 rounded-lg focus:outline-none focus:border-[#2D2380]";

function getId(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id || value.id || "");
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data?.success === false) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

/* ============================================================
   STORE FILTER
============================================================ */

function StoreFilter({
  value,
  selectedStore,
  onChange,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stores, setStores] = useState([]);
  const [resolvedStore, setResolvedStore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState("");

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(null);
  const selectedRequestRef = useRef(null);
  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map());

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DELAY
    );

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleOutside(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handleOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!selectedStore?._id) return;

    cacheRef.current.set(
      String(selectedStore._id),
      selectedStore
    );

    setResolvedStore(selectedStore);
  }, [selectedStore]);

  useEffect(() => {
    selectedRequestRef.current?.abort();

    if (value === "all") {
      setResolvedStore(null);
      return;
    }

    if (selectedStore && getId(selectedStore) === value) {
      setResolvedStore(selectedStore);
      return;
    }

    const cached = cacheRef.current.get(value);

    if (cached) {
      setResolvedStore(cached);
      return;
    }

    const controller = new AbortController();
    selectedRequestRef.current = controller;

    async function resolveStore() {
      try {
        const response = await fetch(
          `${STORE_OPTIONS_API}?id=${encodeURIComponent(value)}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await readResponse(response);
        if (controller.signal.aborted) return;

        const store = data.store || data.data?.store;

        if (store) {
          cacheRef.current.set(String(store._id), store);
          setResolvedStore(store);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Store resolution error:", err);
        }
      }
    }

    resolveStore();

    return () => controller.abort();
  }, [value, selectedStore]);

  const loadStores = useCallback(
    async ({ query = "", cursor = null, append = false } = {}) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;
      const requestId = ++requestIdRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setStores([]);
        setHasMore(false);
        setNextCursor(null);
      }

      setError("");

      try {
        const params = new URLSearchParams({
          limit: String(STORE_PAGE_SIZE),
        });

        if (query) params.set("q", query);
        if (cursor) params.set("cursor", cursor);

        const response = await fetch(
          `${STORE_OPTIONS_API}?${params}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await readResponse(response);

        if (
          controller.signal.aborted ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const incoming = Array.isArray(data.stores)
          ? data.stores
          : Array.isArray(data.data?.stores)
            ? data.data.stores
            : [];

        incoming.forEach((store) => {
          cacheRef.current.set(String(store._id), store);
        });

        setStores((previous) => {
          if (!append) return incoming;

          const map = new Map(
            previous.map((store) => [String(store._id), store])
          );

          incoming.forEach((store) => {
            map.set(String(store._id), store);
          });

          return [...map.values()];
        });

        setHasMore(
          Boolean(data.pagination?.hasMore ?? data.hasMore)
        );

        setNextCursor(
          data.pagination?.nextCursor ??
            data.nextCursor ??
            null
        );
      } catch (err) {
        if (
          err.name === "AbortError" ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        setError(err.message || "Unable to load stores.");
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!open || disabled) return;

    loadStores({ query: debouncedSearch });

    return () => requestRef.current?.abort();
  }, [open, disabled, debouncedSearch, loadStores]);

  const currentStore =
    value === "all"
      ? null
      : selectedStore && getId(selectedStore) === value
        ? selectedStore
        : resolvedStore && getId(resolvedStore) === value
          ? resolvedStore
          : cacheRef.current.get(value) || null;

  function chooseStore(store) {
    cacheRef.current.set(String(store._id), store);
    onChange(String(store._id), store);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  }

  function chooseAll() {
    onChange("all", null);
    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  }

  return (
    <div
      ref={rootRef}
      className="relative w-full md:w-[235px] shrink-0"
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((previous) => !previous)}
        className={`${FILTER_CLASS} flex min-h-[38px] w-full items-center justify-between gap-2 text-left disabled:opacity-50`}
      >
        <span className="truncate">
          {value === "all"
            ? "All Stores (Sorting Disabled)"
            : currentStore?.name || "Selected Store"}
        </span>

        <ChevronDown
          size={15}
          className={`shrink-0 text-[#7775A0] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[60] mt-2 w-full min-w-[270px] overflow-hidden rounded-xl border border-[#E0DEF5] bg-white shadow-[0_14px_40px_rgba(26,19,64,0.16)]">
          <div className="border-b border-[#E0DEF5] p-3">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
              />

              <input
                ref={inputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search store slug..."
                className="w-full rounded-lg border border-[#E0DEF5] bg-[#F7F6FF] py-2.5 pl-9 pr-3 text-[13px] text-[#1A1340] outline-none focus:border-[#2D2380]"
              />
            </div>

            <p className="mt-1.5 text-[11px] text-[#7775A0]">
              Search matches store slug prefixes.
            </p>
          </div>

          <div
            role="listbox"
            aria-label="Filter coupons by store"
            className="max-h-[285px] overflow-y-auto"
          >
            <button
              type="button"
              role="option"
              aria-selected={value === "all"}
              onClick={chooseAll}
              className={`flex w-full items-center justify-between gap-2 border-b border-[#F0EFF9] px-4 py-3 text-left text-[13px] font-semibold hover:bg-[#F7F6FF] ${
                value === "all"
                  ? "bg-[#EEEDFE] text-[#2D2380]"
                  : "text-[#1A1340]"
              }`}
            >
              All Stores (Sorting Disabled)
              {value === "all" && <Check size={15} />}
            </button>

            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-[13px] text-[#7775A0]">
                <Loader2 size={16} className="animate-spin" />
                Loading stores...
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-[12px] text-[#E24B4A]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => loadStores({ query: debouncedSearch })}
                  className="mt-2 text-[12px] font-bold text-[#2D2380] underline"
                >
                  Retry
                </button>
              </div>
            ) : stores.length === 0 ? (
              <p className="p-5 text-center text-[13px] text-[#7775A0]">
                No stores found.
              </p>
            ) : (
              <>
                {stores.map((store) => {
                  const active = String(store._id) === value;

                  return (
                    <button
                      key={String(store._id)}
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => chooseStore(store)}
                      className={`flex w-full items-center justify-between gap-3 border-b border-[#F0EFF9] px-4 py-3 text-left hover:bg-[#F7F6FF] ${
                        active ? "bg-[#EEEDFE]" : ""
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-[#1A1340]">
                          {store.name}
                        </span>

                        <span className="block truncate text-[11px] text-[#7775A0]">
                          {store.slug}
                        </span>
                      </span>

                      {active && (
                        <Check
                          size={16}
                          className="shrink-0 text-[#2D2380]"
                        />
                      )}
                    </button>
                  );
                })}

                {hasMore && (
                  <button
                    type="button"
                    disabled={loadingMore || !nextCursor}
                    onClick={() =>
                      loadStores({
                        query: debouncedSearch,
                        cursor: nextCursor,
                        append: true,
                      })
                    }
                    className="flex w-full items-center justify-center gap-2 px-4 py-3 text-[12px] font-bold text-[#2D2380] hover:bg-[#F7F6FF] disabled:opacity-50"
                  >
                    {loadingMore && (
                      <Loader2
                        size={15}
                        className="animate-spin"
                      />
                    )}

                    {loadingMore
                      ? "Loading More..."
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

/* ============================================================
   COUPON BADGES
============================================================ */

function StatusBadge({ status }) {
  switch (status) {
    case "active":
      return (
        <span className="rounded-md border border-[#22B07D]/20 bg-[#E1F5EE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#22B07D]">
          Active
        </span>
      );

    case "expired":
      return (
        <span className="rounded-md border border-[#E24B4A]/20 bg-[#FCEBEB] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E24B4A]">
          Expired
        </span>
      );

    case "inactive":
      return (
        <span className="rounded-md border border-[#E0DEF5] bg-[#F7F6FF] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#7775A0]">
          Inactive
        </span>
      );

    default:
      return (
        <span className="text-[11px] text-[#7775A0]">
          {status || "Unknown"}
        </span>
      );
  }
}

function formatDiscount(type, value) {
  if (type === "percent") return `${value}% OFF`;
  if (type === "flat") return `$${value} OFF`;
  if (type === "free_shipping") return "FREE SHIPPING";
  return value || "-";
}

function TypeBadge({ type, codeType, code }) {
  if (type === "deal") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E0DEF5] bg-[#EEEDFE] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2D2380]">
        <Tag size={12} />
        Codeless Deal
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="rounded border border-[#F4A836]/30 bg-[#1A1340] px-2 py-0.5 font-mono text-[13px] font-bold text-[#F4A836] shadow-sm">
        {code || "AUTO"}
      </span>

      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7775A0]">
        {codeType === "public"
          ? "Public Code"
          : "Auto-Applied"}
      </span>
    </div>
  );
}

/* ============================================================
   SORTABLE ROW
   FIX:
   - Stable string IDs
   - Valid HTML table structure
   - Always-visible grip
   - Explicit width and touchAction
   - Dedicated drag activator
============================================================ */

function SortableRow({
  coupon,
  selected,
  onToggle,
  onDelete,
  deletingId,
  canDrag,
}) {
  const id = String(coupon._id);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 20 : "auto",
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`group transition-colors hover:bg-[#EEEDFE]/30 ${
        selected ? "bg-[#EEEDFE]/50" : ""
      } ${isDragging ? "bg-[#EEEDFE]" : ""}`}
    >
      {/* DRAG + CHECKBOX */}

      <td className="w-[110px] min-w-[110px] px-4 py-4 align-middle">
        <div className="flex items-center gap-3">
          <button
            ref={setActivatorNodeRef}
            type="button"
            {...attributes}
            {...listeners}
            disabled={!canDrag}
            style={{
              touchAction: "none",
              cursor: canDrag
                ? isDragging
                  ? "grabbing"
                  : "grab"
                : "not-allowed",
            }}
            className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-all duration-150 select-none ${
              canDrag
                ? "border-[#D8D3F5] bg-[#EEEDFE] text-[#2D2380] hover:border-[#2D2380] hover:bg-[#DDD9FA]"
                : "border-[#E0DEF5] bg-[#F7F6FF] text-[#A6A3BD] opacity-50"
            }`}
            title={
              canDrag
                ? "Drag to change coupon position"
                : "Select a store and clear filters to enable sorting"
            }
            aria-label={`Reorder ${coupon.title}`}
          >
            <GripVertical
              size={20}
              strokeWidth={2.5}
              className="shrink-0"
            />
          </button>

          <input
            type="checkbox"
            aria-label={`Select ${coupon.title}`}
            className="h-4 w-4 shrink-0 accent-[#2D2380]"
            checked={selected}
            onChange={() => onToggle(id)}
          />
        </div>
      </td>

      {/* OFFER DETAILS */}

      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex w-4 shrink-0 flex-col gap-1">
            {coupon.isPinned && (
              <Pin
                size={16}
                fill="currentColor"
                className="text-[#F4A836]"
              />
            )}
          </div>

          <div className="min-w-0">
            <p className="line-clamp-2 pr-4 text-[14px] font-bold leading-snug text-[#1A1340]">
              {coupon.title}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded bg-[#EEEDFE] px-2 py-0.5 text-[12px] font-bold text-[#2D2380]">
                {coupon.storeId?.name || "Unknown Store"}
              </span>

              {coupon.isVerified && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#22B07D]">
                  <CheckCircle size={12} />
                  Verified
                </span>
              )}

              {coupon.isExclusive && (
                <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#F4A836]">
                  <Sparkles size={12} />
                  Exclusive
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* TYPE */}

      <td className="px-6 py-4 align-top">
        <TypeBadge
          type={coupon.type}
          codeType={coupon.codeType}
          code={coupon.code}
        />
      </td>

      {/* DISCOUNT */}

      <td className="px-6 py-4 align-top">
        <span className="text-[15px] font-bold text-[#1A1340]">
          {formatDiscount(
            coupon.discountType,
            coupon.discountValue
          )}
        </span>

        <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] font-medium text-[#7775A0]">
          {coupon.minOrderValue > 0 && (
            <span>Min Spend: ${coupon.minOrderValue}</span>
          )}

          {coupon.maxDiscountCap && (
            <span>Cap: ${coupon.maxDiscountCap}</span>
          )}

          {!coupon.minOrderValue &&
            !coupon.maxDiscountCap && (
              <span>No restrictions</span>
            )}
        </div>
      </td>

      {/* TARGETING */}

      <td className="px-6 py-4 align-top">
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#1A1340]">
            <Globe size={14} className="text-[#7775A0]" />

            {coupon.countryCode === "GLOBAL"
              ? "Global"
              : coupon.countryCode || "Global"}
          </span>

          <span
            className={`flex items-center gap-1.5 text-[11px] font-semibold ${
              coupon.status === "expired"
                ? "text-[#E24B4A]"
                : "text-[#7775A0]"
            }`}
          >
            <CalendarX size={14} />

            {coupon.expiryDate
              ? new Date(coupon.expiryDate).toLocaleDateString()
              : "Evergreen"}
          </span>
        </div>
      </td>

      {/* STATUS */}

      <td className="px-6 py-4 align-top">
        <StatusBadge status={coupon.status} />
      </td>

      {/* ACTIONS */}

      <td className="px-6 py-4 text-right align-top">
        <div className="flex items-center justify-end gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
          <Link
            href={`/admin/coupons/${id}`}
            title="Edit Offer"
            aria-label={`Edit ${coupon.title}`}
            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#EEEDFE] hover:text-[#2D2380]"
          >
            <Edit size={16} />
          </Link>

          <button
            type="button"
            onClick={() => onDelete(id)}
            disabled={deletingId === id}
            title="Delete"
            aria-label={`Delete ${coupon.title}`}
            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#FCEBEB] hover:text-[#E24B4A] disabled:opacity-50"
          >
            {deletingId === id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>

          <button
            type="button"
            title="More Options"
            aria-label={`More options for ${coupon.title}`}
            className="rounded-lg p-2 text-[#7775A0] transition-colors hover:bg-[#EEEDFE] hover:text-[#2D2380]"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ============================================================
   DRAG OVERLAY
============================================================ */

function DragCouponOverlay({ coupon }) {
  if (!coupon) return null;

  return (
    <div className="flex max-w-[540px] cursor-grabbing items-center gap-3 rounded-xl border-2 border-[#2D2380] bg-white px-5 py-4 shadow-[0_18px_50px_rgba(26,19,64,0.22)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEEDFE] text-[#2D2380]">
        <GripVertical size={20} strokeWidth={2.5} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold text-[#1A1340]">
          {coupon.title}
        </p>

        <p className="mt-1 text-[12px] text-[#7775A0]">
          {coupon.storeId?.name || "Selected Store"}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedCoupons, setSelectedCoupons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [orderChanged, setOrderChanged] = useState(false);
  const [error, setError] = useState("");
  const [activeDragId, setActiveDragId] = useState(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [storeId, setStoreId] = useState("all");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);

  const [completeStoreLoaded, setCompleteStoreLoaded] =
    useState(false);

  const fetchControllerRef = useRef(null);
  const fetchRequestIdRef = useRef(0);
  const orderChangedRef = useRef(false);
  const selectedStoreRef = useRef(selectedStore);

  orderChangedRef.current = orderChanged;
  selectedStoreRef.current = selectedStore;

  /* ========================================================
     SENSORS
  ======================================================== */

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /* ========================================================
     SEARCH DEBOUNCE
  ======================================================== */

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DELAY
    );

    return () => clearTimeout(timer);
  }, [search]);

  /* ========================================================
     SORTING MODE
  ======================================================== */

  const sortingMode =
    storeId !== "all" &&
    search.trim() === "" &&
    debouncedSearch === "" &&
    status === "all";

  const canDrag =
    sortingMode &&
    completeStoreLoaded &&
    !loading &&
    !savingOrder &&
    !error &&
    coupons.length > 0 &&
    coupons.length === total;

  const sortableIds = useMemo(
    () => coupons.map((coupon) => String(coupon._id)),
    [coupons]
  );

  const activeCoupon = useMemo(() => {
    if (!activeDragId) return null;

    return (
      coupons.find(
        (coupon) => String(coupon._id) === activeDragId
      ) || null
    );
  }, [activeDragId, coupons]);

  /* ========================================================
     QUERY
  ======================================================== */

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    params.set("page", String(sortingMode ? 1 : page));
    params.set(
      "limit",
      String(sortingMode ? SORT_BATCH_SIZE : PAGE_SIZE)
    );

    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    }

    if (storeId !== "all") {
      params.set("storeId", storeId);
    }

    if (status !== "all") {
      params.set("status", status);
    }

    return params.toString();
  }, [page, sortingMode, debouncedSearch, storeId, status]);

  /* ========================================================
     FETCH COUPONS
     Selected Store -> All coupons
     All Stores -> Normal pagination
  ======================================================== */

  const fetchCoupons = useCallback(async () => {
    fetchControllerRef.current?.abort();

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    const requestId = ++fetchRequestIdRef.current;

    setLoading(true);
    setError("");
    setCompleteStoreLoaded(false);
    setActiveDragId(null);

    try {
      let resultCoupons = [];
      let resultTotal = 0;
      let resultPages = 1;

      if (sortingMode) {
        const seen = new Set();

        let currentPage = 1;
        let expectedTotal = null;
        let completed = false;
        let previousFingerprint = "";

        while (currentPage <= MAX_BATCH_PAGES) {
          const params = new URLSearchParams(queryString);

          params.set("page", String(currentPage));
          params.set("limit", String(SORT_BATCH_SIZE));

          const response = await fetch(
            `${COUPONS_API}?${params}`,
            {
              signal: controller.signal,
              cache: "no-store",
            }
          );

          const data = await readResponse(response);

          if (
            controller.signal.aborted ||
            requestId !== fetchRequestIdRef.current
          ) {
            return;
          }

          const batch = Array.isArray(data.coupons)
            ? data.coupons
            : [];

          const fingerprint = batch
            .map((coupon) => String(coupon._id))
            .join("|");

          if (
            currentPage > 1 &&
            fingerprint &&
            fingerprint === previousFingerprint
          ) {
            throw new Error(
              "Coupon API returned a repeated page. Sorting was blocked to protect the existing order."
            );
          }

          previousFingerprint = fingerprint;

          for (const coupon of batch) {
            const id = String(coupon._id);

            if (seen.has(id)) {
              throw new Error(
                "Duplicate coupons were returned. Please refresh and retry."
              );
            }

            seen.add(id);
            resultCoupons.push(coupon);
          }

          const reportedTotal = Number(data.total);
          const reportedPages = Number(data.totalPages);

          if (
            data.total !== undefined &&
            data.total !== null &&
            Number.isFinite(reportedTotal) &&
            reportedTotal >= 0
          ) {
            expectedTotal = reportedTotal;
          }

          if (batch.length === 0) {
            completed = true;
            break;
          }

          if (
            expectedTotal !== null &&
            resultCoupons.length >= expectedTotal
          ) {
            completed = true;
            break;
          }

          if (
            Number.isFinite(reportedPages) &&
            reportedPages > 0 &&
            currentPage >= reportedPages
          ) {
            completed = true;
            break;
          }

          currentPage++;
        }

        if (!completed) {
          throw new Error(
            "The complete coupon list could not be loaded within the safety limit."
          );
        }

        if (
          expectedTotal !== null &&
          resultCoupons.length !== expectedTotal
        ) {
          throw new Error(
            `Only ${resultCoupons.length} of ${expectedTotal} coupons loaded. Sorting has been disabled.`
          );
        }

        resultTotal = resultCoupons.length;
        resultPages = 1;
      } else {
        const response = await fetch(
          `${COUPONS_API}?${queryString}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        const data = await readResponse(response);

        resultCoupons = Array.isArray(data.coupons)
          ? data.coupons
          : [];

        resultTotal = Number(data.total || 0);
        resultPages = Math.max(1, Number(data.totalPages || 1));
      }

      if (
        controller.signal.aborted ||
        requestId !== fetchRequestIdRef.current
      ) {
        return;
      }

      setCoupons(resultCoupons);
      setTotal(resultTotal);
      setTotalPages(resultPages);
      setSelectedCoupons([]);
      setOrderChanged(false);
      setCompleteStoreLoaded(sortingMode);
    } catch (err) {
      if (
        err.name === "AbortError" ||
        requestId !== fetchRequestIdRef.current
      ) {
        return;
      }

      console.error("Fetch coupons error:", err);

      setError(err.message || "Failed to fetch coupons.");
      setCoupons([]);
      setTotal(0);
      setTotalPages(1);
      setCompleteStoreLoaded(false);
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [queryString, sortingMode]);

  useEffect(() => {
    fetchCoupons();

    return () => fetchControllerRef.current?.abort();
  }, [fetchCoupons, refreshKey]);

  /* ========================================================
     UNSAVED CHANGES
  ======================================================== */

  const confirmDiscard = useCallback(() => {
    if (!orderChangedRef.current) return true;

    return window.confirm(
      "You have unsaved coupon sorting changes. Discard them and continue?"
    );
  }, []);

  function handleStoreChange(id, store) {
    if (id === storeId && !orderChangedRef.current) {
      setSelectedStore(store);
      return;
    }

    if (!confirmDiscard()) return;

    setStoreId(id);
    setSelectedStore(store);
    setPage(1);
    setOrderChanged(false);
    setSelectedCoupons([]);
    setActiveDragId(null);
  }

  function handleSearch(value) {
    if (!confirmDiscard()) return;

    setSearch(value);
    setPage(1);
    setOrderChanged(false);
    setActiveDragId(null);
  }

  function handleStatus(value) {
    if (!confirmDiscard()) return;

    setStatus(value);
    setPage(1);
    setOrderChanged(false);
    setActiveDragId(null);
  }

  function handlePage(nextPage) {
    if (sortingMode) return;
    if (nextPage < 1 || nextPage > totalPages) return;
    if (nextPage === page) return;
    if (!confirmDiscard()) return;

    setPage(nextPage);
    setOrderChanged(false);
  }

  function refresh() {
    if (!confirmDiscard()) return;

    setOrderChanged(false);
    setActiveDragId(null);
    setRefreshKey((previous) => previous + 1);
  }

  /* ========================================================
     DRAG EVENTS
  ======================================================== */

  function handleDragStart(event) {
    if (!canDrag) return;

    setActiveDragId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveDragId(null);
  }

  function handleDragEnd(event) {
    setActiveDragId(null);

    if (!canDrag) return;

    const { active, over } = event;

    if (!over || String(active.id) === String(over.id)) {
      return;
    }

    const oldIndex = coupons.findIndex(
      (coupon) => String(coupon._id) === String(active.id)
    );

    const newIndex = coupons.findIndex(
      (coupon) => String(coupon._id) === String(over.id)
    );

    if (oldIndex < 0 || newIndex < 0) return;

    setCoupons((previous) =>
      arrayMove(previous, oldIndex, newIndex)
    );

    setOrderChanged(true);
  }

  /* ========================================================
     SAVE ORDER
  ======================================================== */

  async function saveOrder() {
    if (
      !canDrag ||
      !orderChanged ||
      savingOrder ||
      storeId === "all"
    ) {
      return;
    }

    if (!selectedStore?.slug) {
      window.alert(
        "Selected store slug is unavailable. Please select the store again."
      );
      return;
    }

    try {
      setSavingOrder(true);

      const payload = {
        items: coupons.map((coupon, index) => ({
          id: String(coupon._id),
          sortOrder: index + 1,
        })),
        storeSlug: selectedStore.slug,
      };

      const response = await fetch(REORDER_API, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      await readResponse(response);

      setOrderChanged(false);
      window.alert("Coupon sequence saved successfully!");

      setRefreshKey((previous) => previous + 1);
    } catch (err) {
      console.error("Save order error:", err);

      window.alert(
        err.message || "Failed to save sort order."
      );
    } finally {
      setSavingOrder(false);
    }
  }

  /* ========================================================
     SELECTION
  ======================================================== */

  function toggleSelect(id) {
    setSelectedCoupons((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function toggleSelectAll(event) {
    if (event.target.checked) {
      setSelectedCoupons(
        coupons.map((coupon) => String(coupon._id))
      );
    } else {
      setSelectedCoupons([]);
    }
  }

  /* ========================================================
     DELETE
  ======================================================== */

  async function deleteCoupon(id) {
    if (!confirmDiscard()) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this coupon?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(`${COUPONS_API}/${id}`, {
        method: "DELETE",
      });

      await readResponse(response);

      setOrderChanged(false);

      if (!sortingMode && coupons.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        setRefreshKey((previous) => previous + 1);
      }
    } catch (err) {
      console.error("Delete coupon error:", err);

      window.alert(
        err.message || "Failed to delete coupon."
      );
    } finally {
      setDeletingId("");
    }
  }

  /* ========================================================
     PAGINATION COUNTS
  ======================================================== */

  const startEntry =
    total === 0
      ? 0
      : sortingMode
        ? 1
        : (page - 1) * PAGE_SIZE + 1;

  const endEntry = sortingMode
    ? coupons.length
    : Math.min(page * PAGE_SIZE, total);

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="mx-auto max-w-[1280px] space-y-6">
        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-[32px] font-bold leading-tight text-[#1A1340]">
              <Tag
                size={32}
                strokeWidth={2.5}
                className="text-[#F4A836]"
              />
              Coupons & Offers
            </h1>

            <p className="mt-1 text-[16px] text-[#7775A0]">
              Manage your affiliate tracking links,
              promo codes, and automated deals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {orderChanged && (
              <button
                type="button"
                onClick={saveOrder}
                disabled={savingOrder || !completeStoreLoaded}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#22B07D] px-5 py-2.5 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#1f9d6f] disabled:opacity-50"
              >
                {savingOrder ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}

                Save Sorting Order
              </button>
            )}

            <Link
              href="/admin/coupons/new"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2.5 text-[14px] font-bold text-white shadow-sm transition-colors hover:bg-[#e05520]"
            >
              <Plus size={18} strokeWidth={2.5} />
              Single Coupon
            </Link>
          </div>
        </div>

        {/* FILTER TOOLBAR */}

        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-[#E0DEF5] bg-white p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] md:flex-row">
          <div className="relative w-full md:w-[350px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />

            <input
              type="text"
              placeholder="Search by title, code, or store..."
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              className="w-full rounded-lg border-[1.5px] border-[#E0DEF5] bg-[#F7F6FF] py-2 pl-10 pr-10 text-[14px] text-[#1A1340] placeholder:text-[#7775A0] transition-all focus:border-[#2D2380] focus:outline-none"
            />

            {search && (
              <button
                type="button"
                onClick={() => handleSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7775A0] hover:text-[#1A1340]"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:flex-nowrap">
            <StoreFilter
              value={storeId}
              selectedStore={selectedStore}
              onChange={handleStoreChange}
              disabled={savingOrder}
            />

            <select
              value={status}
              onChange={(event) => handleStatus(event.target.value)}
              disabled={savingOrder}
              className={FILTER_CLASS}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={refresh}
              disabled={loading || savingOrder}
              title="Refresh Coupons"
              aria-label="Refresh coupons"
              className="rounded-lg border border-[#E0DEF5] p-2 text-[#7775A0] hover:bg-[#F7F6FF] hover:text-[#2D2380] disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* SORTING STATUS */}

        {storeId !== "all" && (
          <div className="flex items-start gap-2 rounded-lg border border-[#E0DEF5] bg-white px-4 py-3 text-[12px] text-[#7775A0]">
            <AlertCircle
              size={16}
              className="shrink-0 text-[#2D2380]"
            />

            <span>
              {loading && sortingMode
                ? "Loading all coupons for this store. Please wait before sorting."
                : canDrag
                  ? `All ${coupons.length} coupons for this store are available on one page. Use the purple grip handle to drag and reorder, then click Save Sorting Order.`
                  : "Sorting is available when a store is selected and search/status filters are cleared."}
            </span>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E24B4A]/20 bg-[#FCEBEB] p-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#E24B4A]">
              <AlertCircle size={18} />
              {error}
            </div>

            <button
              type="button"
              onClick={refresh}
              className="text-[12px] font-bold text-[#E24B4A] underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* DRAG AND DROP TABLE */}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="overflow-hidden rounded-xl border border-[#E0DEF5] bg-white shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#E0DEF5] bg-[#F7F6FF]">
                      <th className="w-[110px] min-w-[110px] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-block h-9 w-9 shrink-0" />

                          <input
                            type="checkbox"
                            aria-label="Select all coupons on this page"
                            className="h-4 w-4 shrink-0 accent-[#2D2380]"
                            checked={
                              coupons.length > 0 &&
                              selectedCoupons.length === coupons.length
                            }
                            onChange={toggleSelectAll}
                          />
                        </div>
                      </th>

                      <th className="w-[35%] px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Offer Details
                      </th>

                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Type & Code
                      </th>

                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Value & Logic
                      </th>

                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Targeting
                      </th>

                      <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-widest text-[#7775A0]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#E0DEF5]">
                    {loading ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-[14px] font-semibold text-[#7775A0]"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Loader2
                              size={18}
                              className="animate-spin"
                            />

                            {sortingMode
                              ? "Loading all store coupons..."
                              : "Loading coupons..."}
                          </span>
                        </td>
                      </tr>
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-10 text-center text-[14px] font-semibold text-[#7775A0]"
                        >
                          No coupons found.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((coupon) => (
                        <SortableRow
                          key={String(coupon._id)}
                          coupon={coupon}
                          selected={selectedCoupons.includes(
                            String(coupon._id)
                          )}
                          onToggle={toggleSelect}
                          onDelete={deleteCoupon}
                          deletingId={deletingId}
                          canDrag={canDrag}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}

              <div className="flex flex-col items-center justify-between gap-4 border-t border-[#E0DEF5] bg-white px-6 py-4 sm:flex-row">
                <span className="text-[13px] font-medium text-[#7775A0]">
                  Showing{" "}
                  <strong className="text-[#1A1340]">
                    {startEntry}
                  </strong>{" "}
                  to{" "}
                  <strong className="text-[#1A1340]">
                    {endEntry}
                  </strong>{" "}
                  of{" "}
                  <strong className="text-[#1A1340]">
                    {total}
                  </strong>{" "}
                  entries
                </span>

                {sortingMode ? (
                  <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#22B07D]">
                    <CheckCircle size={15} />
                    All Store Coupons — One Page
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePage(page - 1)}
                      disabled={page <= 1 || loading}
                      aria-label="Previous page"
                      className="rounded border border-[#E0DEF5] p-1.5 text-[#7775A0] transition-colors hover:bg-[#F7F6FF] hover:text-[#1A1340] disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <button
                      type="button"
                      aria-current="page"
                      className="flex h-8 w-8 items-center justify-center rounded bg-[#2D2380] text-[13px] font-bold text-white"
                    >
                      {page}
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePage(page + 1)}
                      disabled={page >= totalPages || loading}
                      aria-label="Next page"
                      className="rounded border border-[#E0DEF5] p-1.5 text-[#7775A0] transition-colors hover:bg-[#F7F6FF] hover:text-[#1A1340] disabled:opacity-50"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </SortableContext>

          <DragOverlay>
            <DragCouponOverlay coupon={activeCoupon} />
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
