"use client";

/**
 * Admin Analytics Dashboard
 * Data source: GET /api/admin/analytics?range=today|yesterday|7d|30d|90d&limit=N
 *
 * File layout (read top to bottom):
 *   1. Config + tiny helpers
 *   2. Hooks            useAnalytics (fetch), useNow (live "x min ago")
 *   3. UI blocks        KpiCard, Panel, BarRow, TrafficChart, TopList, EventLog
 *   4. AnalyticsView    the whole dashboard layout (pure: props in, JSX out)
 *   5. AnalyticsPage    default export = hook + view
 */

import React, { useEffect, useState } from "react";
import {
  BarChart2,
  Globe,
  Link as LinkIcon,
  MousePointerClick,
  Eye,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  MonitorSmartphone,
  Store,
  Ticket,
  Package,
  ShoppingBag,
  FileText,
  LayoutTemplate,
  Activity,
  CalendarClock,
} from "lucide-react";

// ─── 1. Config + helpers ─────────────────────────────────────────────────────

// "today" / "yesterday" are exact calendar days (hourly chart, day-over-day
// compare). 7d/30d/90d stay rolling windows, same as before.
const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
];

// How deep each "Top ..." panel goes. Once a site has real traffic, several
// coupons/stores land on the same click count — raise this to see past the
// first 5 instead of guessing who's tied.
const LIMIT_OPTIONS = [5, 10, 20, 50];

const CARD =
  "bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)]";

const num = (n) => Number(n || 0).toLocaleString();

const titleCase = (s) =>
  String(s || "Unknown")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

function timeAgo(dateString, now) {
  const s = Math.max(0, Math.floor((now - new Date(dateString).getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d} days ago`;
}

// meta.from / meta.to -> "Sep 26, 2026" (day mode) or "Sep 20 – Sep 26, 2026" (range mode)
function formatWindow(meta) {
  if (!meta?.from) return "";
  const fmt = (d) =>
    new Date(d).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: meta.timezone,
    });
  if (meta.mode === "day") return fmt(meta.from);
  const inclusiveTo = new Date(meta.to);
  inclusiveTo.setSeconds(inclusiveTo.getSeconds() - 1); // "to" is exclusive (now)
  return `${fmt(meta.from)} – ${fmt(inclusiveTo)}`;
}

// Trend strings from the API: "+12.3%", "-5.0%", "New", "N/A", "0%"
function trendMeta(trend = "") {
  if (trend.startsWith("-"))
    return { Icon: ArrowDownRight, cls: "text-[#E24B4A]" };
  if (trend.startsWith("+") || trend === "New")
    return { Icon: ArrowUpRight, cls: "text-[#22B07D]" };
  return { Icon: Minus, cls: "text-[#7775A0]" };
}

// "Nike · NIKE30 · 30% off"  (store first, so you see who the coupon belongs to)
function couponSub(c) {
  const discount =
    c.discountType === "percent"
      ? `${c.discountValue}% off`
      : c.discountType === "flat"
        ? `${c.discountValue} off`
        : c.discountType === "free_shipping"
          ? "Free shipping"
          : "";
  return [c.storeName, c.code || (c.type === "deal" ? "Deal" : ""), discount]
    .filter(Boolean)
    .join(" · ");
}

// One row per "Top ..." panel. `map` turns an API item into {id,name,sub,count}.
const TOP_LISTS = [
  {
    key: "stores",
    title: "Top Stores",
    unit: "visits",
    icon: Store,
    map: (s) => ({ id: s._id, name: s.name, sub: s.slug && `/${s.slug}`, count: s.count }),
  },
  {
    key: "storeClicks",
    title: "Top Stores by Clicks",
    unit: "clicks",
    icon: MousePointerClick,
    map: (s) => ({ id: s._id, name: s.name, sub: s.slug && `/${s.slug}`, count: s.count }),
  },
  {
    key: "coupons",
    title: "Top Coupons",
    unit: "clicks",
    icon: Ticket,
    map: (c) => ({ id: c._id, name: c.title, sub: couponSub(c), count: c.count }),
  },
  {
    key: "products",
    title: "Top Products",
    unit: "clicks",
    icon: Package,
    map: (p) => ({
      id: p._id,
      name: p.title,
      sub: [p.storeName, p.brandName || p.slug].filter(Boolean).join(" · "),
      count: p.count,
    }),
  },
  {
    key: "deals",
    title: "Top Amazon Deals",
    unit: "clicks",
    icon: ShoppingBag,
    map: (d) => ({
      id: d._id,
      name: d.title,
      sub: [d.storeName, d.slug].filter(Boolean).join(" · "),
      count: d.count,
    }),
  },
  {
    key: "blogs",
    title: "Top Blogs",
    unit: "views",
    icon: FileText,
    map: (b) => ({ id: b._id, name: b.title, sub: b.slug && `/${b.slug}`, count: b.count }),
  },
  {
    key: "embeds",
    title: "Top Blog Embeds",
    unit: "clicks",
    icon: LayoutTemplate,
    map: (e) => ({
      id: `${e.blogId}-${e.blockId}`,
      name: e.blockTitle || "Embedded block",
      sub: e.blogTitle,
      count: e.count,
    }),
  },
];

const DEVICE_ICONS = { mobile: Smartphone, tablet: Tablet, desktop: Monitor };
const DeviceIcon = ({ device, size = 16, className = "text-[#7775A0]" }) => {
  const Icon = DEVICE_ICONS[String(device).toLowerCase()] || MonitorSmartphone;
  return <Icon size={size} className={className} />;
};

// Download the time series as CSV (bucket, total, one column per event type).
function exportCsv(data, rangeValue) {
  const series = data.timeSeries || [];
  const types = Object.keys(series[0] || {}).filter(
    (k) => !["key", "label", "total"].includes(k),
  );
  const header = ["bucket", "total", ...types];
  const rows = series.map((row) => header.map((h) => (h === "bucket" ? row.key : row[h] ?? 0)));
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `analytics-${rangeValue}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── 2. Hooks ────────────────────────────────────────────────────────────────

/** Fetches analytics for a range + limit. Keeps the old data on screen while reloading. */
function useAnalytics(range, limit) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    (async () => {
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}&limit=${limit}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.details || json.error || `Request failed (${res.status})`);
        }
        setState({ data: json.data, loading: false, error: null });
      } catch (err) {
        if (err.name === "AbortError") return; // range/limit changed or page left
        console.error("Analytics fetch error:", err);
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    })();

    return () => controller.abort();
  }, [range, limit, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}

/** Re-renders every `ms` so "3 mins ago" stays fresh. */
function useNow(ms = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

// ─── 3. UI blocks ────────────────────────────────────────────────────────────

function Panel({ title, icon: Icon, right, className = "", children }) {
  return (
    <section className={`${CARD} p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-[18px] font-bold text-[#1A1340] flex items-center gap-2 min-w-0">
          {Icon && <Icon size={20} className="text-[#2D2380] shrink-0" />}
          <span className="truncate">{title}</span>
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const Empty = ({ text }) => (
  <div className="text-center text-[#7775A0] py-8 text-[14px]">{text}</div>
);

/** label + value + progress bar (used by breakdown, devices, referrers, top lists) */
function BarRow({ label, sub, value, percent, barClass = "bg-[#4A3DBF]", icon }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <p className="text-[#1A1340] font-semibold text-[14px] truncate" title={label}>
              {label}
            </p>
            {sub ? (
              <p className="text-[#7775A0] text-[12px] truncate" title={sub}>
                {sub}
              </p>
            ) : null}
          </div>
        </div>
        <span className="text-[#7775A0] text-[13px] font-medium whitespace-nowrap">
          {value}
        </span>
      </div>
      <div className="w-full bg-[#EEEDFE] rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, color, bg, trend, note }) {
  const t = trend !== undefined ? trendMeta(trend) : null;
  return (
    <div className={`${CARD} p-5 hover:shadow-[0_8px_24px_rgba(26,19,64,0.08)] hover:-translate-y-0.5 hover:border-[#4A3DBF] transition-all duration-200`}>
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
          <Icon size={22} className={color} />
        </div>
        <div className="min-w-0">
          <p className="text-[#7775A0] text-[13px] font-medium truncate" title={title}>
            {title}
          </p>
          <h3 className="text-[#1A1340] text-[24px] font-bold mt-0.5 leading-none truncate" title={String(value)}>
            {value}
          </h3>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-[#E0DEF5] flex items-center justify-between gap-2 text-[12px]">
        {t ? (
          <span className={`font-semibold text-[13px] flex items-center gap-1 ${t.cls}`}>
            <t.Icon size={16} /> {trend}
          </span>
        ) : null}
        <span className="text-[#7775A0] truncate">{note}</span>
      </div>
    </div>
  );
}

/**
 * Dependency-free SVG area chart with a hover tooltip. Works for both daily
 * buckets (rolling ranges) and hourly buckets (Today / Yesterday) — the API
 * always sends a ready-to-display `label` per point, so this component never
 * needs to know which mode it's in.
 */
function TrafficChart({ series, emptyText }) {
  const [hover, setHover] = useState(null);
  const W = 800;
  const H = 220;
  const pad = { t: 12, r: 12, b: 26, l: 40 };
  const innerW = W - pad.l - pad.r;

  const max = Math.max(1, ...series.map((d) => d.total));
  const x = (i) => pad.l + (series.length <= 1 ? 0 : (i / (series.length - 1)) * innerW);
  const y = (v) => pad.t + (1 - v / max) * (H - pad.t - pad.b);

  if (!series.length || series.every((d) => d.total === 0)) {
    return <Empty text={emptyText || "No events recorded for this period."} />;
  }

  const line = series
    .map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(series.length - 1).toFixed(1)},${H - pad.b} L${x(0).toFixed(1)},${H - pad.b} Z`;
  // Set() removes duplicates: with a tiny max (e.g. 1) several fractions round
  // to the same number, which would create duplicate React keys.
  const gridValues = [
    ...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))),
  ];
  const labelIdx = [0, Math.floor((series.length - 1) / 2), series.length - 1];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.l) / innerW) * (series.length - 1));
    setHover(Math.max(0, Math.min(series.length - 1, i)));
  };

  const point = hover !== null ? series[hover] : null;
  const breakdown = point
    ? Object.entries(point).filter(
        ([k, v]) => !["key", "label", "total"].includes(k) && v > 0,
      )
    : [];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Events over time"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A3DBF" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4A3DBF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridValues.map((v) => (
          <g key={v}>
            <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#E0DEF5" strokeDasharray="3 4" />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7775A0">
              {num(v)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#trafficFill)" />
        <path d={line} fill="none" stroke="#2D2380" strokeWidth="2.5" strokeLinejoin="round" />

        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"} fontSize="11" fill="#7775A0">
            {series[i].label}
          </text>
        ))}

        {point && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#4A3DBF" strokeOpacity="0.4" />
            <circle cx={x(hover)} cy={y(point.total)} r="5" fill="#2D2380" stroke="#fff" strokeWidth="2" />
          </g>
        )}
      </svg>

      {point && (
        <div
          className="absolute top-2 pointer-events-none bg-[#1A1340] text-white text-[12px] rounded-lg px-3 py-2 shadow-lg min-w-[150px]"
          style={{
            left: `${(x(hover) / W) * 100}%`,
            transform: hover > series.length / 2 ? "translateX(-105%)" : "translateX(8px)",
          }}
        >
          <p className="font-bold mb-1">{point.label}</p>
          <p className="mb-1">{num(point.total)} events</p>
          {breakdown.map(([type, count]) => (
            <p key={type} className="flex justify-between gap-4 text-white/75">
              <span>{titleCase(type)}</span>
              <span>{num(count)}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/** A "Top ..." panel with visible rank numbers, so ties past #1 are still legible. */
function TopList({ config, items }) {
  const { title, unit, icon, map } = config;
  const rows = (items || []).map(map);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Panel title={title} icon={icon}>
      {rows.length === 0 ? (
        <Empty text={`No ${unit} recorded yet.`} />
      ) : (
        <div className="space-y-4">
          {rows.map((r, idx) => (
            <div key={r.id || idx} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[#EEEDFE] text-[#2D2380] text-[10px] font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <BarRow
                  label={r.name || "Untitled"}
                  sub={r.sub}
                  value={`${num(r.count)} ${unit}`}
                  percent={(r.count / max) * 100}
                  barClass="bg-[#2D2380]"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function EventLog({ events, colorByType, now }) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-6 py-5 border-b border-[#E0DEF5]">
        <h2 className="text-[20px] font-semibold text-[#1A1340]">Latest Events</h2>
        <p className="text-[#7775A0] text-[13px] mt-0.5">
          The 15 most recent interactions recorded in the selected period.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
              {["Event", "Target", "Store", "Geo", "Device", "Referrer", "Time"].map((h, i) => (
                <th key={h} className={`px-6 py-4 ${i === 6 ? "text-right" : ""}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E0DEF5]">
            {events.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-[#7775A0]">
                  No events recorded in the current timeframe.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#EEEDFE]/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wider rounded-md whitespace-nowrap">
                      <span className={`w-2 h-2 rounded-full ${colorByType[evt.type] || "bg-[#7775A0]"}`} />
                      {evt.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#1A1340] font-semibold text-[14px] truncate max-w-[220px] inline-block align-middle" title={evt.target}>
                      {evt.target}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#7775A0] text-[13px]">{evt.store || "—"}</td>
                  <td className="px-6 py-4 text-[#7775A0] font-medium text-[13px]">{evt.country}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 capitalize text-[#7775A0] text-[13px] font-medium">
                      <DeviceIcon device={evt.device} />
                      {evt.device}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#7775A0] text-[13px] truncate max-w-[150px] inline-block align-middle" title={evt.referrer}>
                      {evt.referrer}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-[#7775A0] text-[13px] font-medium whitespace-nowrap">
                    {timeAgo(evt.time, now)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── 4. The dashboard layout ─────────────────────────────────────────────────

function AnalyticsView({ data, range, setRange, limit, setLimit, loading, error, reload }) {
  const now = useNow();
  const { meta, kpis } = data;
  const compareNote = meta?.comparesToPrevious
    ? meta.compareLabel
    : "no earlier period to compare";
  const chartEmptyText =
    meta?.mode === "day"
      ? `No events recorded ${meta.label.toLowerCase()} yet.`
      : "No events recorded for this period.";

  const colorByType = Object.fromEntries(
    data.eventBreakdown.map((e) => [e.label, e.color]),
  );
  const deviceTotal = data.deviceBreakdown.reduce((s, d) => s + d.count, 0);
  const referrerMax = Math.max(1, ...data.topReferrers.map((r) => r.count));
  const tops = data.tops || {};

  const cards = [
    { title: "Conversions (Click-outs)", value: kpis.conversions.value, trend: kpis.conversions.trend, note: compareNote, icon: MousePointerClick, color: "text-[#FF6B35]", bg: "bg-[#FF6B35]/10" },
    { title: "Total Views", value: kpis.views.value, trend: kpis.views.trend, note: compareNote, icon: Eye, color: "text-[#2D2380]", bg: "bg-[#2D2380]/10" },
    { title: "Unique Visitors", value: num(data.uniqueVisitors), note: "anonymous sessions", icon: Users, color: "text-[#0EA5E9]", bg: "bg-[#0EA5E9]/10" },
    { title: "Top Traffic Source", value: kpis.topSource.value, note: kpis.topSource.trend, icon: LinkIcon, color: "text-[#22B07D]", bg: "bg-[#22B07D]/10" },
    { title: "Primary Device", value: kpis.topDevice.value, note: kpis.topDevice.trend, icon: MonitorSmartphone, color: "text-[#F4A836]", bg: "bg-[#F4A836]/10" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className={`max-w-[1280px] mx-auto space-y-8 transition-opacity ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <BarChart2 className="text-[#F4A836]" size={32} strokeWidth={2.5} />
              Traffic & Conversions
            </h1>
            <p className="text-[#7775A0] text-[15px] mt-1">
              Interactions across coupons, stores, products and blogs. Data is kept{" "}
              {meta?.retentionDays ?? 90} days; times are in {meta?.timezone || "UTC"}.
            </p>
            <p className="text-[#4A3DBF] text-[13px] font-semibold mt-1 flex items-center gap-1.5">
              <CalendarClock size={14} />
              Showing {meta?.label} · {formatWindow(meta)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap bg-white border-[1.5px] border-[#E0DEF5] rounded-lg p-1" role="group" aria-label="Date range">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={range === r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-3.5 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${
                    range === r.value ? "bg-[#2D2380] text-white" : "text-[#1A1340] hover:bg-[#EEEDFE]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg px-3 py-1.5">
              <span className="text-[12px] font-semibold text-[#7775A0] whitespace-nowrap">
                Show top
              </span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-transparent text-[#1A1340] text-[13px] font-bold focus:outline-none cursor-pointer"
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => exportCsv(data, range)}
              className="flex items-center gap-2 bg-[#2D2380] hover:bg-[#4A3DBF] text-white px-5 py-2.5 rounded-lg font-bold text-[14px] transition-colors shadow-sm"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Refresh error (old data stays visible) */}
        {error && (
          <div role="alert" className="flex items-center gap-3 bg-[#FDECEC] border border-[#F5C2C1] text-[#8A1F1E] rounded-lg px-4 py-3 text-[14px]">
            <AlertCircle size={18} className="shrink-0" />
            <span className="flex-1">Could not refresh: {error}</span>
            <button type="button" onClick={reload} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {cards.map((c) => (
            <KpiCard key={c.title} {...c} />
          ))}
        </div>

        {/* Trend chart — hourly for Today/Yesterday, daily for rolling ranges */}
        <Panel title={meta?.granularity === "hour" ? "Events by Hour" : "Events per Day"} icon={Activity}>
          <TrafficChart series={data.timeSeries || []} emptyText={chartEmptyText} />
        </Panel>

        {/* Breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Panel title="Interaction Events Breakdown">
            {data.eventBreakdown.length === 0 ? (
              <Empty text="No event data recorded for this period." />
            ) : (
              <div className="space-y-5">
                {data.eventBreakdown.map((e) => (
                  <BarRow
                    key={e.label}
                    label={titleCase(e.label)}
                    value={`${num(e.count)} (${e.percentage}%)`}
                    percent={e.percentage}
                    barClass={e.color || "bg-[#4A3DBF]"}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Top Geographies" icon={Globe}>
            {data.geoData.length === 0 ? (
              <Empty text="No geographic data recorded for this period." />
            ) : (
              <div className="space-y-4">
                {data.geoData.map((g) => (
                  <BarRow
                    key={g.country}
                    label={g.name}
                    sub={g.country}
                    value={`${num(g.count ?? g.clicks)} events`}
                    percent={g.percentage}
                    barClass="bg-[#2D2380]"
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Traffic Sources" icon={LinkIcon}>
            {data.topReferrers.length === 0 ? (
              <Empty text="No referrer data recorded for this period." />
            ) : (
              <div className="space-y-4">
                {data.topReferrers.map((r) => (
                  <BarRow
                    key={r.domain}
                    label={r.domain}
                    value={`${num(r.count)} landings`}
                    percent={(r.count / referrerMax) * 100}
                    barClass={r.domain === "Direct" ? "bg-[#7775A0]" : "bg-[#22B07D]"}
                  />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Devices" icon={MonitorSmartphone}>
            {data.deviceBreakdown.length === 0 ? (
              <Empty text="No device data recorded for this period." />
            ) : (
              <div className="space-y-4">
                {data.deviceBreakdown.map((d) => (
                  <BarRow
                    key={d.device}
                    icon={<DeviceIcon device={d.device} className="text-[#2D2380]" />}
                    label={titleCase(d.device)}
                    value={`${num(d.count)} (${deviceTotal ? Math.round((d.count / deviceTotal) * 100) : 0}%)`}
                    percent={deviceTotal ? (d.count / deviceTotal) * 100 : 0}
                    barClass="bg-[#F4A836]"
                  />
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Top performers */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {TOP_LISTS.map((cfg) => (
            <TopList key={cfg.key} config={cfg} items={tops[cfg.key]} />
          ))}
        </div>

        <EventLog events={data.recentEvents} colorByType={colorByType} now={now} />
      </div>
    </div>
  );
}

// ─── 5. Page (data + states) ─────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [range, setRange] = useState("today");
  const [limit, setLimit] = useState(10);
  const { data, loading, error, reload } = useAnalytics(range, limit);

  // First load only. Later range/limit changes keep the old data visible (dimmed).
  if (!data && loading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#2D2380] animate-spin mb-4" />
        <h2 className="text-[#1A1340] font-semibold text-lg">Syncing Analytics...</h2>
        <p className="text-[#7775A0] text-sm mt-1">Aggregating events</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center p-6">
        <AlertCircle size={64} className="text-[#E24B4A] mb-4" />
        <h2 className="text-[#1A1340] font-bold text-2xl">Data Unavailable</h2>
        <p className="text-[#7775A0] mt-2 max-w-md text-center">
          {error || "We couldn't load the analytics metrics."} Check your API
          connection and server logs, then try again.
        </p>
        <button
          type="button"
          onClick={reload}
          className="mt-6 bg-[#2D2380] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#4A3DBF] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <AnalyticsView
      data={data}
      range={range}
      setRange={setRange}
      limit={limit}
      setLimit={setLimit}
      loading={loading}
      error={error}
      reload={reload}
    />
  );
}