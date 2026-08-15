"use client";
import React, { useState } from "react";
import {
  ShoppingBag,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Zap,
  Award,
  ThumbsUp,
  Star,
  RefreshCw,
  Globe,
  Clock,
  ExternalLink,
} from "lucide-react";

const AmazonDealsPage = () => {
  // ─── DUMMY DATA (Mapped exactly to AmazonDealSchema) ─────────────────────

  const deals = [
    {
      _id: "amd_001",
      title: "Apple AirPods Pro (2nd Generation) Wireless Earbuds",
      asin: "B0BDHWDR12",
      imageUrl:
        "https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?w=200&q=80",
      originalPrice: 249.0,
      dealPrice: 189.99,
      discountPercentage: 24,
      isPrime: true,
      isAmazonChoice: false,
      isBestSeller: true,
      rating: 4.8,
      reviewCount: 45210,
      status: "active",
      expiryDate: "2026-04-22T23:59:59Z",
      countryCode: "US",
    },
    {
      _id: "amd_002",
      title: "Echo Dot (5th Gen, 2022 release) | Smart speaker with Alexa",
      asin: "B09B8V1LZ3",
      imageUrl:
        "https://images.unsplash.com/photo-1543512214-318c7553f230?w=200&q=80",
      originalPrice: 49.99,
      dealPrice: 29.99,
      discountPercentage: 40,
      isPrime: true,
      isAmazonChoice: true,
      isBestSeller: false,
      rating: 4.7,
      reviewCount: 112040,
      status: "active",
      expiryDate: "2026-04-21T12:00:00Z",
      countryCode: "GLOBAL",
    },
    {
      _id: "amd_003",
      title: "Samsung 32-Inch Odyssey G5 Gaming Monitor",
      asin: "B08FF3F5HR",
      imageUrl:
        "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=200&q=80",
      originalPrice: 349.99,
      dealPrice: 279.99,
      discountPercentage: 20,
      isPrime: false,
      isAmazonChoice: false,
      isBestSeller: false,
      rating: 4.5,
      reviewCount: 3210,
      status: "expired",
      expiryDate: "2026-04-18T00:00:00Z",
      countryCode: "GB",
    },
    {
      _id: "amd_004",
      title: "Anker USB C Charger 20W, 511 Charger (Nano Pro)",
      asin: "B099F55XZF",
      imageUrl:
        "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&q=80",
      originalPrice: 16.99,
      dealPrice: 13.59,
      discountPercentage: 20,
      isPrime: true,
      isAmazonChoice: true,
      isBestSeller: true,
      rating: null, // Test for null rating logic defined in schema
      reviewCount: 0,
      status: "draft",
      expiryDate: null,
      countryCode: "US",
    },
  ];

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 bg-[#22B07D]/15 text-[#22B07D] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#22B07D]/20">
            Active
          </span>
        );
      case "expired":
        return (
          <span className="px-2.5 py-1 bg-[#E24B4A]/15 text-[#E24B4A] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#E24B4A]/20">
            Expired
          </span>
        );
      case "draft":
        return (
          <span className="px-2.5 py-1 bg-[#F4A836]/15 text-[#BA7517] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#F4A836]/30">
            Draft
          </span>
        );
      case "archived":
        return (
          <span className="px-2.5 py-1 bg-[#7775A0]/15 text-[#7775A0] text-[11px] font-bold uppercase tracking-wider rounded-md border border-[#7775A0]/20">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* ─── PAGE HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight flex items-center gap-3">
              <ShoppingBag
                className="text-[#F4A836]"
                size={32}
                strokeWidth={2.5}
              />
              Amazon Deals
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Curate, sync, and manage time-sensitive Amazon product deals via
              ASIN.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-transparent border-[2px] border-[#2D2380] text-[#2D2380] hover:bg-[#EEEDFE] px-5 py-2.5 rounded-lg font-bold text-[14px] transition-colors duration-150 ease-out">
              <RefreshCw size={16} strokeWidth={2.5} />
              Sync API Prices
            </button>
            <button className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-6 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-colors duration-150 ease-out">
              <Plus size={18} strokeWidth={2.5} />
              Import ASIN
            </button>
          </div>
        </div>

        {/* ─── TOOLBAR (Search & Filters) ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl p-4 shadow-[0_2px_12px_rgba(26,19,64,0.04)] flex flex-col md:flex-row items-center gap-4">
          {/* Search */}
          <div className="relative w-full md:w-[400px]">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
            />
            <input
              type="text"
              placeholder="Search by Title or ASIN (e.g. B0BDHW...)"
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] placeholder:text-[#7775A0] focus:outline-none focus:border-[#2D2380] focus:ring-2 focus:ring-[#2D2380]/10 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto ml-auto overflow-x-auto [&::-webkit-scrollbar]:hidden">
            <select className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]">
              <option value="all">All Categories</option>
              <option value="tech">Tech & Electronics</option>
              <option value="home">Home & Kitchen</option>
            </select>

            <select className="bg-[#FFFFFF] border-[1.5px] border-[#E0DEF5] text-[#1A1340] text-[14px] font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:border-[#2D2380]">
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="draft">Drafts</option>
            </select>

            <button className="flex items-center gap-2 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] text-[#7775A0] hover:text-[#2D2380] hover:border-[#4A3DBF] px-4 py-2.5 rounded-lg font-semibold text-[14px] transition-colors shrink-0">
              <Filter size={18} />
              More
            </button>
          </div>
        </div>

        {/* ─── DATA TABLE ─── */}
        <div className="bg-white border border-[#E0DEF5] rounded-xl shadow-[0_2px_12px_rgba(26,19,64,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F7F6FF] text-[#7775A0] text-[12px] uppercase tracking-wider font-semibold border-b border-[#E0DEF5]">
                  <th className="px-6 py-4 w-[35%]">Product & ASIN</th>
                  <th className="px-6 py-4">Pricing & Discount</th>
                  <th className="px-6 py-4">Amazon Signals</th>
                  <th className="px-6 py-4">Geo / Expiry</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E0DEF5]">
                {deals.map((deal) => (
                  <tr
                    key={deal._id}
                    className="hover:bg-[#EEEDFE]/40 transition-colors duration-150 group"
                  >
                    {/* Product & ASIN */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-4">
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-lg bg-white border border-[#E0DEF5] p-1 flex-shrink-0">
                          <img
                            src={deal.imageUrl}
                            alt={deal.title}
                            className="w-full h-full object-contain rounded-md"
                          />
                        </div>
                        <div>
                          <p className="text-[#1A1340] font-bold text-[14px] leading-snug line-clamp-2 hover:text-[#2D2380] cursor-pointer">
                            {deal.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-[#EEEDFE] text-[#2D2380] font-mono text-[12px] font-bold rounded border border-[#E0DEF5] flex items-center gap-1">
                              {deal.asin}
                              <ExternalLink
                                size={10}
                                className="text-[#7775A0]"
                              />
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pricing & Discount */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-center gap-2">
                        <span className="text-[#1A1340] font-bold text-[18px]">
                          {formatCurrency(deal.dealPrice)}
                        </span>
                        <span className="text-[#FF6B35] bg-[#FF6B35]/10 px-2 py-0.5 rounded text-[12px] font-bold">
                          {deal.discountPercentage}% OFF
                        </span>
                      </div>
                      <div className="text-[#7775A0] text-[13px] mt-1 line-through decoration-[#E24B4A]/50">
                        {formatCurrency(deal.originalPrice)}
                      </div>
                    </td>

                    {/* Amazon Conversion Signals */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {/* Badges Row */}
                        <div className="flex items-center gap-2">
                          {deal.isPrime && (
                            <span
                              className="flex items-center justify-center w-6 h-6 rounded bg-[#00A8E1]/10 text-[#00A8E1]"
                              title="Amazon Prime"
                            >
                              <Zap size={14} fill="currentColor" />
                            </span>
                          )}
                          {deal.isAmazonChoice && (
                            <span
                              className="flex items-center justify-center w-6 h-6 rounded bg-[#232F3E]/10 text-[#232F3E]"
                              title="Amazon's Choice"
                            >
                              <ThumbsUp size={14} fill="currentColor" />
                            </span>
                          )}
                          {deal.isBestSeller && (
                            <span
                              className="flex items-center justify-center w-6 h-6 rounded bg-[#F4A836]/15 text-[#BA7517]"
                              title="#1 Best Seller"
                            >
                              <Award size={14} fill="currentColor" />
                            </span>
                          )}
                          {!deal.isPrime &&
                            !deal.isAmazonChoice &&
                            !deal.isBestSeller && (
                              <span className="text-[#7775A0] text-[12px] italic">
                                No Badges
                              </span>
                            )}
                        </div>
                        {/* Rating Row (Schema note: default is null, not 4.5 fake ratings) */}
                        <div className="flex items-center gap-1.5 text-[12px]">
                          {deal.rating ? (
                            <>
                              <Star
                                size={14}
                                className="text-[#F4A836]"
                                fill="currentColor"
                              />
                              <span className="font-bold text-[#1A1340]">
                                {deal.rating}
                              </span>
                              <span className="text-[#7775A0]">
                                ({deal.reviewCount.toLocaleString()})
                              </span>
                            </>
                          ) : (
                            <span className="text-[#7775A0] italic">
                              No ratings yet
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Geo / Expiry */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex flex-col gap-1.5">
                        <span className="flex items-center gap-1.5 text-[#1A1340] text-[13px] font-medium">
                          <Globe size={14} className="text-[#7775A0]" />
                          {deal.countryCode === "GLOBAL"
                            ? "Global"
                            : deal.countryCode}
                        </span>
                        <span className="flex items-center gap-1.5 text-[#7775A0] text-[12px]">
                          <Clock size={14} />
                          {deal.expiryDate
                            ? new Date(deal.expiryDate).toLocaleDateString()
                            : "No Expiry"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 align-top">
                      {getStatusBadge(deal.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          title="Edit Deal"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#E24B4A] hover:bg-[#FCEBEB] rounded-lg transition-colors"
                          title="Delete Deal"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          className="p-2 text-[#7775A0] hover:text-[#2D2380] hover:bg-[#EEEDFE] rounded-lg transition-colors"
                          title="More Options"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ─── PAGINATION (Reusing existing style) ─── */}
          <div className="px-6 py-4 border-t border-[#E0DEF5] bg-white flex items-center justify-between">
            <span className="text-[#7775A0] text-[13px] font-medium">
              Showing <strong className="text-[#1A1340]">1</strong> to{" "}
              <strong className="text-[#1A1340]">4</strong> of{" "}
              <strong className="text-[#1A1340]">156</strong> Amazon Deals
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmazonDealsPage;
