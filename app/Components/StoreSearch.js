"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export default function StoreSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    // Debounce search to prevent multiple rapid requests
    const delayDebounce = setTimeout(() => {
      const url = query
        ? `/stores?search=${encodeURIComponent(query)}`
        : `/stores`;

      router.push(url, { scroll: false });
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, router]);

  return (
    <div className="relative max-w-[600px] mx-auto group">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-[24px] flex items-center pointer-events-none z-10">
        <Search className="h-5 w-5 text-[#065047]/40 group-focus-within:text-[#065047] transition-colors duration-300" />
      </div>

      {/* Input Field */}
      <input
        type="text"
        className="block w-full h-[58px] pl-[58px] pr-[24px] rounded-full border border-[#065047]/10 bg-white text-[#1A1A1A] placeholder-[#1A1A1A]/40 text-[16px] focus:outline-none focus:border-[#065047]/30 focus:ring-[6px] focus:ring-[#065047]/5 transition-all duration-300 shadow-[0_8px_30px_rgba(6,80,71,0.05)] hover:border-[#065047]/20"
        placeholder="Search over 5,000+ stores..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search stores"
      />
    </div>
  );
}
