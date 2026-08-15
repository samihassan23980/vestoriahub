import React from "react";
import { Search, Filter, ShieldCheck, Activity } from "lucide-react";

export default function Process() {
  const verificationSteps = [
    {
      id: 1,
      title: "Sourcing & Discovery",
      description:
        "We scan thousands of retailers, exclusive merchant networks, and user submissions to aggregate the web's best deals.",
      icon: Search,
      highlight: "10,000+ Scanned Daily",
    },
    {
      id: 2,
      title: "Algorithmic Filtering",
      description:
        "Our proprietary AI immediately filters out expired codes, duplicate offers, and deals with historically low success rates.",
      icon: Filter,
      highlight: "Spam Eliminated",
    },
    {
      id: 3,
      title: "Human Verification",
      description:
        "A dedicated Deal Editor manually tests the coupon code at the merchant's actual checkout page to guarantee it works.",
      icon: ShieldCheck,
      highlight: "100% Manually Tested",
    },
    {
      id: 4,
      title: "Live Monitoring",
      description:
        "Once published, active deals are re-tested every 24 hours. If a code expires early, our system flags and removes it.",
      icon: Activity,
      highlight: "24/7 Deal Tracking",
    },
  ];

  return (
    <section className="bg-navy-900 py-[100px] md:py-[120px] relative overflow-hidden font-sans border-y border-[var(--indigo-line)]">
      {/* ─── AMBIENT GLOWS ─── */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500 opacity-[0.04] blur-[150px] rounded-full pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400 opacity-[0.03] blur-[120px] rounded-full pointer-events-none translate-y-1/3" />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="text-center max-w-[800px] mx-auto mb-[80px]">
          {/* Trust Badge */}
          <div className="inline-flex items-center px-[16px] py-[8px] rounded-full bg-navy-800 border border-[var(--indigo-line)] text-lavender-400 text-[12px] font-bold uppercase tracking-[0.1em] mb-[24px] shadow-sm">
            <ShieldCheck size={16} className="mr-2 text-purple-400" />
            Our Quality Promise
          </div>

          <h2 className="text-white font-extrabold text-[36px] md:text-[48px] leading-[1.1] tracking-tight mb-[24px] font-heading">
            How We Verify Every Deal.
          </h2>

          <p className="text-lavender-300 text-[16px] md:text-[18px] leading-[1.7] font-light max-w-[680px] mx-auto">
            We don't just scrape the web. Every coupon on VestoriaHub
            goes through a rigorous 4-step funnel to ensure you never face a
            "Code Invalid" error at checkout again.
          </p>
        </div>

        {/* ─── PROCESS TIMELINE GRID ─── */}
        <div className="relative mt-[60px]">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-[44px] left-[12%] right-[12%] h-[2px] border-t-[2px] border-dashed border-[var(--indigo-line)] z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[40px] lg:gap-[32px]">
            {verificationSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center group cursor-default"
                >
                  {/* ─── ICON NODE ─── */}
                  <div className="w-[88px] h-[88px] rounded-full bg-navy-800 border-[6px] border-navy-900 flex items-center justify-center relative mb-[24px] transition-all duration-500 ease-out group-hover:scale-110 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:shadow-[0_0_32px_rgba(124,92,252,0.2)] z-10">
                    {/* Background Step Number */}
                    <span className="absolute text-[56px] font-extrabold text-navy-600/50 select-none transition-colors duration-500 group-hover:text-purple-500/10 font-heading">
                      0{step.id}
                    </span>

                    {/* Main Icon */}
                    <Icon
                      size={32}
                      className="text-lavender-400 relative z-10 transition-colors duration-500 group-hover:text-purple-400"
                      strokeWidth={2}
                    />
                  </div>

                  {/* ─── CONTENT CARD ─── */}
                  <div className="bg-navy-800/80 backdrop-blur-sm p-[32px_24px] rounded-[24px] flex flex-col items-center text-center w-full h-full transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(6,7,19,0.6)] border border-[var(--indigo-line)] group-hover:border-purple-500/40">
                    {/* Micro-Highlight Pill */}
                    <div className="mb-[20px]">
                      <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider px-[14px] py-[6px] rounded-full shadow-sm">
                        {step.highlight}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-bold text-[20px] leading-[1.3] mb-[12px] transition-colors group-hover:text-purple-300">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lavender-400 text-[14.5px] font-normal leading-[1.65]">
                      {step.description}
                    </p>
                  </div>

                  {/* Mobile Down Arrow Connector (Hidden on Desktop) */}
                  {index !== verificationSteps.length - 1 && (
                    <div className="lg:hidden absolute -bottom-[32px] left-1/2 -translate-x-1/2 z-0">
                      <div className="w-[2px] h-[24px] border-l-[2px] border-dashed border-[var(--indigo-line)]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
