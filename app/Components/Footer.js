"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // State to hold all pages fetched from DB
  const [pages, setPages] = useState([]);

  // Fetch Links from Public API
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch("/api/public/legal-pages");
        if (res.ok) {
          const data = await res.json();
          setPages(data); // Expecting array: [{title, slug, type}]
        }
      } catch (err) {
        // Silent fail for footer links to prevent intrusive user errors,
        // fallback to standard text mapping.
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
    (p) => p.type === "custom" || !coreTypes.includes(p.type),
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
          // Lavender secondary text that brightens to Purple Primary on hover
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-[14px] font-medium transition-colors duration-200"
        >
          {title}
        </Link>
      </li>
    );
  };

  return (
    // Main Footer Background: Navy 900 for a grounded, premium dark base
    <footer className="bg-[var(--color-navy-900)] pt-[64px] w-full border-t border-[var(--color-border)] font-sans">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-[48px] pb-[64px]">
          {/* --- COLUMN 1: BRAND IDENTITY --- */}
          <div className="lg:col-span-5 flex flex-col gap-[24px]">
            {/* Text-Based Logo Matching Navbar */}
            <Link href="/" className="inline-block group focus:outline-none">
              <span className="text-2xl lg:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight transition-opacity duration-200 group-hover:opacity-90">
                VestoriaHub
                <span className="text-[var(--color-primary)] font-medium">
                  StartHere
                </span>
              </span>
            </Link>
            <p className="text-[var(--color-text-secondary)] text-[14px] leading-[1.7] max-w-[340px] font-medium">
              Your smart shopping companion. Discover strictly verified coupons,
              curated marketplace discounts, and expert buying guides. We make
              sure you never pay full price again.
            </p>
          </div>

          {/* --- COLUMN 2: COMPANY & CUSTOM PAGES --- */}
          <div className="lg:col-span-3 lg:col-start-7 flex flex-col gap-[24px]">
            <h3 className="text-[var(--color-secondary)] text-[13px] uppercase tracking-[0.08em] font-bold">
              Company
            </h3>
            <ul className="flex flex-col gap-[16px]">
              {renderCoreLink("about_us", "Our Story", "/about")}
              <li>
                <Link
                  href="/legal/contact"
                  className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-[14px] font-medium transition-colors duration-200"
                >
                  Contact Support
                </Link>
              </li>

              {/* DYNAMIC CUSTOM PAGES AUTO-RENDER */}
              {customPages.map((cp) => (
                <li key={cp.slug}>
                  <Link
                    href={`/legal/${cp.slug}`}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-[14px] font-medium transition-colors duration-200"
                  >
                    {cp.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* --- COLUMN 3: LEGAL & COMPLIANCE --- */}
          <div className="lg:col-span-3 flex flex-col gap-[24px]">
            <h4 className="text-[var(--color-secondary)] text-[13px] uppercase tracking-[0.08em] font-bold">
              Legal
            </h4>
            <ul className="flex flex-col gap-[16px]">
              {renderCoreLink(
                "privacy_policy",
                "Privacy Policy",
                "/legal/privacy-policy",
              )}
              {renderCoreLink(
                "terms",
                "Terms of Service",
                "/legal/terms-of-service",
              )}
              {renderCoreLink(
                "affiliate_disclosure",
                "Affiliate Disclosure",
                "/legal/affiliate-disclosure",
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION: COMPLIANCE BAR --- */}
      {/* Background: Deepest Navy (950) for strong, grounded contrast */}
      <div className="bg-[var(--color-navy-950)] py-[32px] border-t border-[var(--color-border)]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-[24px]">
          <div className="flex flex-col gap-[8px] text-center md:text-left">
            <p className="text-[var(--color-text-secondary)] text-[13px] font-medium">
              © {currentYear} VestoriaHub. All rights reserved.
            </p>
            <p className="text-[var(--color-text-secondary)] opacity-60 text-[12px] max-w-[700px] leading-[1.7] italic">
              Affiliate Disclosure: VestoriaHub earns a small
              commission when you shop through our links and coupons via
              affiliate partnerships. This keeps our platform 100% free for
              every user without affecting your final price.
            </p>
          </div>

          {/* Compliance Badges */}
          <div className="flex items-center gap-[16px] shrink-0">
            {/* Dark Surface Tinted Badges */}
            <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-secondary)] text-[10px] font-bold tracking-wider uppercase">
              <ShieldCheck size={14} className="text-[var(--color-primary)]" />
              FTC Compliant
            </div>
            <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[6px] text-[var(--color-text-secondary)] text-[10px] font-bold tracking-wider uppercase">
              <Lock size={14} className="text-[var(--color-primary)]" />
              SSL Secured
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
