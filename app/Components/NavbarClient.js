"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Flame,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Tag,
} from "lucide-react";

export default function NavbarClient({ categoryItems = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  // Primary Navigation Links with /products catalog routing
  const navItems = [
    { name: "Home", slug: "/" },
    { name: "Products", slug: "/products", isFeatured: true },
    { name: "Categories", slug: "/categories" },
    { name: "Stores", slug: "/stores" },
    { name: "Blog", slug: "/blogs" },
    { name: "About", slug: "/legal/about" },
    { name: "Contact", slug: "/legal/contact" },
  ];

  // Helper to ensure category links follow SEO URL pattern (/categories/[slug])
  const getCategoryHref = (slug) => {
    if (!slug) return "/categories";
    if (slug.startsWith("http") || slug.startsWith("/categories")) return slug;
    return `/${slug.replace(/^\/+/, "")}`;
  };

  // Close mobile menu automatically when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Elevation trigger on page scroll
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide Navbar on Admin or Auth routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/signin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full font-sans">
      {/* ─── PRIMARY TOP NAVBAR ─── */}
      <div
        className={`w-full transition-all duration-300 ease-out border-b ${
          isScrolled
            ? "bg-[#10201B]/95 backdrop-blur-xl border-[#25473C] shadow-[0_10px_30px_rgba(11,22,18,0.45)]"
            : "bg-[#162B24] border-[#25473C]/60 shadow-none"
        }`}
      >
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px] lg:h-[84px] gap-4">
            
            {/* Brand Logo */}
            <Link
              href="/"
              className="flex-shrink-0 flex items-center gap-2.5 cursor-pointer focus:outline-none group"
              aria-label="VestoriaHub Homepage"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D9A441] to-[#BE8E34] p-0.5 shadow-md shadow-[#D9A441]/20 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#162B24] rounded-[10px] flex items-center justify-center">
                  <Tag className="w-5 h-5 text-[#D9A441]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] lg:text-[23px] font-heading font-extrabold tracking-tight text-[#F8F0E5] leading-none">
                  Vestoria<span className="text-[#D9A441]">Hub</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A8C3B0] mt-0.5">
                  Smart Savings
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Floating Pill */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#10201B]/70 backdrop-blur-md rounded-full px-2 py-1.5 border border-[#25473C] shadow-inner">
              {navItems.map((item) => {
                const isActive =
                  item.slug === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(item.slug);

                return (
                  <Link
                    key={item.name}
                    href={item.slug}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-[13.5px] font-semibold tracking-wide transition-all duration-200 ${
                      isActive
                        ? "bg-[#1C352D] text-[#F8F0E5] shadow-sm border border-[#A8C3B0]/30"
                        : "text-[#A8C3B0] hover:text-[#F8F0E5] hover:bg-[#1C352D]/50"
                    }`}
                  >
                    {item.isFeatured && (
                      <Sparkles size={13} className="text-[#D9A441] animate-pulse" />
                    )}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Right Action — Bespoke "Explore Products" CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/products"
                className="group relative inline-flex items-center justify-between gap-3 bg-gradient-to-r from-[#D9A441] via-[#E5B558] to-[#D9A441] text-[#16241F] font-heading font-bold text-[14px] pl-4 pr-1.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(217,164,65,0.25)] hover:shadow-[0_6px_24px_rgba(217,164,65,0.4)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={17} className="text-[#16241F] transition-transform duration-300 group-hover:rotate-[-8deg]" />
                  <span className="tracking-wide">Explore Products</span>
                </div>
                
                {/* Arrow Disc Badge */}
                <div className="w-8 h-8 rounded-full bg-[#16241F] text-[#F8F0E5] flex items-center justify-center transition-all duration-300 group-hover:bg-[#1C352D] group-hover:rotate-45">
                  <ArrowUpRight size={15} strokeWidth={2.5} className="text-[#D9A441]" />
                </div>
              </Link>
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex lg:hidden items-center justify-center w-10 h-10 rounded-xl bg-[#10201B] text-[#F8F0E5] border border-[#25473C] focus:outline-none focus:ring-2 focus:ring-[#D9A441] transition-colors active:scale-95"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── SECONDARY CATEGORY ROW (DESKTOP) ─── */}
      {categoryItems && categoryItems.length > 0 && (
        <div className="hidden lg:block w-full bg-[#10201B]/95 backdrop-blur-md border-b border-[#25473C]/60 relative z-10">
          <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center h-[44px] overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <ul className="flex items-center gap-7 shrink-0">
                {categoryItems.map((cat, index) => {
                  const href = getCategoryHref(cat.slug);
                  const isCatActive = pathname === href;

                  return (
                    <li key={index} className="shrink-0 flex items-center">
                      <Link
                        href={href}
                        className={`flex items-center gap-1.5 text-[12.5px] font-semibold tracking-wide transition-all duration-150 py-2.5 ${
                          isCatActive
                            ? "text-[#D9A441] border-b-2 border-[#D9A441]"
                            : cat.isHot
                            ? "text-[#F8F0E5] hover:text-[#D9A441]"
                            : "text-[#A8C3B0] hover:text-[#F8F0E5]"
                        }`}
                      >
                        {cat.isHot && (
                          <span className="flex items-center gap-1 bg-[#C1432F]/20 border border-[#C1432F]/40 text-[#FDFBF7] text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            <Flame size={11} className="text-[#C1432F] fill-[#C1432F]" />
                            Hot
                          </span>
                        )}
                        {cat.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      )}

      {/* ─── MOBILE SLIDE-OVER DRAWER ─── */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#0B1612]/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide-in Panel */}
          <div className="absolute top-0 right-0 h-full w-[85%] max-w-[340px] bg-[#162B24] border-l border-[#25473C] shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 ease-out">
            
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between px-5 h-[72px] border-b border-[#25473C] bg-[#10201B]">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#D9A441]" />
                  <span className="text-[18px] font-heading font-extrabold text-[#F8F0E5]">
                    Vestoria<span className="text-[#D9A441]">Hub</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1C352D] text-[#A8C3B0] border border-[#25473C] hover:text-[#F8F0E5] transition-colors"
                  aria-label="Close menu"
                >
                  <X size={17} strokeWidth={2.5} />
                </button>
              </div>

              {/* Drawer Body Links */}
              <div className="px-4 py-5 overflow-y-auto max-h-[calc(100vh-190px)]">
                <nav className="flex flex-col gap-1.5">
                  {navItems.map((item) => {
                    const isActive =
                      item.slug === "/"
                        ? pathname === "/"
                        : pathname?.startsWith(item.slug);

                    return (
                      <Link
                        key={item.name}
                        href={item.slug}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-[14px] font-semibold transition-all ${
                          isActive
                            ? "bg-[#1C352D] text-[#F8F0E5] border border-[#A8C3B0]/30 shadow-sm"
                            : "text-[#A8C3B0] hover:bg-[#1C352D]/60 hover:text-[#F8F0E5]"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          {item.isFeatured && (
                            <Sparkles size={14} className="text-[#D9A441]" />
                          )}
                          {item.name}
                        </span>
                        {isActive && (
                          <ChevronRight size={15} className="text-[#D9A441]" />
                        )}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile Categories List */}
                {categoryItems && categoryItems.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#25473C]">
                    <h4 className="px-2 mb-3 text-[11px] font-bold uppercase tracking-wider text-[#8A8F8C]">
                      Top Categories
                    </h4>
                    <div className="flex flex-col gap-1">
                      {categoryItems.map((cat, index) => {
                        const href = getCategoryHref(cat.slug);
                        return (
                          <Link
                            key={index}
                            href={href}
                            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium text-[#A8C3B0] hover:text-[#F8F0E5] hover:bg-[#1C352D]/40 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              {cat.isHot && (
                                <Flame size={13} className="text-[#C1432F] fill-[#C1432F]" />
                              )}
                              {cat.name}
                            </span>
                            <ChevronRight size={13} className="text-[#8A8F8C]" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Drawer Bottom Action */}
            <div className="p-4 border-t border-[#25473C] bg-[#10201B]">
              <Link
                href="/products"
                className="flex items-center justify-center gap-2.5 w-full bg-[#D9A441] hover:bg-[#BE8E34] text-[#16241F] text-[14.5px] font-heading font-bold py-3 rounded-xl transition-all shadow-md active:scale-98"
              >
                <ShoppingBag size={17} />
                Explore Products Catalog
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}