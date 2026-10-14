
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";

import {
  Search,
  Store,
  TicketPercent,
  FileText,
  Loader2,
  X,
  ArrowUpRight,
} from "lucide-react";

function ResultIcon({ module }) {
  if (module === "store") return <Store size={17} />;
  if (module === "coupon") return <TicketPercent size={17} />;
  return <FileText size={17} />;
}

export default function ActivitySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    requestRef.current += 1;
    const requestId = requestRef.current;

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/admin/activity-logs/search?q=${encodeURIComponent(
            trimmed
          )}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Search failed.");
        }

        if (requestId === requestRef.current) {
          setResults(data.results || []);
        }
      } catch (err) {
        if (
          err.name !== "AbortError" &&
          requestId === requestRef.current
        ) {
          setError(err.message || "Search failed.");
        }
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <section className="rounded-2xl border border-[#E8E6F3] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-[#292346]">
          Search Activity History
        </h2>

        <p className="mt-1 text-xs text-[#89849E]">
          Find a Store, Coupon or Blog and open its activity history.
        </p>
      </div>

      <div className="relative">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-3.5 text-[#89849E]"
        />

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search store, coupon or blog name..."
          className="h-12 w-full rounded-xl border border-[#E5E3F3] bg-[#FCFBFF] pl-11 pr-12 text-sm text-[#292346] outline-none transition focus:border-[#6253C5] focus:ring-2 focus:ring-[#6253C5]/10"
        />

        {loading ? (
          <Loader2
            size={17}
            className="absolute right-4 top-4 animate-spin text-[#6253C5]"
          />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-3 rounded-lg p-1 text-[#89849E] hover:bg-[#F0EDFF]"
          >
            <X size={17} />
          </button>
        ) : null}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          {error}
        </p>
      )}

      {query.trim().length >= 2 && (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#EEEAF6]">
          {results.length === 0 && !loading ? (
            <p className="p-5 text-center text-xs text-[#89849E]">
              No matching activity history found.
            </p>
          ) : (
            <div className="divide-y divide-[#F0EDF7]">
              {results.map((result) => (
                <Link
                  key={`${result.module}-${result.targetId}`}
                  href={`/admin/activity-logs/targets/${encodeURIComponent(
                    result.module
                  )}/${encodeURIComponent(result.targetId)}`}
                  className="flex items-center gap-3 p-3.5 transition hover:bg-[#F8F6FF]"
                >
                  <div className="rounded-lg bg-[#F0EDFF] p-2.5 text-[#6253C5]">
                    <ResultIcon module={result.module} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#292346]">
                      {result.name}
                    </p>

                    <p className="mt-1 truncate text-xs text-[#89849E]">
                      {result.module}
                      {result.slug ? ` • ${result.slug}` : ""}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-[#89849E]"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
