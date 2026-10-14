
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  Activity,
  Store,
  TicketPercent,
  FileText,
  Users,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  FilterX,
  Clock3,
  ChevronDown,
  Search,
  ExternalLink,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import ActivitySearch from "@/app/Components/ActivitySearch";


// ============================================================
// CONFIGURATION
// ============================================================

const BATCH_SIZE = 30;

const MODULES = [
  { value: "all", label: "All Modules" },
  { value: "store", label: "Stores" },
  { value: "coupon", label: "Coupons" },
  { value: "blog", label: "Blogs" },
];

const ACTIONS = [
  { value: "all", label: "All Actions" },
  { value: "created", label: "Created" },
  { value: "updated", label: "Updated" },
  { value: "deleted", label: "Deleted" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "7days", label: "Last 7 Days" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

const INITIAL_SUMMARY = {
  total: 0,
  modules: {
    store: 0,
    coupon: 0,
    blog: 0,
  },
  actions: {},
};

const INITIAL_FILTERS = {
  period: "today",
  module: "all",
  action: "all",
  employeeId: "",
  from: "",
  to: "",
};

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-[#E5E3F3] " +
  "bg-white px-3 text-sm font-medium text-[#272244] " +
  "outline-none transition focus:border-[#6658D3] " +
  "focus:ring-2 focus:ring-[#6658D3]/10";

// ============================================================
// HELPERS
// ============================================================

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
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getModuleConfig(module) {
  switch (module) {
    case "store":
      return {
        label: "Store",
        icon: Store,
        bg: "bg-blue-50",
        color: "text-blue-600",
      };

    case "coupon":
      return {
        label: "Coupon",
        icon: TicketPercent,
        bg: "bg-amber-50",
        color: "text-amber-600",
      };

    case "blog":
      return {
        label: "Blog",
        icon: FileText,
        bg: "bg-violet-50",
        color: "text-violet-600",
      };

    default:
      return {
        label: "Activity",
        icon: Activity,
        bg: "bg-slate-100",
        color: "text-slate-600",
      };
  }
}

function getActionConfig(action) {
  switch (action) {
    case "created":
      return {
        label: "Created",
        className: "bg-emerald-50 text-emerald-700",
      };

    case "updated":
      return {
        label: "Updated",
        className: "bg-blue-50 text-blue-700",
      };

    case "deleted":
      return {
        label: "Deleted",
        className: "bg-red-50 text-red-700",
      };

    case "published":
      return {
        label: "Published",
        className: "bg-violet-50 text-violet-700",
      };

    case "unpublished":
      return {
        label: "Unpublished",
        className: "bg-orange-50 text-orange-700",
      };

    default:
      return {
        label: action || "Activity",
        className: "bg-slate-100 text-slate-600",
      };
  }
}

function getTargetActivityUrl(log) {
  if (!log?.targetId || !log?.module) {
    return null;
  }

  if (!["store", "coupon", "blog"].includes(log.module)) {
    return null;
  }

  return `/admin/activity-logs/targets/${encodeURIComponent(
    log.module
  )}/${encodeURIComponent(String(log.targetId))}`;
}

// ============================================================
// STATISTICS CARD
// ============================================================

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[#85819E] sm:text-sm">
            {label}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-[#201A45] sm:text-3xl">
            {formatNumber(value)}
          </p>
        </div>

        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY ITEM
// ============================================================

function ActivityItem({ log }) {
  const [expanded, setExpanded] = useState(false);

  const moduleConfig = getModuleConfig(log.module);
  const actionConfig = getActionConfig(log.action);

  const Icon = moduleConfig.icon;

  const changes = Array.isArray(log.changes)
    ? log.changes
    : [];

  const targetActivityUrl = getTargetActivityUrl(log);

  const employeeUrl = log.actorId
    ? `/admin/activity-logs/${encodeURIComponent(
        String(log.actorId)
      )}`
    : null;

  return (
    <article className="px-4 py-5 transition-colors hover:bg-[#FCFBFF] sm:px-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${moduleConfig.bg} ${moduleConfig.color}`}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0 flex-1">
          {/* EMPLOYEE + ACTION */}

          <div className="flex flex-wrap items-center gap-2">
            {employeeUrl ? (
              <Link
                href={employeeUrl}
                className="inline-flex items-center gap-1.5 break-words text-sm font-bold text-[#211B45] transition hover:text-[#6253C5] hover:underline"
                title="View employee activity"
              >
                {log.actorName || "Unknown Employee"}
                <ExternalLink
                  size={12}
                  className="shrink-0 opacity-60"
                />
              </Link>
            ) : (
              <span className="break-words text-sm font-bold text-[#211B45]">
                {log.actorName || "Unknown Employee"}
              </span>
            )}

            <span
              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${actionConfig.className}`}
            >
              {actionConfig.label}
            </span>

            <span className="rounded-md bg-[#F3F1FA] px-2 py-1 text-[11px] font-medium text-[#77718E]">
              {moduleConfig.label}
            </span>
          </div>

          {/* TARGET NAME */}

          <div className="mt-2">
            {targetActivityUrl ? (
              <Link
                href={targetActivityUrl}
                className="inline-flex max-w-full items-start gap-1.5 break-words text-sm font-semibold text-[#30294E] transition hover:text-[#6253C5] hover:underline"
                title="View complete available item history"
              >
                <span className="min-w-0 break-words">
                  {log.targetName || "Untitled Item"}
                </span>

                <ExternalLink
                  size={13}
                  className="mt-0.5 shrink-0 opacity-60"
                />
              </Link>
            ) : (
              <p className="break-words text-sm font-semibold text-[#30294E]">
                {log.targetName || "Untitled Item"}
              </p>
            )}
          </div>

          {log.targetSlug && (
            <p className="mt-1 break-all text-xs text-[#89849E]">
              {log.targetSlug}
            </p>
          )}

          {/* META */}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A859D]">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} />
              {formatDate(log.occurredAt)}
            </span>

            {log.actorRole && (
              <span className="capitalize">
                {String(log.actorRole).replace(/_/g, " ")}
              </span>
            )}
          </div>

          {/* QUICK LINKS */}

          {(employeeUrl || targetActivityUrl) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {targetActivityUrl && (
                <Link
                  href={targetActivityUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#F1EEFF] px-3 py-1.5 text-[11px] font-semibold text-[#6253C5] transition hover:bg-[#E8E2FF]"
                >
                  <Activity size={12} />
                  Item History
                  <ArrowRight size={12} />
                </Link>
              )}

              {employeeUrl && (
                <Link
                  href={employeeUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6F3] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#77718E] transition hover:bg-[#F8F7FC]"
                >
                  <UserRound size={12} />
                  Employee History
                </Link>
              )}
            </div>
          )}

          {/* FIELD CHANGES */}

          {changes.length > 0 && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="inline-flex items-center gap-2 rounded-lg border border-[#E5E3F3] bg-white px-3 py-2 text-xs font-semibold text-[#5547B7] transition hover:bg-[#F7F5FF]"
              >
                {expanded ? "Hide Changes" : "View Changes"}

                <span className="rounded bg-[#F1EEFF] px-1.5 py-0.5">
                  {changes.length}
                </span>

                <ChevronDown
                  size={14}
                  className={`transition-transform ${
                    expanded ? "rotate-180" : ""
                  }`}
                />
              </button>

              {expanded && (
                <div className="mt-3 space-y-3 rounded-xl border border-[#E9E6F5] bg-[#FAF9FF] p-3 sm:p-4">
                  {changes.map((change, index) => (
                    <div
                      key={`${change.field}-${index}`}
                      className="min-w-0"
                    >
                      <p className="mb-2 break-words text-xs font-bold capitalize text-[#30294E]">
                        {String(change.field || "Field")
                          .replace(/([A-Z])/g, " $1")
                          .replace(/[._]/g, " ")}
                      </p>

                      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                        <div className="min-w-0 rounded-lg border border-red-100 bg-red-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase text-red-500">
                            Previous
                          </p>

                          <p className="break-all text-xs text-red-800">
                            {formatValue(change.oldValue)}
                          </p>
                        </div>

                        <ArrowRight
                          size={16}
                          className="rotate-90 justify-self-center text-[#9791AE] sm:rotate-0"
                        />

                        <div className="min-w-0 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                          <p className="mb-1 text-[10px] font-semibold uppercase text-emerald-600">
                            Updated
                          </p>

                          <p className="break-all text-xs text-emerald-800">
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

// ============================================================
// EMPLOYEE PERFORMANCE
// ============================================================

function EmployeePerformance({ employees, loading }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#E8E6F3] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEAF6] px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-[#F0EDFF] p-2 text-[#6253C5]">
            <Users size={18} />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#211B45]">
              Employee Performance
            </h2>

            <p className="mt-0.5 text-xs text-[#89849E]">
              Click an employee to view their activity history
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-[#F5F3FB] px-3 py-1.5 text-xs font-semibold text-[#77718E]">
          {employees.length} Employees
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] text-left text-sm">
          <thead className="bg-[#FAF9FE] text-xs font-semibold uppercase tracking-wide text-[#8A849F]">
            <tr>
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-4 py-3.5 text-center">
                Stores
              </th>
              <th className="px-4 py-3.5 text-center">
                Coupons
              </th>
              <th className="px-4 py-3.5 text-center">
                Blogs
              </th>
              <th className="px-4 py-3.5 text-right">
                Total
              </th>
              <th className="px-5 py-3.5 text-right">
                Activity
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0EDF7]">
            {employees.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-[#89849E]"
                >
                  {loading
                    ? "Loading employee performance..."
                    : "No employee activity found."}
                </td>
              </tr>
            ) : (
              employees.map((employee, index) => {
                const employeeUrl = employee.employeeId
                  ? `/admin/activity-logs/${encodeURIComponent(
                      String(employee.employeeId)
                    )}`
                  : null;

                return (
                  <tr
                    key={`${
                      employee.employeeId ||
                      employee.email ||
                      "employee"
                    }-${index}`}
                    className="transition hover:bg-[#FCFBFF]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0EDFF] text-[#6253C5]">
                          <UserRound size={17} />
                        </div>

                        <div className="min-w-0">
                          {employeeUrl ? (
                            <Link
                              href={employeeUrl}
                              className="font-semibold text-[#292346] transition hover:text-[#6253C5] hover:underline"
                            >
                              {employee.name ||
                                "Unknown Employee"}
                            </Link>
                          ) : (
                            <p className="font-semibold text-[#292346]">
                              {employee.name ||
                                "Unknown Employee"}
                            </p>
                          )}

                          <p className="mt-1 max-w-[220px] truncate text-xs text-[#928DA5]">
                            {employee.email || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center text-[#514B69]">
                      {formatNumber(employee.stores)}
                    </td>

                    <td className="px-4 py-3.5 text-center text-[#514B69]">
                      {formatNumber(employee.coupons)}
                    </td>

                    <td className="px-4 py-3.5 text-center text-[#514B69]">
                      {formatNumber(employee.blogs)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-bold text-[#5547B7]">
                      {formatNumber(employee.total)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {employeeUrl ? (
                        <Link
                          href={employeeUrl}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F0EDFF] px-3 py-2 text-xs font-semibold text-[#6253C5] transition hover:bg-[#E8E2FF]"
                        >
                          View
                          <ArrowRight size={13} />
                        </Link>
                      ) : (
                        <span className="text-xs text-[#A09BB1]">
                          Unavailable
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function ActivityLogsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [employees, setEmployees] = useState([]);
  const [logs, setLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const controllerRef = useRef(null);
  const sentinelRef = useRef(null);
  const requestVersionRef = useRef(0);

  // ==========================================================
  // VALIDATION
  // ==========================================================

  const isCustomIncomplete =
    filters.period === "custom" &&
    (!filters.from || !filters.to);

  const isInvalidRange =
    filters.period === "custom" &&
    Boolean(filters.from && filters.to) &&
    filters.from > filters.to;

  const canLoad =
    !isCustomIncomplete && !isInvalidRange;

  // ==========================================================
  // UPDATE FILTER
  // ==========================================================

  const updateFilter = useCallback((key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  // ==========================================================
  // BUILD API PARAMETERS
  // ==========================================================

  const buildParams = useCallback(
    (page) => {
      const params = new URLSearchParams();

      params.set("period", filters.period);
      params.set("page", String(page));
      params.set("limit", String(BATCH_SIZE));

      if (filters.module !== "all") {
        params.set("module", filters.module);
      }

      if (filters.action !== "all") {
        params.set("action", filters.action);
      }

      if (filters.employeeId) {
        params.set("employeeId", filters.employeeId);
      }

      if (filters.period === "custom") {
        params.set("from", filters.from);
        params.set("to", filters.to);
      }

      return params;
    },
    [filters]
  );

  // ==========================================================
  // FETCH ACTIVITY
  // ==========================================================

  const fetchLogs = useCallback(
    async (page = 1, append = false) => {
      if (!canLoad) return;
      if (loadingRef.current) return;

      loadingRef.current = true;

      const requestVersion = requestVersionRef.current;
      const controller = new AbortController();

      controllerRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError("");
      }

      try {
        const params = buildParams(page);

        const response = await fetch(
          `/api/admin/activity-logs?${params.toString()}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const payload = await response.json();

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.error ||
              "Failed to load employee activities."
          );
        }

        if (
          controller.signal.aborted ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        const incomingLogs = Array.isArray(payload.logs)
          ? payload.logs
          : [];

        setLogs((previous) => {
          if (!append) {
            return incomingLogs;
          }

          const existingIds = new Set(
            previous.map((item) => String(item._id))
          );

          const uniqueLogs = incomingLogs.filter(
            (item) =>
              !existingIds.has(String(item._id))
          );

          return [...previous, ...uniqueLogs];
        });

        if (payload.summary) {
          setSummary(payload.summary);
        }

        if (Array.isArray(payload.employees)) {
          setEmployees(payload.employees);
        }

        const pagination = payload.pagination || {};

        const moreAvailable =
          Number.isFinite(Number(pagination.totalPages)) &&
          pagination.totalPages != null
            ? page < Number(pagination.totalPages)
            : incomingLogs.length === BATCH_SIZE;

        pageRef.current = page;
        hasMoreRef.current = moreAvailable;
        setHasMore(moreAvailable);

        setError("");
      } catch (err) {
        if (
          err.name === "AbortError" ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setError(
          err.message ||
            "Something went wrong while loading activities."
        );
      } finally {
        if (
          requestVersion === requestVersionRef.current
        ) {
          loadingRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [buildParams, canLoad]
  );

  // ==========================================================
  // INITIAL FETCH / FILTER CHANGE / REFRESH
  // ==========================================================

  useEffect(() => {
    requestVersionRef.current += 1;

    controllerRef.current?.abort();

    loadingRef.current = false;
    pageRef.current = 1;
    hasMoreRef.current = false;

    setLogs([]);
    setHasMore(false);
    setError("");

    if (!canLoad) {
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    fetchLogs(1, false);

    return () => {
      controllerRef.current?.abort();
    };
  }, [fetchLogs, canLoad, refreshKey]);

  // ==========================================================
  // AUTOMATIC INFINITE SCROLL
  // ==========================================================

  useEffect(() => {
    const element = sentinelRef.current;

    if (
      !element ||
      !hasMore ||
      loading ||
      loadingMore ||
      !canLoad
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          hasMoreRef.current &&
          !loadingRef.current
        ) {
          fetchLogs(pageRef.current + 1, true);
        }
      },
      {
        rootMargin: "350px",
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    hasMore,
    loading,
    loadingMore,
    canLoad,
    fetchLogs,
    logs.length,
  ]);

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const resetFilters = () => {
    setFilters({ ...INITIAL_FILTERS });
    setRefreshKey((value) => value + 1);
  };

  const refreshLogs = () => {
    setRefreshKey((value) => value + 1);
  };

  const modules = summary.modules || {};

  const hasActiveFilters =
    filters.period !== "today" ||
    filters.module !== "all" ||
    filters.action !== "all" ||
    filters.employeeId !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F8F7FC] px-3 py-5 sm:px-5 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">
        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-[#EEEAFE] p-3 text-[#5949C6]">
              <Activity size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#211B45] sm:text-2xl lg:text-3xl">
                Employee Activity
              </h1>

              <p className="mt-1 text-xs leading-relaxed text-[#89849E] sm:text-sm">
                Monitor team activity across Stores, Coupons
                and Blogs. Search any item or view individual
                employee histories.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshLogs}
            disabled={loading || loadingMore}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2D2380] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4033A2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />

            Refresh Activity
          </button>
        </header>

        {/* ==================================================
            GLOBAL SEARCH
        ================================================== */}

        <ActivitySearch />

        {/* ==================================================
            FILTERS
        ================================================== */}

        <section className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Search
                size={17}
                className="text-[#6253C5]"
              />

              <h2 className="text-sm font-bold text-[#292346]">
                Filter Activities
              </h2>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#6253C5] hover:bg-[#F3F0FF]"
              >
                <FilterX size={15} />
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {/* DATE RANGE */}

            <div>
              <label
                htmlFor="activity-period"
                className="mb-1.5 block text-xs font-semibold text-[#77718E]"
              >
                Date Range
              </label>

              <select
                id="activity-period"
                value={filters.period}
                onChange={(e) =>
                  updateFilter("period", e.target.value)
                }
                className={SELECT_CLASS}
              >
                {PERIODS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* MODULE */}

            <div>
              <label
                htmlFor="activity-module"
                className="mb-1.5 block text-xs font-semibold text-[#77718E]"
              >
                Module
              </label>

              <select
                id="activity-module"
                value={filters.module}
                onChange={(e) =>
                  updateFilter("module", e.target.value)
                }
                className={SELECT_CLASS}
              >
                {MODULES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* ACTION */}

            <div>
              <label
                htmlFor="activity-action"
                className="mb-1.5 block text-xs font-semibold text-[#77718E]"
              >
                Action
              </label>

              <select
                id="activity-action"
                value={filters.action}
                onChange={(e) =>
                  updateFilter("action", e.target.value)
                }
                className={SELECT_CLASS}
              >
                {ACTIONS.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            {/* EMPLOYEE */}

            <div>
              <label
                htmlFor="activity-employee"
                className="mb-1.5 block text-xs font-semibold text-[#77718E]"
              >
                Employee
              </label>

              <select
                id="activity-employee"
                value={filters.employeeId}
                onChange={(e) =>
                  updateFilter("employeeId", e.target.value)
                }
                className={SELECT_CLASS}
              >
                <option value="">
                  All Employees
                </option>

                {employees
                  .filter((item) => item.employeeId)
                  .map((employee) => (
                    <option
                      key={employee.employeeId}
                      value={employee.employeeId}
                    >
                      {employee.name || employee.email}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* CUSTOM DATE RANGE */}

          {filters.period === "custom" && (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[#F0EDF7] pt-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="activity-from"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#77718E]"
                >
                  <CalendarDays size={13} />
                  From Date
                </label>

                <input
                  id="activity-from"
                  type="date"
                  value={filters.from}
                  max={filters.to || undefined}
                  onChange={(e) =>
                    updateFilter("from", e.target.value)
                  }
                  className={SELECT_CLASS}
                />
              </div>

              <div>
                <label
                  htmlFor="activity-to"
                  className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-[#77718E]"
                >
                  <CalendarDays size={13} />
                  To Date
                </label>

                <input
                  id="activity-to"
                  type="date"
                  value={filters.to}
                  min={filters.from || undefined}
                  onChange={(e) =>
                    updateFilter("to", e.target.value)
                  }
                  className={SELECT_CLASS}
                />
              </div>
            </div>
          )}

          {isCustomIncomplete && (
            <p className="mt-3 text-xs text-[#8B719B]">
              Select both dates to view custom-range
              activities.
            </p>
          )}

          {isInvalidRange && (
            <p className="mt-3 text-xs font-medium text-red-600">
              The end date cannot be earlier than the
              start date.
            </p>
          )}
        </section>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle
              size={18}
              className="shrink-0"
            />

            <span className="min-w-0 flex-1">
              {error}
            </span>

            <button
              type="button"
              onClick={refreshLogs}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* ==================================================
            STATISTICS
        ================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Activities"
            value={summary.total}
            icon={Activity}
            color="bg-[#F0EDFF] text-[#6253C5]"
          />

          <StatCard
            label="Store Activities"
            value={modules.store}
            icon={Store}
            color="bg-blue-50 text-blue-600"
          />

          <StatCard
            label="Coupon Activities"
            value={modules.coupon}
            icon={TicketPercent}
            color="bg-amber-50 text-amber-600"
          />

          <StatCard
            label="Blog Activities"
            value={modules.blog}
            icon={FileText}
            color="bg-violet-50 text-violet-600"
          />
        </section>

        {/* ==================================================
            EMPLOYEE PERFORMANCE
        ================================================== */}

        <EmployeePerformance
          employees={employees}
          loading={loading}
        />

        {/* ==================================================
            ACTIVITY HISTORY
        ================================================== */}

        <section className="overflow-hidden rounded-2xl border border-[#E8E6F3] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEAF6] px-4 py-4 sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#211B45]">
                  Activity History
                </h2>

                <ShieldCheck
                  size={17}
                  className="text-[#6253C5]"
                />
              </div>

              <p className="mt-1 text-xs text-[#89849E]">
                Latest employee actions, item histories
                and recorded changes
              </p>
            </div>

            <div className="rounded-lg bg-[#F5F3FB] px-3 py-1.5 text-xs font-semibold text-[#77718E]">
              {formatNumber(logs.length)} Loaded
            </div>
          </div>

          {/* LOADING */}

          {loading && logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-[#89849E]">
              <Loader2
                size={25}
                className="animate-spin text-[#6253C5]"
              />

              <p className="text-sm">
                Loading activities...
              </p>
            </div>
          ) : logs.length === 0 ? (
            /* EMPTY STATE */

            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="rounded-2xl bg-[#F4F1FF] p-4 text-[#6253C5]">
                <Activity size={27} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-[#292346]">
                No Activities Found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#89849E]">
                There are no activity records matching
                your selected filters.
              </p>
            </div>
          ) : (
            /* ACTIVITY LIST */

            <div className="divide-y divide-[#F0EDF7]">
              {logs.map((log) => (
                <ActivityItem
                  key={log._id}
                  log={log}
                />
              ))}
            </div>
          )}

          {/* AUTOMATIC INFINITE SCROLL */}

          {hasMore && (
            <div
              ref={sentinelRef}
              className="flex min-h-16 items-center justify-center border-t border-[#F0EDF7] p-4"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-xs font-medium text-[#89849E]">
                  <Loader2
                    size={16}
                    className="animate-spin text-[#6253C5]"
                  />

                  Loading more activities...
                </div>
              )}
            </div>
          )}

          {/* ALL LOADED */}

          {!hasMore &&
            logs.length > 0 &&
            !loading && (
              <div className="border-t border-[#F0EDF7] px-4 py-4 text-center">
                <p className="text-xs text-[#9893AB]">
                  All matching activities loaded
                </p>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}
