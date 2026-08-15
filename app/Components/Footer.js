"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShieldCheck, 
  Lock, 
  Tag, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  HeartHandshake,
  ExternalLink
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // State to hold all legal/custom pages fetched from DB
  const [pages, setPages] = useState([]);

  // Fetch Links from Public API
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch("/api/public/legal-pages");
        if (res.ok) {
          const data = await res.json();
          setPages(data);
        }
      } catch (err) {
        console.error("Footer Link Fetch Error:", err);
      }
    };
    fetchLinks();
  }, []);

  // Security: Hide footer on Admin & Auth layouts
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/signin")) {
    return null;
  }

  // Logic for Grouping Pages
  const coreTypes = [
    "about_us",
    "privacy_policy",
    "terms",
    "affiliate_disclosure",
  ];

  // Filter out custom pages to append below core company links
  const customPages = pages.filter(
    (p) => p.type === "custom" || !coreTypes.includes(p.type)
  );

  // Helper to render Specific Core Links securely
  const renderCoreLink = (type, fallbackLabel, defaultSlug) => {
    const page = pages.find((p) => p.type === type);
    const slug = page ? `/legal/${page.slug}` : defaultSlug;
    const title = page ? page.title : fallbackLabel;

    return (
      <li>
        <Link
          href={slug}
          className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors duration-200 inline-flex items-center gap-1 group"
        >
          <span>{title}</span>
          <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#D9A441]" />
        </Link>
      </li>
    );
  };

  return (
    <footer className="bg-[#0B1612] pt-16 lg:pt-20 w-full border-t border-[#25473C] font-sans relative overflow-hidden">
      
      {/* ─── AMBIENT BACKGROUND GLOW ─── */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] bg-[#162B24] blur-[150px] pointer-events-none opacity-40" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#D9A441]/5 blur-[140px] pointer-events-none" />

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ─── TOP VALUE PILLARS ROW ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-14 border-b border-[#25473C]/80">
          <div className="flex items-center gap-3.5 bg-[#10201B] p-4 rounded-2xl border border-[#25473C]/60">
            <div className="w-10 h-10 rounded-xl bg-[#162B24] border border-[#25473C] flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-[#D9A441]" />
            </div>
            <div>
              <h5 className="text-[13.5px] font-heading font-bold !text-[#FDFBF7]">100% Tested Codes</h5>
              <p className="text-[11.5px] !text-[#A8C3B0]">Verified before checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-[#10201B] p-4 rounded-2xl border border-[#25473C]/60">
            <div className="w-10 h-10 rounded-xl bg-[#162B24] border border-[#25473C] flex items-center justify-center shrink-0">
              <Tag size={19} className="text-[#D9A441]" />
            </div>
            <div>
              <h5 className="text-[13.5px] font-heading font-bold !text-[#FDFBF7]">Hand-Picked Drops</h5>
              <p className="text-[11.5px] !text-[#A8C3B0]">Genuine marketplace sales</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-[#10201B] p-4 rounded-2xl border border-[#25473C]/60">
            <div className="w-10 h-10 rounded-xl bg-[#162B24] border border-[#25473C] flex items-center justify-center shrink-0">
              <HeartHandshake size={19} className="text-[#D9A441]" />
            </div>
            <div>
              <h5 className="text-[13.5px] font-heading font-bold !text-[#FDFBF7]">Transparent Model</h5>
              <p className="text-[11.5px] !text-[#A8C3B0]">Free with full disclosure</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-[#10201B] p-4 rounded-2xl border border-[#25473C]/60">
            <div className="w-10 h-10 rounded-xl bg-[#162B24] border border-[#25473C] flex items-center justify-center shrink-0">
              <Lock size={19} className="text-[#D9A441]" />
            </div>
            <div>
              <h5 className="text-[13.5px] font-heading font-bold !text-[#FDFBF7]">Privacy Guaranteed</h5>
              <p className="text-[11.5px] !text-[#A8C3B0]">No data tracking or sales</p>
            </div>
          </div>
        </div>

        {/* ─── MAIN FOOTER CONTENT GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 py-14">
          
          {/* COLUMN 1: BRAND IDENTITY (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group focus:outline-none w-fit">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D9A441] to-[#BE8E34] p-0.5 shadow-md group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#10201B] rounded-[10px] flex items-center justify-center">
                  <Tag className="w-4 h-4 text-[#D9A441]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[22px] font-heading font-extrabold tracking-tight !text-[#FDFBF7] leading-none">
                  Vestoria<span className="text-[#D9A441]">Hub</span>
                </span>
                <span className="text-[9.5px] uppercase font-bold tracking-widest text-[#A8C3B0] mt-0.5">
                  Smart Shopping Companion
                </span>
              </div>
            </Link>

            <p className="!text-[#D5E4D9] text-[14px] leading-relaxed max-w-[380px] font-normal">
              Your smart shopping companion built to bridge top retail brands with everyday shoppers. Discover strictly tested coupons, curated marketplace discounts, and expert guides so you never pay full price again.
            </p>

            <div className="inline-flex items-center gap-2 text-[12px] font-mono !text-[#A8C3B0]">
              <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
              <span>Tested & Verified Daily for Maximum Savings</span>
            </div>
          </div>

          {/* COLUMN 2: QUICK NAVIGATION (2 cols) */}
          <div className="lg:col-span-2 lg:col-start-6 flex flex-col gap-4">
            <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-[0.15em] !text-[#D9A441]">
              Explore Hub
            </h4>
            <ul className="flex flex-col gap-3">
              <li>
                <Link href="/" className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors flex items-center gap-1.5">
                  <span>Explore Products</span>
                  <span className="text-[9px] bg-[#D9A441] text-[#16241F] font-bold px-1.5 py-0.2 rounded uppercase">New</span>
                </Link>
              </li>
              <li>
                <Link href="/categories" className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/stores" className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors">
                  Partner Stores
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors">
                  Shopping Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: COMPANY & CUSTOM (2 cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-[0.15em] !text-[#D9A441]">
              Company
            </h4>
            <ul className="flex flex-col gap-3">
              {renderCoreLink("about_us", "About Our Story", "/legal/about")}
              <li>
                <Link
                  href="/legal/contact"
                  className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors"
                >
                  Contact Support
                </Link>
              </li>

              {/* Dynamic Database Custom Pages */}
              {customPages.map((cp) => (
                <li key={cp.slug}>
                  <Link
                    href={`/legal/${cp.slug}`}
                    className="!text-[#D5E4D9] hover:!text-[#D9A441] text-[13.5px] font-medium transition-colors"
                  >
                    {cp.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4: LEGAL & COMPLIANCE (3 cols) */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h4 className="text-[12px] font-heading font-extrabold uppercase tracking-[0.15em] !text-[#D9A441]">
              Legal & Trust
            </h4>
            <ul className="flex flex-col gap-3">
              {renderCoreLink(
                "privacy_policy",
                "Privacy Policy",
                "/legal/privacy-policy"
              )}
              {renderCoreLink(
                "terms",
                "Terms of Service",
                "/legal/terms-of-service"
              )}
              {renderCoreLink(
                "affiliate_disclosure",
                "Affiliate Disclosure",
                "/legal/affiliate-disclosure"
              )}
            </ul>
          </div>

        </div>
      </div>

      {/* ─── BOTTOM COMPLIANCE & LEGAL COPYRIGHT BAR ─── */}
      <div className="bg-[#070E0B] py-8 border-t border-[#25473C]/80">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Disclaimers & Copyright */}
          <div className="flex flex-col gap-2 text-center md:text-left">
            <p className="!text-[#FDFBF7] text-[13px] font-semibold">
              © {currentYear} VestoriaHub. All rights reserved.
            </p>
            <p className="!text-[#A8C3B0] text-[12px] max-w-[780px] leading-relaxed font-normal">
              <strong>Affiliate Disclosure:</strong> VestoriaHub earns a small commission when you purchase through links and coupons on our platform via direct retail network partnerships. This allows us to keep our service 100% free for consumers while guaranteeing verified deals without affecting your final checkout price.
            </p>
          </div>

          {/* Trust & Security Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10201B] border border-[#25473C] rounded-lg !text-[#D5E4D9] text-[10.5px] font-heading font-bold uppercase tracking-wider shadow-xs">
              <ShieldCheck size={14} className="text-[#D9A441]" />
              FTC Compliant
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10201B] border border-[#25473C] rounded-lg !text-[#D5E4D9] text-[10.5px] font-heading font-bold uppercase tracking-wider shadow-xs">
              <Lock size={14} className="text-[#D9A441]" />
              256-Bit SSL
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10201B] border border-[#25473C] rounded-lg !text-[#D5E4D9] text-[10.5px] font-heading font-bold uppercase tracking-wider shadow-xs">
              <Sparkles size={14} className="text-[#D9A441]" />
              Verified Deals
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}