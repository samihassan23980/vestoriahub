"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export default function Stats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic state fetching logic
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/public/stats");
        const data = await res.json();
        if (data && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed fetching live marketplace statistics:", error);
        // Fallback data
        setStats({
          stores: 120,
          coupons: 1450,
          curatedDeals: 850,
          shoppingGuides: 45,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Structural mapping strictly matching the quadrant layout
  const statsData = [
    {
      id: 1,
      label: "Verified Coupons",
      value: stats ? `${stats.coupons.toLocaleString()}+` : "1,450+",
      description: "Strictly tested and verified daily to guarantee zero failed codes at online checkout.",
    },
    {
      id: 2,
      label: "Partner Stores",
      value: stats ? `${stats.stores.toLocaleString()}+` : "120+",
      description: "Direct affiliate partnerships across top global retailers and premier marketplaces.",
    },
    {
      id: 3,
      label: "Curated Deals",
      value: stats ? `${stats.curatedDeals.toLocaleString()}+` : "850+",
      description: "Hand-picked, limited-time price drops updated hourly across tech, fashion, and essentials.",
    },
    {
      id: 4,
      label: "Shopping Guides",
      value: stats ? `${stats.shoppingGuides.toLocaleString()}+` : "45+",
      description: "Comprehensive editorial buying guides helping everyday shoppers make smarter decisions.",
    },
  ];

  return (
    <section className="relative w-full bg-[#F8F0E5] py-20 lg:py-28 font-sans border-b border-[#E2D9CC] overflow-hidden">
      <div className="max-w-[1360px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* ─── LEFT COLUMN: HEADLINE & ACTIONS ─── */}
          <div className="lg:col-span-5 flex flex-col justify-between self-stretch">
            <div>
              <div className="inline-block text-[11.5px] font-mono font-bold tracking-[0.2em] !text-[#427867] uppercase mb-4">
                [PLATFORM METRICS]
              </div>

              <h2 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-normal tracking-tight !text-[#1C352D] leading-[1.08] mb-6">
                Our Scale <br />
                <span className="font-serif italic font-normal !text-[#D9A441]">
                  by the numbers
                </span>
              </h2>

              <p className="!text-[#16241F]/80 text-[15px] sm:text-[16px] leading-relaxed max-w-[420px] font-normal mb-8">
                Our metrics are a testament to our dedication to transparency, verified savings, and delivering real value to everyday shoppers.
              </p>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/stores"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#1C352D] !text-[#FDFBF7] text-[13.5px] font-heading font-bold hover:bg-[#10201B] transition-all duration-200 shadow-sm active:scale-98"
              >
                Explore Stores
              </Link>
              
              <Link
                href="/legal/about"
                className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-full border border-[#E2D9CC] bg-[#FDFBF7] !text-[#1C352D] text-[13.5px] font-heading font-semibold hover:border-[#1C352D] hover:!text-[#1C352D] transition-all duration-200 shadow-xs"
              >
                <span>How We Operate</span>
                <ArrowUpRight size={14} strokeWidth={2.5} className="!text-[#D9A441]" />
              </Link>
            </div>
          </div>

          {/* ─── RIGHT COLUMN: 2x2 CLEAN METRICS GRID (Light Cream Theme) ─── */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2">
            {statsData.map((item, idx) => {
              const isTopRow = idx < 2;
              const isLeftCol = idx % 2 === 0;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between p-6 sm:p-8 transition-colors duration-200 hover:bg-[#FDFBF7]/70 ${
                    isLeftCol ? "border-l-0 sm:border-r border-[#E2D9CC]" : ""
                  } ${
                    isTopRow ? "border-b border-[#E2D9CC]" : ""
                  }`}
                >
                  {/* Top Label */}
                  <span className="text-[13px] font-heading font-semibold tracking-wide !text-[#427867] block mb-4">
                    {item.label}
                  </span>

                  {/* Big Hero Metric */}
                  <div className="my-2">
                    {loading ? (
                      <div className="h-[60px] w-36 bg-[#E2D9CC]/60 animate-pulse rounded-lg mb-2" />
                    ) : (
                      <div className="text-[44px] sm:text-[54px] lg:text-[62px] font-heading font-extrabold tracking-tight !text-[#1C352D] leading-none">
                        {item.value}
                      </div>
                    )}
                  </div>

                  {/* Bottom Subtext */}
                  <p className="text-[13px] sm:text-[13.5px] !text-[#16241F]/75 leading-relaxed font-normal mt-4">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </section>
  );
}