"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Tag,
  Store,
  FileText,
  MousePointerClick,
  ArrowUpRight,
  Plus,
  MoreVertical,
  Box,
  AlertCircle,
  Loader2,
  BarChart3,
  ShieldAlert,
  Globe,
  Eye,
  Calendar,
} from "lucide-react";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.details || json.error || "Failed to fetch dashboard data",
          );
        }

        if (isMounted) {
          setData(json.data);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        if (isMounted) {
          setIsLoading(false);
          Swal.fire({
            icon: "error",
            title: "Sync Failed",
            text: error.message,
            footer: "Check your database connection or server logs.",
            confirmButtonColor: "#2D2380",
            background: "#FFFFFF",
            color: "#1A1340",
            customClass: {
              popup: "rounded-xl border border-[#E0DEF5] shadow-xl",
              confirmButton: "rounded-lg font-semibold px-6 py-2.5",
            },
          });
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-3 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md">
            Active
          </span>
        );
      case "expired":
        return (
          <span className="px-3 py-1 bg-[#E24B4A]/15 text-[#E24B4A] text-[11px] font-bold uppercase tracking-wider rounded-md">
            Expired
          </span>
        );
      case "inactive":
      case "draft":
        return (
          <span className="px-3 py-1 bg-[#F4A836]/15 text-[#F4A836] text-[11px] font-bold uppercase tracking-wider rounded-md">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md">
            {status}
          </span>
        );
    }
  };

  const formatDiscount = (type, value) => {
    if (type === "percent") return `${value}% OFF`;
    if (type === "flat") return `$${value} OFF`;
    if (type === "free_shipping") return "Free Shipping";
    return `${value}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-[#2D2380] animate-spin mb-4" />
        <h2 className="text-[#1A1340] font-semibold text-lg">
          Syncing Dashboard...
        </h2>
        <p className="text-[#7775A0] text-sm mt-1">
          Fetching metrics, firewalls, and networks
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
          We couldn't load the complete dashboard metrics. Please refresh the
          page or check your API connection.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 bg-[#2D2380] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#4A3DBF] transition-colors"
        >
          Reload Dashboard
        </button>
      </div>
    );
  }

  // ─── MAP ALL API DATA TO KPIS ───────────────────────────────────────────
  const totalClicks =
    (data.analytics?.events?.coupon_click || 0) +
    (data.analytics?.events?.amazon_deal_click || 0);

  const kpis = [
    {
      title: "Active Stores",
      value: data.metrics.stores.active.toLocaleString(),
      trend: `Out of ${data.metrics.stores.total.toLocaleString()} Total`,
      icon: Store,
      color: "text-[#2D2380]",
      bg: "bg-[#2D2380]/10",
    },
    {
      title: "Active Coupons",
      value: data.metrics.coupons.active.toLocaleString(),
      trend: `Out of ${data.metrics.coupons.total.toLocaleString()} Total`,
      icon: Tag,
      color: "text-[#F4A836]",
      bg: "bg-[#F4A836]/10",
    },
    {
      title: "Published Blogs",
      value: data.metrics.blogs.published.toLocaleString(),
      trend: "Live Editorials",
      icon: FileText,
      color: "text-[#FF6B35]",
      bg: "bg-[#FF6B35]/10",
    },
    {
      title: "Affiliate Products",
      value: data.metrics.products.total.toLocaleString(),
      trend: "Curated Items",
      icon: Box,
      color: "text-[#22B07D]",
      bg: "bg-[#22B07D]/10",
    },
    {
      title: "Active Networks",
      value: data.metrics.networks.active.toLocaleString(),
      trend: "Affiliate Partners",
      icon: Globe,
      color: "text-[#4A3DBF]",
      bg: "bg-[#4A3DBF]/10",
    },
    {
      title: "Firewall Rules",
      value: data.metrics.security.activeFirewallRules.toLocaleString(),
      trend: "Active Protections",
      icon: ShieldAlert,
      color: "text-[#E24B4A]",
      bg: "bg-[#E24B4A]/10",
    },
    {
      title: "Total Deal Clicks",
      value: totalClicks.toLocaleString(),
      trend: "Last 30 Days",
      icon: MousePointerClick,
      color: "text-[#F4A836]",
      bg: "bg-[#F4A836]/10",
    },
    {
      title: "Outbound Redirects",
      value: (data.analytics?.events?.outbound_redirect || 0).toLocaleString(),
      trend: "Last 30 Days",
      icon: ArrowUpRight,
      color: "text-[#22B07D]",
      bg: "bg-[#22B07D]/10",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight">
                Dashboard Overview
              </h1>
              {data.system.maintenanceMode && (
                <span className="bg-[#E24B4A] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Maintenance Mode
                </span>
              )}
            </div>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Welcome back to {data.system.siteName}! Here is the complete
              platform telemetry.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-transparent border-[2px] border-[#2D2380] text-[#2D2380] hover:bg-[#EEEDFE] px-5 py-2.5 rounded-lg font-semibold text-[15px] transition-colors duration-150 ease-out">
              Download Report
            </button>
            <button className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-5 py-2.5 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150 ease-out">
              <Plus size={18} strokeWidth={2.5} />
              New Content
            </button>
          </div>
        </div>

        {/* 8-Grid KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((kpi, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E0DEF5] rounded-xl p-5 shadow-[0_2px_12px_rgba(26,19,64,0.04)] hover:shadow-[0_8px_24px_rgba(26,19,64,0.08)] hover:-translate-y-1 hover:border-[#4A3DBF] transition-all duration-200 ease-out cursor-default"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${kpi.bg}`}
                >
                  <kpi.icon size={24} className={kpi.color} strokeWidth={2} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[#7775A0] text-[14px] font-medium">
                  {kpi.title}
                </p>
                <h3 className="text-[#1A1340] text-[28px] font-bold mt-1 leading-none">
                  {kpi.value}
                </h3>
                <p className="text-[#7775A0] text-[12px] font-medium mt-2 bg-[#F7F6FF] inline-block px-2 py-0.5 rounded border border-[#E0DEF5]">
                  {kpi.trend}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column (Spans 2/3) - Data Tables (Coupons & Blogs) */}
          <div className="xl:col-span-2 space-y-8">
            {/* Table 1: Recent Coupons */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E0DEF5] flex items-center justify-between bg-white">
                <h2 className="text-[20px] font-semibold text-[#1A1340]">
                  Recently Added Coupons
                </h2>
                <button className="text-[#2D2380] text-[14px] font-semibold hover:underline">
                  View All Coupons
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F6FF] text-[#7775A0] text-[13px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                      <th className="px-6 py-4">Deal Title</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Discount</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DEF5]">
                    {data.recentActivity.coupons.length > 0 ? (
                      data.recentActivity.coupons.map((coupon) => (
                        <tr
                          key={coupon._id}
                          className="hover:bg-[#EEEDFE]/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-[#1A1340] font-bold text-[15px] max-w-[280px] truncate">
                              {coupon.title}
                            </p>
                            <p className="text-[#7775A0] text-[13px] mt-0.5 font-mono">
                              {coupon.code ? `CODE: ${coupon.code}` : "NO CODE"}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[#1A1340] font-medium bg-[#F7F6FF] px-3 py-1.5 rounded-md border border-[#E0DEF5] text-[12px] capitalize">
                              {coupon.type.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[#F4A836] font-bold text-[15px]">
                              {formatDiscount(
                                coupon.discountType,
                                coupon.discountValue,
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-[#7775A0] hover:text-[#2D2380] p-2 rounded-md hover:bg-[#EEEDFE]">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-8 text-center text-[#7775A0]"
                        >
                          No recent coupons found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Recent Blogs */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
              <div className="px-6 py-5 border-b border-[#E0DEF5] flex items-center justify-between bg-white">
                <h2 className="text-[20px] font-semibold text-[#1A1340] flex items-center gap-2">
                  Recently Published Blogs
                </h2>
                <button className="text-[#2D2380] text-[14px] font-semibold hover:underline">
                  View All Blogs
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F6FF] text-[#7775A0] text-[13px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                      <th className="px-6 py-4">Article Title</th>
                      <th className="px-6 py-4">Published Date</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0DEF5]">
                    {data.recentActivity.blogs.length > 0 ? (
                      data.recentActivity.blogs.map((blog) => (
                        <tr
                          key={blog._id}
                          className="hover:bg-[#EEEDFE]/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <p className="text-[#1A1340] font-bold text-[15px] max-w-[300px] truncate">
                              {blog.title}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[#7775A0] text-[13px]">
                              <Calendar size={14} />
                              {formatDate(blog.publishedAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-[#1A1340] font-medium text-[14px]">
                              <Eye size={16} className="text-[#4A3DBF]" />
                              {blog.viewCount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-[#7775A0] hover:text-[#2D2380] p-2 rounded-md hover:bg-[#EEEDFE]">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-8 text-center text-[#7775A0]"
                        >
                          No recent blogs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (Spans 1/3) - Analytics Summary & Quick Links */}
          <div className="xl:col-span-1 space-y-8">
            {/* Deep Analytics Summary */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-semibold text-[#1A1340] flex items-center gap-2">
                  <BarChart3 size={20} className="text-[#FF6B35]" />
                  Event Telemetry (30d)
                </h2>
              </div>

              <div className="space-y-3">
                {/* Traffic Events */}
                <div className="flex items-center justify-between p-3 bg-[#F7F6FF] rounded-lg border border-[#E0DEF5] hover:border-[#4A3DBF] transition-colors">
                  <span className="text-[#7775A0] font-medium text-[14px]">
                    Store Page Visits
                  </span>
                  <span className="text-[#1A1340] font-bold">
                    {(data.analytics.events.store_visit || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#F7F6FF] rounded-lg border border-[#E0DEF5] hover:border-[#4A3DBF] transition-colors">
                  <span className="text-[#7775A0] font-medium text-[14px]">
                    Blog Page Views
                  </span>
                  <span className="text-[#1A1340] font-bold">
                    {(data.analytics.events.blog_view || 0).toLocaleString()}
                  </span>
                </div>

                {/* Interaction Events */}
                <div className="flex items-center justify-between p-3 bg-[#F7F6FF] rounded-lg border border-[#E0DEF5] hover:border-[#4A3DBF] transition-colors mt-4">
                  <span className="text-[#7775A0] font-medium text-[14px]">
                    Coupon Views (Listings)
                  </span>
                  <span className="text-[#1A1340] font-bold">
                    {(data.analytics.events.coupon_view || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#EEEDFE] rounded-lg border border-[#4A3DBF] mt-4">
                  <span className="text-[#2D2380] font-bold text-[14px]">
                    Coupon Link Clicks
                  </span>
                  <span className="text-[#FF6B35] font-bold text-[16px]">
                    {(data.analytics.events.coupon_click || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#EEEDFE] rounded-lg border border-[#4A3DBF]">
                  <span className="text-[#2D2380] font-bold text-[14px]">
                    Amazon Link Clicks
                  </span>
                  <span className="text-[#FF6B35] font-bold text-[16px]">
                    {(
                      data.analytics.events.amazon_deal_click || 0
                    ).toLocaleString()}
                  </span>
                </div>

                {/* Conversion Event */}
                <div className="flex items-center justify-between p-3 bg-[#E1F5EE] rounded-lg border border-[#22B07D] mt-4">
                  <span className="text-[#1A1340] font-bold text-[14px]">
                    Outbound Redirects
                  </span>
                  <span className="text-[#22B07D] font-bold text-[18px]">
                    {(
                      data.analytics.events.outbound_redirect || 0
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 py-3 border-[1.5px] border-[#E0DEF5] text-[#7775A0] font-semibold rounded-lg hover:border-[#4A3DBF] hover:text-[#2D2380] transition-colors duration-150">
                View Deep Analytics
              </button>
            </div>

            {/* Quick Create Links */}
            <div className="bg-[#1A1340] rounded-xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F4A836]/10 rounded-full blur-3xl -mr-10 -mt-10" />

              <h2 className="text-white text-[20px] font-semibold mb-4 relative z-10">
                Quick Actions
              </h2>
              <div className="space-y-3 relative z-10">
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150">
                  <Tag size={18} className="text-[#F4A836]" />
                  <span className="font-medium text-[15px]">Create Coupon</span>
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150">
                  <Store size={18} className="text-[#F4A836]" />
                  <span className="font-medium text-[15px]">Add New Store</span>
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150">
                  <FileText size={18} className="text-[#F4A836]" />
                  <span className="font-medium text-[15px]">
                    Write Blog Post
                  </span>
                </button>
                <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150">
                  <Box size={18} className="text-[#F4A836]" />
                  <span className="font-medium text-[15px]">
                    Add Affiliate Product
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
