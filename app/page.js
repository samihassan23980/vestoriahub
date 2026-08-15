import React, { Suspense } from "react";

import HeroSection from "./Components/HeroSection";
import Stats from "./Components/StatsSection";
import BestSellers from "./Components/BestSellers";
import CTA from "./Components/CTA";
import AboutUs from "./Components/AboutUs";
import Process from "./Components/Process";
import BlogAssembly from "./Components/BlogAssembly";

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Instantly loaded Static Sections */}
      <HeroSection />

      {/* Dynamically loaded Blogs with Suspense for fast initial page load */}
      <Suspense
        fallback={
          // Uses semantic background color
          <div className="h-[60vh] bg-[var(--color-background)] flex items-center justify-center font-sans">
            <div className="flex flex-col items-center gap-4">
              {/* Premium two-tone spinner: Using Navy-600 base with Purple-500 animated top */}
              <div className="w-10 h-10 border-[4px] border-[var(--color-surface)] border-t-[var(--color-primary)] rounded-full animate-spin shadow-sm"></div>

              {/* Using Text-Primary (White) for high readability against the navy background */}
              <div className="animate-pulse text-[var(--color-text-primary)] font-bold text-[16px] md:text-[18px]">
                Loading the latest insights...
              </div>
            </div>
          </div>
        }
      >
        <BlogAssembly />
      </Suspense>

      {/* Instantly loaded Bottom Sections */}
      <Stats />

      {/* <Process /> */}
      <CTA />
    </div>
  );
}
