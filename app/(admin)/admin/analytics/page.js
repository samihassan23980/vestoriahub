"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  BarChart2,
  Globe,
  MonitorSmartphone,
  Link as LinkIcon,
  MousePointerClick,
  Eye,
  ArrowUpRight,
  Calendar,
  Filter,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react";

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("Last 30 Days");

  useEffect(() => {
    let isMounted = true;

    const fetchAnalyticsData = async () => {
      try {
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.details || json.error || "Failed to fetch analytics data",
          );
        }

        if (isMounted) {
          setData(json.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Analytics Fetch Error:", error);
        if (isMounted) {
          setIsLoading(false);
          Swal.fire({
            icon: "error",
            title: "Analytics Sync Failed",
            text: error.message,
            footer: "Check your database connection or server logs.",
            confirmButtonColor: "#2D2380",
            background: "#FFFFFF",
            color: "#1A1340",
            customClass: {
              popup: "rounded-xl border border-[#E0DEF5] shadow-2xl",
              confirmButton: "rounded-lg font-semibold px-6 py-2.5",
            },
          });
        }
      }
    };

    fetchAnalyticsData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case "mobile":
        return <MonitorSmartphone size={16} className="text-[#FF6B35]" />;
      case "tablet":
        return <MonitorSmartphone size={16} className="text-[#F4A836]" />;
      case "desktop":
        return <MonitorSmartphone size={16} className="text-[#2D2380]" />;
      default:
        return <MonitorSmartphone size={16} className="text-[#7775A0]" />;
    }
  };

  const formatEventType = (type) => {
    if (!type) return "Unknown Event";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "Yesterday";
    return `${days} days ago`;
  };

  // ─── LOADING & ERROR STATES ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#2D2380] animate-spin mb-4" />
        <h2 className="text-[#1A1340] font-semibold text-lg">
          Syncing Deep Analytics...
        </h2>
        <p className="text-[#7775A0] text-sm mt-1">
          Aggregating time-series and event data
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center p-6">
        <AlertCircle size={64} className="text-[#E24B4A] mb-4" />
        <h2 className="text-[#1A1340] font-bold text-2xl">Data Unavailable</h2>
        <p className="text-[#7775A0] mt-2 max-w-md text-center">
          We couldn't load the advanced analytics metrics. Please refresh the
          page or check your API connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#2D2380] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#4A3DBF] transition-colors"
        >
          Reload Analytics
        </button>
      </div>
    );
  }

  // ─── MAP API DATA TO UI STRUCTURE ────────────────────────────────────────

  const metrics = [
    {
      title: "Total Conversions (Redirects)",
      value: data.kpis.conversions.value,
      trend: data.kpis.conversions.trend,
      icon: MousePointerClick,
      color: "text-[#FF6B35]",
      bg: "bg-[#FF6B35]/10",
    },
    {
      title: "Total Views (Coupons & Blogs)",
      value: data.kpis.views.value,
      trend: data.kpis.views.trend,
      icon: Eye,
      color: "text-[#2D2380]",
      bg: "bg-[#2D2380]/10",
    },
    {
      title: "Top Traffic Source",
      value: data.kpis.topSource.value,
      trend: data.kpis.topSource.trend,
      icon: LinkIcon,
      color: "text-[#22B07D]",
      bg: "bg-[#22B07D]/10",
    },
    {
      title: "Primary Device",
      value: data.kpis.topDevice.value,
      trend: data.kpis.topDevice.trend,
      icon: MonitorSmartphone,
      color: "text-[#F4A836]",
      bg: "bg-[#F4A836]/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <BarChart2
                className="text-[#F4A836]"
                size={32}
                strokeWidth={2.5}
              />
              Traffic & Conversions
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Analyzing interaction events across coupons, stores, and blogs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors duration-150">
              <Calendar size={18} className="text-[#7775A0]" />
              {dateRange}
            </button>
            <button className="flex items-center gap-2 bg-white border-[1.5px] border-[#E0DEF5] text-[#1A1340] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors duration-150">
              <Filter size={18} className="text-[#7775A0]" />
              Filters
            </button>
            <button className="flex items-center gap-2 bg-[#2D2380] hover:bg-[#4A3DBF] text-white px-5 py-2.5 rounded-lg font-bold text-[14px] transition-colors duration-150 shadow-sm">
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] hover:shadow-[0_8px_24px_rgba(26,19,64,0.08)] hover:-translate-y-1 hover:border-[#4A3DBF] transition-all duration-200 ease-out cursor-default"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg}`}
                >
                  <kpi.icon size={24} className={kpi.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[#7775A0] text-[13px] font-medium truncate max-w-[140px]">
                    {kpi.title}
                  </p>
                  <h3 className="text-[#1A1340] text-[24px] font-bold mt-0.5 leading-none truncate max-w-[140px]">
                    {kpi.value}
                  </h3>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#E0DEF5] flex items-center justify-between">
                <span
                  className={`font-semibold text-[13px] flex items-center gap-1 ${
                    kpi.trend.includes("-")
                      ? "text-[#E24B4A]"
                      : "text-[#22B07D]"
                  }`}
                >
                  <ArrowUpRight size={16} /> {kpi.trend}
                </span>
                <span className="text-[#7775A0] text-[12px]">
                  {kpi.title.includes("Device") || kpi.title.includes("Traffic")
                    ? "overall metric"
                    : "vs prev 30 days"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts/Bars Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Breakdown (Based on eventType) */}
          <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] p-6">
            <h2 className="text-[18px] font-bold text-[#1A1340] mb-6">
              Interaction Events Breakdown
            </h2>
            <div className="space-y-5">
              {data.eventBreakdown.length > 0 ? (
                data.eventBreakdown.map((event, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#1A1340] font-semibold text-[14px]">
                        {formatEventType(event.label)}
                      </span>
                      <span className="text-[#7775A0] text-[13px] font-medium">
                        {event.count.toLocaleString()} ({event.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EEEDFE] rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full ${event.color || "bg-[#4A3DBF]"}`}
                        style={{ width: `${event.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#7775A0] py-8 text-[14px]">
                  No event data recorded for this period.
                </div>
              )}
            </div>
          </div>

          {/* Geo & Devices */}
          <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] p-6 flex flex-col">
            <h2 className="text-[18px] font-bold text-[#1A1340] mb-6 flex items-center gap-2">
              <Globe size={20} className="text-[#2D2380]" />
              Top Geographies
            </h2>
            <div className="space-y-4 flex-1">
              {data.geoData.length > 0 ? (
                data.geoData.map((geo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border border-[#E0DEF5] hover:border-[#4A3DBF] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#F7F6FF] text-[#1A1340] font-bold text-[12px] flex items-center justify-center border border-[#E0DEF5]">
                        {geo.country}
                      </div>
                      <span className="text-[#1A1340] font-semibold text-[14px]">
                        {geo.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[#7775A0] font-medium text-[14px]">
                        {geo.clicks}
                      </span>
                      <div className="w-16 bg-[#EEEDFE] rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div
                          className="bg-[#2D2380] h-1.5 rounded-full"
                          style={{ width: `${geo.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#7775A0] py-8 text-[14px]">
                  No geographic data recorded for this period.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Event Stream Table */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#E0DEF5] flex items-center justify-between">
            <div>
              <h2 className="text-[20px] font-semibold text-[#1A1340]">
                Event Log Stream
              </h2>
              <p className="text-[#7775A0] text-[13px] mt-0.5">
                Raw append-only logs from the AnalyticsEvent schema.
              </p>
            </div>
            <button className="text-[#2D2380] text-[14px] font-semibold hover:underline">
              View Full Log
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4">Event Type</th>
                  <th className="px-6 py-4">Target Entity</th>
                  <th className="px-6 py-4">Geo</th>
                  <th className="px-6 py-4">Device</th>
                  <th className="px-6 py-4">Referrer</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0DEF5]">
                {data.recentEvents.length > 0 ? (
                  data.recentEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-[#EEEDFE]/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-[#EEEDFE] text-[#2D2380] text-[11px] font-bold uppercase tracking-wider rounded-md">
                          {evt.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#1A1340] font-semibold text-[14px] truncate max-w-[200px] inline-block align-middle">
                          {evt.target}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#7775A0] font-medium text-[13px]">
                          {evt.country}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 capitalize text-[#7775A0] text-[13px] font-medium">
                          {getDeviceIcon(evt.device)}
                          {evt.device}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#7775A0] text-[13px] truncate max-w-[150px] inline-block align-middle">
                          {evt.referrer}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-[#7775A0] text-[13px] font-medium whitespace-nowrap">
                          {timeAgo(evt.time)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-[#7775A0]"
                    >
                      No events recorded in the current timeframe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
