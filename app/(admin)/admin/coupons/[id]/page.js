
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Tag,
  Link as LinkIcon,
  Info,
  Settings,
  Globe,
  Calendar,
  CheckCircle,
  Sparkles,
  Pin,
  Loader2,
  Search,
  ChevronDown,
  X,
  Check,
} from "lucide-react";

const STORE_OPTIONS_API = "/api/admin/stores/store-options";
const STORE_PAGE_SIZE = 20;
const SEARCH_DELAY = 300;

const INPUT_CLASS =
  "w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] focus:ring-1 focus:ring-[#2D2380] outline-none transition-all";

const SELECT_CLASS =
  "w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none disabled:opacity-60";

const BOX_CLASS =
  "bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)]";

const LABEL_CLASS =
  "block text-[13px] font-semibold text-[#1A1340] mb-1.5";

function getDocId(doc) {
  if (!doc) return "";
  if (typeof doc === "string") return doc;
  return String(doc._id || doc.id || "");
}

function getArrayFromApi(data, keys = []) {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.categories)) {
    return data.data.categories;
  }
  if (Array.isArray(data?.data?.stores)) {
    return data.data.stores;
  }
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.docs)) return data.docs;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function getCategoryLabel(category) {
  const level = Number(category?.level || 0);
  const prefix = level === 1 ? "— " : level === 2 ? "—— " : "";

  return `${prefix}${
    category?.name || category?.title || "Untitled Category"
  }`;
}

function formatDateTimeLocal(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(
    date.getMonth() + 1
  )}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function normalizeNumber(value, fallback = 0) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function fetchStoreOptions(params, signal) {
  const query = new URLSearchParams(params);

  const response = await fetch(
    `${STORE_OPTIONS_API}?${query.toString()}`,
    {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    }
  );

  const result = await response.json();

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.error || "Failed to load store options."
    );
  }

  return result;
}

/* =====================================================
   SEARCHABLE STORE SELECT
   SAME FILE - NO SEPARATE COMPONENT REQUIRED
===================================================== */

function StoreOptionsSelect({
  value,
  onChange,
  disabled = false,
  required = false,
  selectedStore = null,
  onStoreResolved,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [options, setOptions] = useState([]);
  const [resolvedStore, setResolvedStore] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [resolving, setResolving] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const requestRef = useRef(null);
  const selectedRequestRef = useRef(null);
  const requestNumberRef = useRef(0);
  const cacheRef = useRef(new Map());

  const selected =
    selectedStore && getDocId(selectedStore) === String(value)
      ? selectedStore
      : resolvedStore &&
          getDocId(resolvedStore) === String(value)
        ? resolvedStore
        : cacheRef.current.get(String(value)) || null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DELAY);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    selectedRequestRef.current?.abort();

    if (!value) {
      setResolvedStore(null);
      setResolving(false);
      return;
    }

    if (
      selectedStore &&
      getDocId(selectedStore) === String(value)
    ) {
      cacheRef.current.set(String(value), selectedStore);
      setResolvedStore(selectedStore);
      setResolving(false);
      return;
    }

    const cached = cacheRef.current.get(String(value));

    if (cached) {
      setResolvedStore(cached);
      setResolving(false);
      return;
    }

    const controller = new AbortController();
    selectedRequestRef.current = controller;

    async function resolveSelected() {
      setResolving(true);

      try {
        const result = await fetchStoreOptions(
          { id: String(value) },
          controller.signal
        );

        if (controller.signal.aborted) return;

        if (result?.store) {
          cacheRef.current.set(
            String(result.store._id),
            result.store
          );

          setResolvedStore(result.store);
          onStoreResolved?.(result.store);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(
            "Selected store lookup error:",
            err
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setResolving(false);
        }
      }
    }

    resolveSelected();

    return () => controller.abort();
  }, [value, selectedStore, onStoreResolved]);

  const loadOptions = useCallback(
    async ({
      query = "",
      cursor = null,
      append = false,
    } = {}) => {
      requestRef.current?.abort();

      const controller = new AbortController();
      requestRef.current = controller;

      const requestNumber = ++requestNumberRef.current;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOptions([]);
        setHasMore(false);
        setNextCursor(null);
      }

      setError("");

      try {
        const params = {
          limit: String(STORE_PAGE_SIZE),
        };

        if (query) params.q = query;
        if (cursor) params.cursor = cursor;

        const result = await fetchStoreOptions(
          params,
          controller.signal
        );

        if (
          controller.signal.aborted ||
          requestNumber !== requestNumberRef.current
        ) {
          return;
        }

        const incoming = Array.isArray(result.stores)
          ? result.stores
          : [];

        incoming.forEach((store) => {
          cacheRef.current.set(String(store._id), store);
        });

        setOptions((previous) => {
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

        setHasMore(
          Boolean(
            result?.pagination?.hasMore ??
              result?.hasMore
          )
        );

        setNextCursor(
          result?.pagination?.nextCursor ??
            result?.nextCursor ??
            null
        );
      } catch (err) {
        if (
          err.name === "AbortError" ||
          requestNumber !== requestNumberRef.current
        ) {
          return;
        }

        setError(
          err.message || "Unable to search stores."
        );
      } finally {
        if (requestNumber === requestNumberRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (!open || disabled) return;

    loadOptions({
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
    loadOptions,
  ]);

  const handleSelect = (store) => {
    cacheRef.current.set(String(store._id), store);
    setResolvedStore(store);

    onChange?.(String(store._id), store);

    setOpen(false);
    setSearch("");
    setDebouncedSearch("");
  };

  const handleClear = (event) => {
    event.preventDefault();
    event.stopPropagation();

    setResolvedStore(null);
    setSearch("");
    setDebouncedSearch("");
    onChange?.("", null);
    setOpen(false);
  };

  const handleLoadMore = () => {
    if (
      loading ||
      loadingMore ||
      !hasMore ||
      !nextCursor
    ) {
      return;
    }

    loadOptions({
      query: debouncedSearch,
      cursor: nextCursor,
      append: true,
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0"
    >
      <select
        tabIndex={-1}
        required={required}
        value={value ? "selected" : ""}
        onChange={() => {}}
        aria-hidden="true"
        className="absolute h-px w-px opacity-0 pointer-events-none"
      >
        <option value="">Select Store</option>
        <option value="selected">Selected</option>
      </select>

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={`${SELECT_CLASS} min-h-[44px] flex items-center justify-between gap-2 text-left`}
        >
          <span className="min-w-0 truncate">
            {selected?.name ||
              (value && resolving
                ? "Loading selected store..."
                : value
                  ? "Selected Store"
                  : "Select Store")}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {resolving && (
              <Loader2
                size={14}
                className="animate-spin text-[#7775A0]"
              />
            )}

            <ChevronDown
              size={16}
              className={`text-[#7775A0] transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear selected store"
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded p-1 text-[#7775A0] hover:bg-[#F7F6FF]"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-[#E0DEF5] rounded-xl shadow-[0_12px_40px_rgba(26,19,64,0.16)] overflow-hidden">
          <div className="p-3 border-b border-[#E0DEF5]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
              />

              <input
                ref={inputRef}
                type="search"
                value={search}
                maxLength={80}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search stores..."
                className="w-full pl-9 pr-3 py-2.5 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg text-[13px] text-[#1A1340] outline-none focus:border-[#2D2380]"
              />
            </div>

            <p className="mt-1.5 text-[11px] text-[#7775A0]">
              Search by store slug.
            </p>
          </div>

          <div
            role="listbox"
            aria-label="Store options"
            className="max-h-[280px] overflow-y-auto overscroll-contain"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-6 text-[13px] text-[#7775A0]">
                <Loader2
                  size={17}
                  className="animate-spin text-[#2D2380]"
                />
                Loading stores...
              </div>
            ) : error ? (
              <div className="p-5 text-center">
                <p className="text-[12px] text-[#E24B4A]">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    loadOptions({
                      query: debouncedSearch,
                    })
                  }
                  className="mt-2 text-[12px] font-bold text-[#2D2380] underline"
                >
                  Try Again
                </button>
              </div>
            ) : options.length === 0 ? (
              <div className="p-6 text-center text-[13px] text-[#7775A0]">
                No matching stores found.
              </div>
            ) : (
              <>
                {options.map((store) => {
                  const isSelected =
                    String(store._id) === String(value);

                  return (
                    <button
                      key={store._id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(store)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#F0EFF9] last:border-0 hover:bg-[#F7F6FF] transition-colors ${
                        isSelected ? "bg-[#F0EEFF]" : ""
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

                      {isSelected && (
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
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[12px] font-bold text-[#2D2380] hover:bg-[#F7F6FF] disabled:opacity-50"
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

/* =====================================================
   COUPON EDITOR
===================================================== */

const CouponEditor = () => {
  const router = useRouter();
  const params = useParams();
  const couponId = params?.id;

  const [loading, setLoading] = useState(true);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    terms: "",
    trackingLink: "",
    type: "coupon",
    codeType: "public",
    code: "",
    discountType: "percent",
    discountValue: "",
    maxDiscountCap: "",
    minOrderValue: "",
    status: "active",
    expiryDate: "",
    isVerified: false,
    isExclusive: false,
    isPinned: false,
    countryCode: "GLOBAL",
    sortOrder: 1000,
    storeId: "",
    categoryId: "",
    secondaryCategoryIds: [],
  });

  const selectedStore = useMemo(
    () =>
      stores.find(
        (store) =>
          getDocId(store) === String(formData.storeId)
      ) || null,
    [stores, formData.storeId]
  );

  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) =>
          getDocId(category) === String(formData.categoryId)
      ) || null,
    [categories, formData.categoryId]
  );

  const registerStore = useCallback((store) => {
    if (!store?._id) return;

    setStores((previous) => {
      const id = getDocId(store);
      const existing = previous.find(
        (item) => getDocId(item) === id
      );

      if (existing) {
        return previous.map((item) =>
          getDocId(item) === id ? store : item
        );
      }

      return [...previous, store];
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchReferenceData() {
      try {
        setLoadingRefs(true);

        const response = await fetch(
          "/api/admin/categories?limit=1000&status=active",
          {
            cache: "no-store",
            credentials: "same-origin",
          }
        );

        const result = await response.json();

        if (
          !response.ok ||
          result?.success === false
        ) {
          throw new Error(
            result?.details ||
              result?.error ||
              "Failed to load categories."
          );
        }

        const normalized = getArrayFromApi(result, [
          "categories",
          "category",
        ])
          .filter(
            (category) => category?.status === "active"
          )
          .sort((a, b) => {
            const levelA = Number(a?.level || 0);
            const levelB = Number(b?.level || 0);

            const sortA = Number(a?.sortOrder || 1000);
            const sortB = Number(b?.sortOrder || 1000);

            if (levelA !== levelB) {
              return levelA - levelB;
            }

            if (sortA !== sortB) {
              return sortA - sortB;
            }

            return String(a?.name || "").localeCompare(
              String(b?.name || "")
            );
          });

        if (!cancelled) {
          setCategories(normalized);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Reference data error:", error);

        Swal.fire({
          icon: "error",
          title: "Data Load Failed",
          text:
            error.message ||
            "Categories could not be loaded. Please try again.",
          confirmButtonColor: "#2D2380",
        });
      } finally {
        if (!cancelled) {
          setLoadingRefs(false);
        }
      }
    }

    fetchReferenceData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!couponId) return;

    let cancelled = false;

    async function fetchCoupon() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/admin/coupons/${couponId}`,
          {
            cache: "no-store",
            credentials: "same-origin",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error || "Failed to load coupon."
          );
        }

        const coupon =
          result?.coupon ||
          result?.data?.coupon ||
          result?.data ||
          result;

        if (cancelled) return;

        if (
          coupon?.storeId &&
          typeof coupon.storeId === "object" &&
          coupon.storeId.name
        ) {
          registerStore(coupon.storeId);
        }

        setFormData({
          title: coupon?.title || "",
          subtitle: coupon?.subtitle || "",
          terms: coupon?.terms || "",
          trackingLink: coupon?.trackingLink || "",
          type: coupon?.type || "coupon",
          codeType: coupon?.codeType || "public",
          code: coupon?.code || "",
          discountType: coupon?.discountType || "percent",
          discountValue:
            coupon?.discountValue === 0 ||
            coupon?.discountValue
              ? String(coupon.discountValue)
              : "",
          maxDiscountCap:
            coupon?.maxDiscountCap === 0 ||
            coupon?.maxDiscountCap
              ? String(coupon.maxDiscountCap)
              : "",
          minOrderValue:
            coupon?.minOrderValue === 0 ||
            coupon?.minOrderValue
              ? String(coupon.minOrderValue)
              : "",
          status: coupon?.status || "active",
          expiryDate: formatDateTimeLocal(
            coupon?.expiryDate
          ),
          isVerified: Boolean(coupon?.isVerified),
          isExclusive: Boolean(coupon?.isExclusive),
          isPinned: Boolean(coupon?.isPinned),
          countryCode:
            coupon?.countryCode || "GLOBAL",
          sortOrder:
            coupon?.sortOrder === 0 ||
            coupon?.sortOrder
              ? String(coupon.sortOrder)
              : "1000",
          storeId: getDocId(coupon?.storeId),
          categoryId: getDocId(coupon?.categoryId),
          secondaryCategoryIds: Array.isArray(
            coupon?.secondaryCategoryIds
          )
            ? coupon.secondaryCategoryIds.map(getDocId)
            : [],
        });
      } catch (error) {
        if (cancelled) return;

        console.error("Coupon fetch error:", error);

        Swal.fire({
          icon: "error",
          title: "Coupon Load Failed",
          text:
            error.message ||
            "Coupon could not be loaded.",
          confirmButtonColor: "#2D2380",
        }).then(() => {
          router.push("/admin/coupons");
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchCoupon();

    return () => {
      cancelled = true;
    };
  }, [couponId, router, registerStore]);

  const handleStoreChange = useCallback(
    (storeId, store) => {
      if (store) {
        registerStore(store);
      }

      setFormData((previous) => {
        const updated = {
          ...previous,
          storeId: String(storeId || ""),
        };

        if (!store) {
          return updated;
        }

        const affiliateLink =
          store.tracking?.trackingLink ||
          store.trackingLink ||
          store.officialUrl ||
          "";

        if (affiliateLink) {
          updated.trackingLink = affiliateLink;
        }

        const categoryId = getDocId(
          store.primaryCategoryId
        );

        if (categoryId) {
          updated.categoryId = categoryId;
        }

        if (store.countryCode) {
          updated.countryCode = String(
            store.countryCode
          ).toUpperCase();
        }

        return updated;
      });
    },
    [registerStore]
  );

  const handleSmartChange = (
    name,
    value,
    inputType = "text",
    checked = false
  ) => {
    const finalValue =
      inputType === "checkbox" ? checked : value;

    setFormData((previous) => {
      const updated = {
        ...previous,
        [name]: finalValue,
      };

      if (name === "type" && finalValue === "deal") {
        updated.code = "";
        updated.codeType = "auto_applied";
      }

      if (
        name === "type" &&
        finalValue === "coupon" &&
        !updated.codeType
      ) {
        updated.codeType = "public";
      }

      if (
        name === "codeType" &&
        finalValue === "auto_applied"
      ) {
        updated.code = "";
      }

      if (
        name === "discountType" &&
        finalValue === "free_shipping"
      ) {
        updated.discountValue = 0;
        updated.maxDiscountCap = "";
      }

      if (
        name === "discountType" &&
        finalValue !== "percent"
      ) {
        updated.maxDiscountCap = "";
      }

      if (name === "code") {
        updated.code = String(
          finalValue || ""
        ).toUpperCase();
      }

      if (name === "countryCode") {
        updated.countryCode = String(
          finalValue || "GLOBAL"
        ).toUpperCase();
      }

      return updated;
    });
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    handleSmartChange(name, value, type, checked);
  };

  const validateCoupon = () => {
    if (!formData.title.trim()) {
      return "Coupon title is required.";
    }

    if (formData.title.length > 180) {
      return "Coupon title cannot be more than 180 characters.";
    }

    if (formData.subtitle.length > 250) {
      return "Short description cannot be more than 250 characters.";
    }

    if (formData.terms.length > 1000) {
      return "Terms cannot be more than 1000 characters.";
    }

    if (!formData.trackingLink.trim()) {
      return "Store deal link is required.";
    }

    if (!isValidUrl(formData.trackingLink)) {
      return "Store deal link must be a valid http or https URL.";
    }

    if (!formData.storeId) {
      return "Store is required.";
    }

    if (!formData.categoryId) {
      return "Primary category is required.";
    }

    if (
      !["coupon", "deal"].includes(formData.type)
    ) {
      return "Invalid coupon type.";
    }

    if (
      !["public", "auto_applied"].includes(
        formData.codeType
      )
    ) {
      return "Invalid code option.";
    }

    if (
      formData.type === "coupon" &&
      formData.codeType === "public" &&
      !formData.code.trim()
    ) {
      return "Promo code is required when code is shown to users.";
    }

    if (
      !["percent", "flat", "free_shipping"].includes(
        formData.discountType
      )
    ) {
      return "Invalid discount type.";
    }

    const discountValue = normalizeNumber(
      formData.discountValue,
      0
    );

    if (
      formData.discountType !== "free_shipping" &&
      discountValue <= 0
    ) {
      return "Discount value must be greater than 0.";
    }

    if (
      formData.discountType === "percent" &&
      discountValue > 100
    ) {
      return "Percentage discount cannot be more than 100.";
    }

    if (
      normalizeNumber(formData.minOrderValue, 0) < 0
    ) {
      return "Minimum order amount cannot be negative.";
    }

    if (
      formData.maxDiscountCap !== "" &&
      formData.maxDiscountCap !== null &&
      normalizeNumber(formData.maxDiscountCap, 0) < 0
    ) {
      return "Maximum discount limit cannot be negative.";
    }

    if (
      !["active", "expired", "inactive"].includes(
        formData.status
      )
    ) {
      return "Invalid status.";
    }

    if (
      Array.isArray(formData.secondaryCategoryIds) &&
      formData.secondaryCategoryIds.length > 5
    ) {
      return "Secondary categories cannot be more than 5.";
    }

    return "";
  };

  const buildPayload = () => ({
    title: formData.title.trim(),
    subtitle: formData.subtitle.trim(),
    terms: formData.terms.trim(),

    trackingLink: formData.trackingLink.trim(),

    type: formData.type,
    codeType:
      formData.type === "deal"
        ? "auto_applied"
        : formData.codeType,

    code:
      formData.type === "coupon" &&
      formData.codeType === "public"
        ? formData.code.trim().toUpperCase()
        : "",

    discountType: formData.discountType,

    discountValue:
      formData.discountType === "free_shipping"
        ? 0
        : normalizeNumber(formData.discountValue, 0),

    maxDiscountCap:
      formData.discountType === "percent" &&
      formData.maxDiscountCap !== ""
        ? normalizeNumber(
            formData.maxDiscountCap,
            null
          )
        : null,

    minOrderValue: normalizeNumber(
      formData.minOrderValue,
      0
    ),

    expiryDate: formData.expiryDate || null,
    status: formData.status,

    isVerified: Boolean(formData.isVerified),
    isExclusive: Boolean(formData.isExclusive),
    isPinned: Boolean(formData.isPinned),

    countryCode: formData.countryCode || "GLOBAL",
    sortOrder: normalizeNumber(
      formData.sortOrder,
      1000
    ),

    storeId: formData.storeId,
    categoryId: formData.categoryId,

    secondaryCategoryIds: Array.isArray(
      formData.secondaryCategoryIds
    )
      ? formData.secondaryCategoryIds.filter(Boolean)
      : [],
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    const validationError = validateCoupon();

    if (validationError) {
      Swal.fire({
        icon: "error",
        title: "Please fix this coupon",
        text: validationError,
        confirmButtonColor: "#2D2380",
      });

      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Save changes?",
      text: "This will update the coupon.",
      showCancelButton: true,
      confirmButtonText: "Save changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#FF6B35",
      cancelButtonColor: "#7775A0",
    });

    if (!result.isConfirmed) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
        `/api/admin/coupons/${couponId}`,
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload()),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to update coupon."
        );
      }

      await Swal.fire({
        icon: "success",
        title: "Coupon updated",
        text: "Coupon saved successfully.",
        confirmButtonColor: "#2D2380",
      });

      router.push("/admin/coupons");
      router.refresh();
    } catch (error) {
      console.error("Coupon update error:", error);

      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text:
          error.message ||
          "Coupon could not be updated.",
        confirmButtonColor: "#2D2380",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const Toggle = ({
    label,
    name,
    checked,
    onChange,
    icon: Icon,
    colorClass,
  }) => (
    <label className="flex items-center justify-between p-4 border border-[#E0DEF5] rounded-lg cursor-pointer hover:bg-[#F7F6FF] transition-colors">
      <div className="flex items-center gap-3">
        <Icon
          size={18}
          className={
            checked ? colorClass : "text-[#7775A0]"
          }
        />

        <span className="text-[#1A1340] font-semibold text-[14px]">
          {label}
        </span>
      </div>

      <div className="relative">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />

        <div
          className={`block w-10 h-6 rounded-full transition-colors ${
            checked
              ? "bg-[#2D2380]"
              : "bg-[#E0DEF5]"
          }`}
        />

        <div
          className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            checked
              ? "translate-x-4"
              : "translate-x-0"
          }`}
        />
      </div>
    </label>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#7775A0] font-semibold">
          <Loader2
            size={22}
            className="animate-spin text-[#2D2380]"
          />
          Loading coupon...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        <form onSubmit={handleSubmit}>
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/coupons"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight">
                  Edit Coupon
                </h1>

                <p className="text-[#7775A0] text-[14px]">
                  Update coupon details, store link,
                  category, badges, and status.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loadingRefs}
              className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>

          {/* FORM GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              {/* DISPLAY CONTENT */}
              <div className={`${BOX_CLASS} space-y-5`}>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Info
                    size={18}
                    className="text-[#2D2380]"
                  />
                  Coupon Details
                </h2>

                <div>
                  <label className={LABEL_CLASS}>
                    Coupon Title{" "}
                    <span className="text-[#E24B4A]">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. 30% Off All Electronics"
                    maxLength={180}
                    required
                    className={INPUT_CLASS}
                  />

                  <p className="mt-1 text-[11px] text-[#7775A0]">
                    {formData.title.length}/180 characters
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Short Description{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional)
                    </span>
                  </label>

                  <input
                    type="text"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleChange}
                    placeholder="e.g. No minimum order required"
                    maxLength={250}
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Terms & Conditions{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional)
                    </span>
                  </label>

                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleChange}
                    placeholder="e.g. Valid on orders above $50. Excludes sale items."
                    rows={3}
                    maxLength={1000}
                    className={`${INPUT_CLASS} resize-none`}
                  />
                </div>
              </div>

              {/* COUPON SETTINGS */}
              <div className={`${BOX_CLASS} space-y-6`}>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Tag
                    size={18}
                    className="text-[#2D2380]"
                  />
                  Coupon Settings
                </h2>

                {/* TYPE SELECTION */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`${LABEL_CLASS} mb-2`}>
                      Coupon Type
                    </label>

                    <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                      <button
                        type="button"
                        onClick={() =>
                          handleSmartChange(
                            "type",
                            "coupon"
                          )
                        }
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                          formData.type === "coupon"
                            ? "bg-white text-[#2D2380] shadow-sm"
                            : "text-[#7775A0] hover:text-[#1A1340]"
                        }`}
                      >
                        Coupon Code
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSmartChange(
                            "type",
                            "deal"
                          )
                        }
                        className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                          formData.type === "deal"
                            ? "bg-white text-[#2D2380] shadow-sm"
                            : "text-[#7775A0] hover:text-[#1A1340]"
                        }`}
                      >
                        No Code Deal
                      </button>
                    </div>
                  </div>

                  {formData.type === "coupon" && (
                    <div>
                      <label
                        className={`${LABEL_CLASS} mb-2`}
                      >
                        Code Option
                      </label>

                      <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                        <button
                          type="button"
                          onClick={() =>
                            handleSmartChange(
                              "codeType",
                              "public"
                            )
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                            formData.codeType === "public"
                              ? "bg-white text-[#2D2380] shadow-sm"
                              : "text-[#7775A0] hover:text-[#1A1340]"
                          }`}
                        >
                          Show Code to User
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSmartChange(
                              "codeType",
                              "auto_applied"
                            )
                          }
                          className={`flex-1 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                            formData.codeType ===
                            "auto_applied"
                              ? "bg-white text-[#2D2380] shadow-sm"
                              : "text-[#7775A0] hover:text-[#1A1340]"
                          }`}
                        >
                          Apply Automatically
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROMO CODE */}
                {formData.type === "coupon" &&
                  formData.codeType === "public" && (
                    <div>
                      <label className={LABEL_CLASS}>
                        Promo Code{" "}
                        <span className="text-[#E24B4A]">
                          *
                        </span>
                      </label>

                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g. SAVE20"
                        style={{
                          textTransform: "uppercase",
                        }}
                        required
                        className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[16px] font-mono font-bold text-[#F4A836] focus:border-[#F4A836] focus:ring-1 focus:ring-[#F4A836] outline-none transition-all uppercase"
                      />
                    </div>
                  )}

                {/* DISCOUNT SETUP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#E0DEF5]">
                  <div>
                    <label className={LABEL_CLASS}>
                      Discount Type
                    </label>

                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleChange}
                      className={SELECT_CLASS}
                    >
                      <option value="percent">
                        Percentage (%)
                      </option>
                      <option value="flat">
                        Fixed Amount ($)
                      </option>
                      <option value="free_shipping">
                        Free Shipping
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>
                      Discount Value
                    </label>

                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleChange}
                      placeholder={
                        formData.discountType === "percent"
                          ? "e.g. 30"
                          : "e.g. 15"
                      }
                      min="0"
                      max={
                        formData.discountType === "percent"
                          ? "100"
                          : undefined
                      }
                      step="0.01"
                      required={
                        formData.discountType !==
                        "free_shipping"
                      }
                      disabled={
                        formData.discountType ===
                        "free_shipping"
                      }
                      className={`${INPUT_CLASS} disabled:bg-[#F7F6FF] disabled:text-[#7775A0]`}
                    />
                  </div>

                  <div>
                    <label className={LABEL_CLASS}>
                      Minimum Order Amount
                    </label>

                    <input
                      type="number"
                      name="minOrderValue"
                      value={formData.minOrderValue}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* MAX DISCOUNT CAP */}
                {formData.discountType === "percent" && (
                  <div>
                    <label className={LABEL_CLASS}>
                      Maximum Discount Limit ($){" "}
                      <span className="text-[#7775A0] font-normal">
                        (Optional)
                      </span>
                    </label>

                    <input
                      type="number"
                      name="maxDiscountCap"
                      value={formData.maxDiscountCap}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50"
                      className={`md:w-1/3 ${INPUT_CLASS}`}
                    />
                  </div>
                )}
              </div>

              {/* TRACKING LINK */}
              <div className={BOX_CLASS}>
                <label className="text-[14px] font-bold text-[#1A1340] mb-2 flex items-center gap-2">
                  <LinkIcon
                    size={16}
                    className="text-[#2D2380]"
                  />
                  Store Deal Link{" "}
                  <span className="text-[#E24B4A]">
                    *
                  </span>
                </label>

                <p className="text-[#7775A0] text-[13px] mb-3">
                  Add the final store or affiliate link
                  where users should go.
                </p>

                <input
                  type="url"
                  name="trackingLink"
                  value={formData.trackingLink}
                  onChange={handleChange}
                  placeholder="https://www.store.com/deal?aff_id=123"
                  required
                  className={`${INPUT_CLASS} py-3`}
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              {/* ORGANIZATION */}
              <div className={`${BOX_CLASS} space-y-4`}>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Settings
                    size={18}
                    className="text-[#2D2380]"
                  />
                  Organization
                </h2>

                {loadingRefs && (
                  <div className="flex items-center gap-2 text-[#7775A0] text-[13px] font-semibold">
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Loading categories...
                  </div>
                )}

                {/* STORE SELECTION */}
                <div>
                  <label className={LABEL_CLASS}>
                    Store{" "}
                    <span className="text-[#E24B4A]">
                      *
                    </span>
                  </label>

                  <StoreOptionsSelect
                    value={formData.storeId}
                    onChange={handleStoreChange}
                    selectedStore={selectedStore}
                    onStoreResolved={registerStore}
                    disabled={isSubmitting}
                    required
                  />

                  {selectedStore && (
                    <p className="mt-1 text-[11px] text-[#7775A0]">
                      Selected: {selectedStore.name}
                    </p>
                  )}
                </div>

                {/* PRIMARY CATEGORY */}
                <div>
                  <label className={LABEL_CLASS}>
                    Primary Category{" "}
                    <span className="text-[#E24B4A]">
                      *
                    </span>
                  </label>

                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    required
                    disabled={loadingRefs}
                    className={SELECT_CLASS}
                  >
                    <option value="">
                      {loadingRefs
                        ? "Loading categories..."
                        : "Select Category"}
                    </option>

                    {categories.map((category) => {
                      const id = getDocId(category);

                      return (
                        <option key={id} value={id}>
                          {getCategoryLabel(category)}
                        </option>
                      );
                    })}
                  </select>

                  {selectedCategory && (
                    <p className="mt-1 text-[11px] text-[#7775A0]">
                      Selected:{" "}
                      {getCategoryLabel(selectedCategory)}
                    </p>
                  )}

                  {!loadingRefs &&
                    categories.length === 0 && (
                      <p className="mt-1 text-[11px] text-[#E24B4A] font-semibold">
                        No active categories found.
                        Please create an active category
                        first.
                      </p>
                    )}
                </div>
              </div>

              {/* STATUS & TARGETING */}
              <div className={`${BOX_CLASS} space-y-4`}>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3">
                  <Globe
                    size={18}
                    className="text-[#2D2380]"
                  />
                  Status & Targeting
                </h2>

                <div>
                  <label className={LABEL_CLASS}>
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={SELECT_CLASS}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">
                      Inactive
                    </option>
                    <option value="expired">
                      Expired
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={`${LABEL_CLASS} flex items-center gap-1.5`}
                  >
                    <Calendar size={14} />
                    Expiry Date
                  </label>

                  <input
                    type="datetime-local"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    className={INPUT_CLASS}
                  />

                  <p className="text-[12px] text-[#7775A0] mt-1">
                    Leave blank if this coupon does
                    not expire.
                  </p>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Region
                  </label>

                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className={SELECT_CLASS}
                  >
                    <option value="GLOBAL">Global</option>
                    <option value="PK">Pakistan</option>
                    <option value="US">
                      United States
                    </option>
                    <option value="GB">
                      United Kingdom
                    </option>
                    <option value="IN">India</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="AE">UAE</option>
                  </select>
                </div>

                <div>
                  <label className={LABEL_CLASS}>
                    Sort Order
                  </label>

                  <input
                    type="number"
                    name="sortOrder"
                    value={formData.sortOrder}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              {/* BADGES & PRIORITY */}
              <div className={`${BOX_CLASS} space-y-3`}>
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                  <Sparkles
                    size={18}
                    className="text-[#2D2380]"
                  />
                  Badges & Priority
                </h2>

                <Toggle
                  label="Tested and Working"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleChange}
                  icon={CheckCircle}
                  colorClass="text-[#22B07D]"
                />

                <Toggle
                  label="Exclusive Deal"
                  name="isExclusive"
                  checked={formData.isExclusive}
                  onChange={handleChange}
                  icon={Sparkles}
                  colorClass="text-[#F4A836]"
                />

                <Toggle
                  label="Show First"
                  name="isPinned"
                  checked={formData.isPinned}
                  onChange={handleChange}
                  icon={Pin}
                  colorClass="text-[#2D2380]"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouponEditor;
