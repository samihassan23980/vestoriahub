
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import {
  ArrowLeft,
  Activity,
  Store,
  TicketPercent,
  FileText,
  RefreshCw,
  Loader2,
  ChevronDown,
  ArrowRight,
  UserRound,
  AlertCircle,
} from "lucide-react";

const BATCH_SIZE = 30;

const INITIAL_SUMMARY = {
  total: 0,
  modules: {
    store: 0,
    coupon: 0,
    blog: 0,
  },
  actions: {},
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatValue(value) {
  if (value == null || value === "") {
    return "(empty)";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function Stat({ label, value, Icon }) {
  return (
    <div className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#807B9B]">
          {label}
        </p>

        <Icon size={18} className="text-[#6253C5]" />
      </div>

      <p className="mt-3 text-2xl font-bold text-[#211B45]">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function ActivityRow({ log }) {
  const [expanded, setExpanded] = useState(false);

  const changes = Array.isArray(log.changes)
    ? log.changes
    : [];

  const Icon =
    log.module === "store"
      ? Store
      : log.module === "coupon"
        ? TicketPercent
        : FileText;

  return (
    <article className="border-b border-[#F0EDF7] p-4 last:border-b-0 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-[#F0EDFF] p-2.5 text-[#6253C5]">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#F3F1FA] px-2 py-1 text-xs font-semibold capitalize text-[#514A8A]">
              {log.action}
            </span>

            <span className="text-xs font-medium capitalize text-[#85809B]">
              {log.module}
            </span>
          </div>

          <h3 className="mt-2 break-words text-sm font-bold text-[#292346]">
            {log.targetName || "Untitled Item"}
          </h3>

          {log.targetSlug && (
            <p className="mt-1 break-all text-xs text-[#8A849F]">
              {log.targetSlug}
            </p>
          )}

          <p className="mt-2 text-xs text-[#8A849F]">
            {formatDate(log.occurredAt)}
          </p>

          {changes.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E8E6F3] px-3 py-2 text-xs font-semibold text-[#5547B7]"
              >
                {expanded ? "Hide Changes" : "View Changes"}
                <span>({changes.length})</span>
                <ChevronDown
                  size={14}
                  className={expanded ? "rotate-180" : ""}
                />
              </button>

              {expanded && (
                <div className="mt-3 space-y-3 rounded-xl bg-[#FAF9FF] p-3">
                  {changes.map((change, index) => (
                    <div key={`${change.field}-${index}`}>
                      <p className="mb-2 text-xs font-bold text-[#292346]">
                        {change.field}
                      </p>

                      <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <div className="min-w-0 rounded-lg bg-red-50 p-3">
                          <p className="mb-1 text-[10px] font-bold text-red-500">
                            BEFORE
                          </p>
                          <p className="break-all text-xs text-red-800">
                            {formatValue(change.oldValue)}
                          </p>
                        </div>

                        <ArrowRight
                          size={16}
                          className="rotate-90 justify-self-center text-[#8A849F] sm:rotate-0"
                        />

                        <div className="min-w-0 rounded-lg bg-green-50 p-3">
                          <p className="mb-1 text-[10px] font-bold text-green-600">
                            AFTER
                          </p>
                          <p className="break-all text-xs text-green-800">
                            {formatValue(change.newValue)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function EmployeeActivityPage() {
  const params = useParams();
  const router = useRouter();

  const employeeId = String(params?.id || "");

  const [filters, setFilters] = useState({
    module: "all",
    action: "all",
    from: "",
    to: "",
  });

  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const cursorRef = useRef(null);
  const hasMoreRef = useRef(false);
  const busyRef = useRef(false);
  const requestRef = useRef(0);
  const controllerRef = useRef(null);
  const sentinelRef = useRef(null);

  const invalidRange = Boolean(
    filters.from &&
    filters.to &&
    filters.from > filters.to
  );

  const updateFilter = (key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const loadActivity = useCallback(
    async (append = false) => {
      if (!employeeId || invalidRange || busyRef.current) {
        return;
      }

      busyRef.current = true;

      const requestVersion = requestRef.current;
      const controller = new AbortController();

      controllerRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const query = new URLSearchParams({
          limit: String(BATCH_SIZE),
          module: filters.module,
          action: filters.action,
        });

        if (filters.from) {
          query.set("from", filters.from);
        }

        if (filters.to) {
          query.set("to", filters.to);
        }

        if (append && cursorRef.current) {
          query.set("cursor", cursorRef.current);
        }

        const response = await fetch(
          `/api/admin/activity-logs/employees/${encodeURIComponent(employeeId)}?${query}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Failed to load activity."
          );
        }

        if (
          controller.signal.aborted ||
          requestVersion !== requestRef.current
        ) {
          return;
        }

        const incoming = Array.isArray(data.logs)
          ? data.logs
          : [];

        setEmployee(data.employee);
        setSummary(data.summary || INITIAL_SUMMARY);

        setLogs((previous) => {
          if (!append) return incoming;

          const ids = new Set(
            previous.map((item) => String(item._id))
          );

          return [
            ...previous,
            ...incoming.filter(
              (item) => !ids.has(String(item._id))
            ),
          ];
        });

        cursorRef.current = data.nextCursor || null;
        hasMoreRef.current = Boolean(data.hasMore);
        setHasMore(Boolean(data.hasMore));

        setError("");
      } catch (err) {
        if (
          err.name === "AbortError" ||
          requestVersion !== requestRef.current
        ) {
          return;
        }

        setError(err.message || "Failed to load activity.");
      } finally {
        if (requestVersion === requestRef.current) {
          busyRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [employeeId, filters, invalidRange]
  );

  useEffect(() => {
    requestRef.current += 1;
    controllerRef.current?.abort();

    busyRef.current = false;
    cursorRef.current = null;
    hasMoreRef.current = false;

    setLogs([]);
    setHasMore(false);
    setError("");

    if (invalidRange) {
      setLoading(false);
      return;
    }

    loadActivity(false);

    return () => {
      controllerRef.current?.abort();
    };
  }, [loadActivity, refreshKey, invalidRange]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (
      !node ||
      !hasMore ||
      loading ||
      loadingMore ||
      invalidRange
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !busyRef.current
        ) {
          loadActivity(true);
        }
      },
      {
        rootMargin: "300px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [
    hasMore,
    loading,
    loadingMore,
    invalidRange,
    loadActivity,
    logs.length,
  ]);

  return (
    <main className="min-h-screen bg-[#F8F7FC] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/activity-logs")}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E6F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#5547B7]"
          >
            <ArrowLeft size={16} />
            All Employees
          </button>

          <button
            type="button"
            onClick={() => setRefreshKey((v) => v + 1)}
            disabled={loading || loadingMore}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D2380] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        <section className="rounded-2xl border border-[#E8E6F3] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-[#F0EDFF] p-4 text-[#6253C5]">
              <UserRound size={26} />
            </div>

            <div className="min-w-0">
              <h1 className="break-words text-xl font-bold text-[#211B45] sm:text-2xl">
                {employee?.name || "Employee Activity"}
              </h1>

              <p className="mt-1 break-all text-sm text-[#89849E]">
                {employee?.email || "Loading employee..."}
              </p>

              {employee?.role && (
                <p className="mt-1 text-xs capitalize text-[#6253C5]">
                  {employee.role.replace(/_/g, " ")}
                  {employee.status ? ` • ${employee.status}` : ""}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat
            label="Total Activities"
            value={summary.total}
            Icon={Activity}
          />
          <Stat
            label="Store Activities"
            value={summary.modules?.store}
            Icon={Store}
          />
          <Stat
            label="Coupon Activities"
            value={summary.modules?.coupon}
            Icon={TicketPercent}
          />
          <Stat
            label="Blog Activities"
            value={summary.modules?.blog}
            Icon={FileText}
          />
        </section>

        <section className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-[#292346]">
            Filter Employee Activity
          </h2>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={filters.module}
              onChange={(e) =>
                updateFilter("module", e.target.value)
              }
              className="h-11 rounded-xl border border-[#E8E6F3] bg-white px-3 text-sm"
            >
              <option value="all">All Modules</option>
              <option value="store">Stores</option>
              <option value="coupon">Coupons</option>
              <option value="blog">Blogs</option>
            </select>

            <select
              value={filters.action}
              onChange={(e) =>
                updateFilter("action", e.target.value)
              }
              className="h-11 rounded-xl border border-[#E8E6F3] bg-white px-3 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>

            <input
              type="date"
              aria-label="From date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={(e) =>
                updateFilter("from", e.target.value)
              }
              className="h-11 rounded-xl border border-[#E8E6F3] bg-white px-3 text-sm"
            />

            <input
              type="date"
              aria-label="To date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(e) =>
                updateFilter("to", e.target.value)
              }
              className="h-11 rounded-xl border border-[#E8E6F3] bg-white px-3 text-sm"
            />
          </div>

          {(filters.module !== "all" ||
            filters.action !== "all" ||
            filters.from ||
            filters.to) && (
            <button
              type="button"
              onClick={() =>
                setFilters({
                  module: "all",
                  action: "all",
                  from: "",
                  to: "",
                })
              }
              className="mt-3 text-xs font-semibold text-[#6253C5]"
            >
              Clear Filters
            </button>
          )}
        </section>

        {invalidRange && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            End date cannot be earlier than start date.
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={18} />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((v) => v + 1)}
              className="font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#E8E6F3] bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#EEEAF6] p-5">
            <div>
              <h2 className="text-base font-bold text-[#211B45]">
                Activity History
              </h2>
              <p className="mt-1 text-xs text-[#89849E]">
                Employee actions in chronological order
              </p>
            </div>

            <span className="text-xs font-semibold text-[#807B9B]">
              {formatNumber(logs.length)} Loaded
            </span>
          </div>

          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center gap-3 p-14 text-sm text-[#89849E]">
              <Loader2 className="animate-spin" size={20} />
              Loading activities...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-14 text-center text-sm text-[#89849E]">
              No activity found for these filters.
            </div>
          ) : (
            <div>
              {logs.map((log) => (
                <ActivityRow key={log._id} log={log} />
              ))}
            </div>
          )}

          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex min-h-16 items-center justify-center p-4"
            >
              {loadingMore && (
                <span className="flex items-center gap-2 text-xs text-[#89849E]">
                  <Loader2 size={16} className="animate-spin" />
                  Loading more...
                </span>
              )}
            </div>
          )}

          {!hasMore && logs.length > 0 && !loading && (
            <p className="border-t border-[#EEEAF6] p-4 text-center text-xs text-[#89849E]">
              All matching activities loaded
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
