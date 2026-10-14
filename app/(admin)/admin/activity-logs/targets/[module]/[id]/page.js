
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Activity,
  ArrowRight,
  ChevronDown,
  Clock3,
  Loader2,
  RefreshCw,
} from "lucide-react";

function displayDate(value) {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function displayValue(value) {
  if (value == null || value === "") return "(empty)";

  return typeof value === "object"
    ? JSON.stringify(value)
    : String(value);
}

function HistoryItem({ log }) {
  const [expanded, setExpanded] = useState(false);

  const changes = Array.isArray(log.changes)
    ? log.changes
    : [];

  return (
    <article className="border-b border-[#EEEAF6] p-4 last:border-b-0 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-[#F0EDFF] px-2.5 py-1 text-xs font-bold capitalize text-[#6253C5]">
          {log.action}
        </span>

        <span className="text-xs text-[#89849E]">
          {displayDate(log.occurredAt)}
        </span>
      </div>

      <div className="mt-3">
        {log.actorId ? (
          <Link
            href={`/admin/activity-logs/${encodeURIComponent(
              String(log.actorId)
            )}`}
            className="font-bold text-[#292346] hover:text-[#6253C5] hover:underline"
          >
            {log.actorName || "Unknown Employee"}
          </Link>
        ) : (
          <span className="font-bold text-[#292346]">
            {log.actorName || "Unknown Employee"}
          </span>
        )}

        <p className="mt-1 text-xs text-[#89849E]">
          {log.actorEmail || ""}
          {log.actorRole ? ` • ${log.actorRole}` : ""}
        </p>
      </div>

      <p className="mt-3 break-words text-sm text-[#514B69]">
        {log.targetName}
      </p>

      {changes.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8E6F3] px-3 py-2 text-xs font-semibold text-[#6253C5]"
          >
            {expanded ? "Hide Changes" : "View Changes"}
            ({changes.length})
            <ChevronDown
              size={14}
              className={expanded ? "rotate-180" : ""}
            />
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {changes.map((change, index) => (
                <div
                  key={`${change.field}-${index}`}
                  className="rounded-xl border border-[#EEEAF6] bg-[#FAF9FF] p-3"
                >
                  <p className="mb-2 text-xs font-bold text-[#292346]">
                    {change.field}
                  </p>

                  <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                    <div className="min-w-0 rounded-lg bg-red-50 p-3">
                      <p className="mb-1 text-[10px] font-bold text-red-500">
                        BEFORE
                      </p>
                      <p className="break-all text-xs text-red-800">
                        {displayValue(change.oldValue)}
                      </p>
                    </div>

                    <ArrowRight
                      size={16}
                      className="rotate-90 justify-self-center text-[#89849E] sm:rotate-0"
                    />

                    <div className="min-w-0 rounded-lg bg-green-50 p-3">
                      <p className="mb-1 text-[10px] font-bold text-green-600">
                        AFTER
                      </p>
                      <p className="break-all text-xs text-green-800">
                        {displayValue(change.newValue)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function TargetActivityPage() {
  const params = useParams();

  const module = String(params?.module || "");
  const id = String(params?.id || "");

  const [target, setTarget] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    actions: {},
  });

  const [logs, setLogs] = useState([]);
  const [action, setAction] = useState("all");

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const cursorRef = useRef(null);
  const busyRef = useRef(false);
  const versionRef = useRef(0);
  const controllerRef = useRef(null);
  const sentinelRef = useRef(null);

  const load = useCallback(
    async (append = false) => {
      if (!module || !id || busyRef.current) return;

      busyRef.current = true;

      const version = versionRef.current;
      const controller = new AbortController();

      controllerRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const query = new URLSearchParams({ action });

        if (append && cursorRef.current) {
          query.set("cursor", cursorRef.current);
        }

        const response = await fetch(
          `/api/admin/activity-logs/targets/${encodeURIComponent(
            module
          )}/${encodeURIComponent(id)}?${query}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || "Unable to load activity history."
          );
        }

        if (
          controller.signal.aborted ||
          version !== versionRef.current
        ) {
          return;
        }

        setTarget(data.target);
        setSummary(data.summary || { total: 0, actions: {} });

        setLogs((previous) => {
          if (!append) return data.logs || [];

          const existing = new Set(
            previous.map((log) => String(log._id))
          );

          return [
            ...previous,
            ...(data.logs || []).filter(
              (log) => !existing.has(String(log._id))
            ),
          ];
        });

        cursorRef.current = data.nextCursor || null;
        setHasMore(Boolean(data.hasMore));
        setError("");
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          version === versionRef.current
        ) {
          setError(err.message || "Unable to load activity.");
        }
      } finally {
        if (version === versionRef.current) {
          busyRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [module, id, action]
  );

  useEffect(() => {
    versionRef.current += 1;
    controllerRef.current?.abort();

    busyRef.current = false;
    cursorRef.current = null;

    setLogs([]);
    setHasMore(false);
    setError("");

    load(false);

    return () => controllerRef.current?.abort();
  }, [load, refreshKey]);

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element || !hasMore || loading || loadingMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !busyRef.current) {
          load(true);
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, load, logs.length]);

  return (
    <main className="min-h-screen bg-[#F8F7FC] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/activity-logs"
            className="inline-flex items-center gap-2 rounded-xl border border-[#E8E6F3] bg-white px-4 py-2.5 text-sm font-semibold text-[#6253C5]"
          >
            <ArrowLeft size={16} />
            Back to Activity
          </Link>

          <button
            type="button"
            onClick={() => setRefreshKey((v) => v + 1)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D2380] px-4 py-2.5 text-sm font-semibold text-white"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        <section className="rounded-2xl border border-[#E8E6F3] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6253C5]">
            {target?.module || module} Activity History
          </p>

          <h1 className="mt-2 break-words text-xl font-bold text-[#211B45] sm:text-2xl">
            {target?.name || "Loading Activity..."}
          </h1>

          {target?.slug && (
            <p className="mt-2 break-all text-xs text-[#89849E]">
              {target.slug}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Activity size={18} className="text-[#6253C5]" />

            <span className="text-sm font-semibold text-[#514B69]">
              {Number(summary.total || 0).toLocaleString()}
              {" "}Matching Activities
            </span>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm">
          <label className="mb-2 block text-xs font-semibold text-[#77718E]">
            Filter by Action
          </label>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-11 w-full rounded-xl border border-[#E8E6F3] bg-white px-3 text-sm sm:max-w-xs"
          >
            <option value="all">All Actions</option>
            <option value="created">Created</option>
            <option value="updated">Updated</option>
            <option value="deleted">Deleted</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </section>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-[#E8E6F3] bg-white shadow-sm">
          <div className="border-b border-[#EEEAF6] p-5">
            <h2 className="text-base font-bold text-[#211B45]">
              Complete Available History
            </h2>
            <p className="mt-1 text-xs text-[#89849E]">
              Employee actions, timestamps and recorded changes
            </p>
          </div>

          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center gap-3 p-12 text-sm text-[#89849E]">
              <Loader2 size={20} className="animate-spin" />
              Loading history...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#89849E]">
              No matching activity found.
            </div>
          ) : (
            logs.map((log) => (
              <HistoryItem key={log._id} log={log} />
            ))
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
        </section>
      </div>
    </main>
  );
}
