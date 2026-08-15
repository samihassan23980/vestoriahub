"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  Percent, 
  ShoppingBag,
  BookOpen,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop",
  lifestyle: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
  product: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=800&auto=format&fit=crop",
};

export default function AboutUs() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // 1. Text & Left Elements Entrance
        gsap.from(".editorial-fade", {
          y: 35,
          opacity: 0,
          stagger: 0.12,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        });

        // 2. Bento Grid Cards Entrance
        gsap.from(".bento-card", {
          scale: 0.94,
          opacity: 0,
          y: 40,
          stagger: 0.15,
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".bento-grid-wrapper",
            start: "top 75%",
          },
        });

        // 3. Floating Micro-Badges
        gsap.from(".floating-pill", {
          scale: 0.8,
          opacity: 0,
          duration: 0.9,
          delay: 0.4,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".bento-grid-wrapper",
            start: "top 75%",
          },
        });
      }, containerRef);

      return () => ctx.revert();
    }
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full bg-[#10201B] !text-[#F8F0E5] overflow-hidden py-24 lg:py-32 border-b border-[#25473C] font-sans"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ──────── LEFT COLUMN: Editorial Story ──────── */}
          <div className="lg:col-span-5 flex flex-col items-start space-y-7">
            
            {/* Mission Badge */}
            <div className="editorial-fade inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#162B24] border border-[#25473C] backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#D9A441] animate-pulse" />
              <span className="text-[11px] font-heading font-extrabold tracking-[0.2em] uppercase !text-[#D9A441]">
                About VestoriaHub
              </span>
            </div>

            {/* Headline */}
            <h2 className="editorial-fade font-heading text-4xl sm:text-5xl lg:text-[52px] font-normal tracking-tight leading-[1.08] !text-[#FDFBF7]">
              Shopping should be <br />
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-[#D9A441] via-[#F8F0E5] to-[#D9A441]">
                rewarding,
              </span>{" "}
              <br />
              <span className="font-extrabold !text-[#FDFBF7]">not expensive.</span>
            </h2>

            {/* Story Paragraphs */}
            <div className="editorial-fade space-y-4 !text-[#D5E4D9] text-[15.5px] sm:text-[16.5px] leading-relaxed font-normal">
              <p className="!text-[#D5E4D9]">
                VestoriaHub is your smart shopping companion built to sit between the world’s top retail brands and everyday shoppers. We exist to make sure you never pay full price when a verified deal is just one click away.
              </p>
              <p className="!text-[#A8C3B0] text-[14px] leading-relaxed">
                Operating as a complete savings and rewards ecosystem, our platform combines tested coupons, hand-picked marketplace discounts, and comprehensive buying guides—100% free and fully transparent.
              </p>
            </div>

            {/* Feature Checkpoints: 4 Value Pillars */}
            <div className="editorial-fade grid grid-cols-2 gap-3.5 w-full pt-1">
              {[
                { title: "Tested & Verified", desc: "Codes checked before checkout" },
                { title: "Curated Drops", desc: "Genuine Amazon & retail sales" },
                { title: "Knowledge Hub", desc: "Expert guides & comparisons" },
                { title: "100% Free Access", desc: "Zero subscriptions or signups" },
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-2xl bg-[#162B24]/80 border border-[#25473C] flex flex-col justify-between hover:border-[#D9A441]/50 transition-colors shadow-xs"
                >
                  <span className="text-[13.5px] font-heading font-bold !text-[#FDFBF7] flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-[#D9A441] shrink-0" />
                    {item.title}
                  </span>
                  <span className="text-[12px] !text-[#A8C3B0] mt-1 font-medium">{item.desc}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="editorial-fade flex flex-wrap items-center gap-4 pt-3 w-full sm:w-auto">
              <Link
                href="/stores"
                className="group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#D9A441] via-[#E5B558] to-[#D9A441] !text-[#16241F] font-heading font-bold text-sm transition-all duration-300 shadow-[0_6px_20px_rgba(217,164,65,0.3)] hover:shadow-[0_8px_25px_rgba(217,164,65,0.45)] hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span>Explore Verified Deals</span>
                <ArrowUpRight size={16} strokeWidth={2.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                href="/legal/about"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-[#162B24] hover:bg-[#1C352D] border border-[#25473C] !text-[#FDFBF7] font-heading font-bold text-sm transition-all duration-300 hover:border-[#D9A441]/40"
              >
                Our Full Story
              </Link>
            </div>
          </div>

          {/* ──────── RIGHT COLUMN: Modular Bento Grid Showcase ──────── */}
          <div className="lg:col-span-7 bento-grid-wrapper">
            <div className="grid grid-cols-12 gap-4 relative">
              
              {/* Primary Large Card: Main Editorial Visual */}
              <div className="bento-card col-span-12 sm:col-span-7 h-[360px] sm:h-[440px] rounded-3xl overflow-hidden relative border border-[#25473C] group bg-[#162B24] shadow-2xl">
                <Image
                  src={IMAGES.hero}
                  alt="VestoriaHub Smart Shopping Companion"
                  fill
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10201B] via-[#10201B]/40 to-transparent" />
                
                {/* Floating pill over image */}
                <div className="floating-pill absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-[#10201B]/90 backdrop-blur-md border border-[#25473C] flex items-center gap-2 shadow-md">
                  <Sparkles size={13} className="text-[#D9A441]" />
                  <span className="text-[11px] font-heading font-bold !text-[#F8F0E5] uppercase tracking-wider">Curated Discovery</span>
                </div>

                <div className="absolute bottom-5 left-5 right-5 z-10">
                  <span className="text-[11.5px] font-heading font-bold !text-[#D9A441] tracking-wider uppercase block mb-1">Smart Shopper Companion</span>
                  <p className="text-[17px] sm:text-[18px] font-heading font-bold !text-[#FFFFFF] line-clamp-2 leading-snug">Connecting everyday consumers with verified retail savings.</p>
                </div>
              </div>

              {/* Top Right Card: Live Stats Badge */}
              <div className="bento-card col-span-12 sm:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-[#162B24] border border-[#25473C] shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#10201B] border border-[#25473C] flex items-center justify-center text-[#D9A441]">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[11px] font-heading font-extrabold px-2.5 py-1 rounded-full bg-[#EBF3EE]/10 border border-[#BDD6C4]/30 !text-[#D5E4D9] uppercase tracking-wider">
                    Tested Daily
                  </span>
                </div>

                <div className="my-5">
                  <div className="text-4xl lg:text-5xl font-heading font-extrabold !text-[#FDFBF7] tracking-tight">
                    $2.4M+
                  </div>
                  <p className="text-[12.5px] !text-[#A8C3B0] font-medium mt-1">
                    Saved by our community through tested promo codes & price drops
                  </p>
                </div>

                {/* Micro trend indicator */}
                <div className="pt-3.5 border-t border-[#25473C] flex items-center justify-between text-xs !text-[#D5E4D9]">
                  <span className="flex items-center gap-1.5 font-medium !text-[#D5E4D9]">
                    <Percent size={13} className="text-[#D9A441]" /> Avg. Savings
                  </span>
                  <span className="font-heading font-bold !text-[#D9A441]">32% Off</span>
                </div>
              </div>

              {/* Bottom Left Card: Curated Marketplace Visual */}
              <div className="bento-card col-span-6 sm:col-span-5 h-[200px] rounded-3xl overflow-hidden relative border border-[#25473C] group bg-[#162B24]">
                <Image
                  src={IMAGES.lifestyle}
                  alt="Discount Marketplace"
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-75"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#10201B] via-transparent to-transparent" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between z-10">
                  <span className="text-[12.5px] font-heading font-bold !text-[#FFFFFF]">Amazon & Beyond</span>
                  <ShoppingBag size={15} className="text-[#D9A441]" />
                </div>
              </div>

              {/* Bottom Right Card: Knowledge Hub Engine */}
              <div className="bento-card col-span-6 sm:col-span-7 h-[200px] p-5 rounded-3xl bg-[#162B24] border border-[#25473C] flex flex-col justify-between hover:border-[#A8C3B0]/40 transition-all shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#10201B] border border-[#25473C] flex items-center justify-center text-[#D9A441]">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="text-[13.5px] font-heading font-bold !text-[#FDFBF7]">Knowledge Hub</h4>
                    <p className="text-[11.5px] !text-[#A8C3B0]">Verified guides & tips</p>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-heading font-extrabold !text-[#FDFBF7]">100%</div>
                    <div className="text-[11px] !text-[#A8C3B0]">Checked & Tested</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-[#10201B] border border-[#25473C] !text-[#D9A441] text-[11px] font-heading font-bold uppercase tracking-wider">
                    Free Forever
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}