"use client";

import React, { useState } from "react";
import {
  Mail,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

export default function CTA() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) return;

    setIsSubmitting(true);

    // Simulate an API call for professional UX
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // SweetAlert2 Success Toast matching Body Gym Dark theme style
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Welcome to VestoriaHub",
        text: "You have successfully subscribed to our newsletter.",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#13152B", // navy-600 (Surface)
        color: "#FFFFFF",
        iconColor: "#34D399", // success token
        showClass: {
          popup: "animate__animated animate__slideInRight animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutUp animate__faster",
        },
      });

      setEmail("");
    } catch (error) {
      // Professional Error Handling
      console.error("Subscription failed:", error);
      Swal.fire({
        icon: "error",
        title: "Subscription Failed",
        text: "Something went wrong on our end. Please try again later.",
        confirmButtonColor: "#7C5CFC", // purple-500 (Primary CTA)
        background: "#13152B", // navy-600
        color: "#FFFFFF",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Base Section: Dark background matching the global theme
    <section className="bg-[var(--color-background)] py-[96px] relative font-sans border-t border-[var(--color-border)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Floating CTA Card: Navy Surface Background */}
        <div className="relative bg-[var(--color-surface)] rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(3,4,10,0.6)] border border-[var(--color-border)] animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          {/* Decorative Background Glows: Soft Purple/Secondary to keep the dark background dynamic */}
          <div className="absolute -top-[50%] -left-[10%] w-[300px] h-[300px] rounded-full bg-[var(--color-primary)] opacity-[0.15] blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-[50%] -right-[10%] w-[400px] h-[400px] rounded-full bg-[var(--color-secondary)] opacity-[0.10] blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between p-[32px] sm:p-[48px] lg:p-[64px] gap-[48px] lg:gap-[64px]">
            {/* ── Left Content Area ── */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Highlight Badge */}
              <div className="inline-flex items-center gap-[6px] px-[12px] py-[6px] rounded-[6px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-[0.08em] mb-[24px] border border-[var(--color-primary)]/20 backdrop-blur-sm">
                <Mail size={14} strokeWidth={2.5} />
                Weekly Newsletter
              </div>

              {/* Main Headline */}
              <h2 className="text-[var(--color-text-primary)] font-extrabold text-[36px] md:text-[48px] leading-[1.2] tracking-tight mb-[16px]">
                Never Miss a{" "}
                <span className="text-[var(--color-primary)] italic">
                  Price Drop.
                </span>
              </h2>

              {/* Subtext */}
              <p className="text-[var(--color-text-secondary)] text-[16px] leading-[1.7] mb-[32px] max-w-[500px] mx-auto lg:mx-0 font-medium">
                Join 1.5M+ smart shoppers. Get VestoriaHub best
                verified coupons, curated discounts, and expert shopping guides
                delivered straight to your inbox every Friday.
              </p>

              {/* Trust Features */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-[24px] gap-y-[12px] text-[var(--color-text-primary)] text-[14px] font-bold">
                <span className="flex items-center gap-[6px]">
                  <CheckCircle
                    size={18}
                    className="text-[var(--color-primary)]"
                    strokeWidth={2.5}
                  />
                  100% Free
                </span>
                <span className="flex items-center gap-[6px]">
                  <CheckCircle
                    size={18}
                    className="text-[var(--color-primary)]"
                    strokeWidth={2.5}
                  />
                  Verified Codes
                </span>
                <span className="flex items-center gap-[6px]">
                  <ShieldCheck
                    size={18}
                    className="text-[var(--color-primary)]"
                    strokeWidth={2.5}
                  />
                  No Spam, Ever.
                </span>
              </div>
            </div>

            {/* ── Right Form Area ── */}
            <div className="w-full lg:w-5/12 max-w-[440px] mx-auto lg:mx-0">
              <div className="bg-[var(--color-navy-900)] rounded-[16px] p-[32px] shadow-[0_24px_64px_rgba(3,4,10,0.5)] border border-[var(--color-border)]">
                <h3 className="text-[var(--color-text-primary)] font-extrabold text-[24px] leading-[1.2] mb-[8px]">
                  Get the Best Deals
                </h3>
                <p className="text-[var(--color-text-secondary)] text-[14px] leading-[1.7] mb-[24px] font-medium">
                  Subscribe to unlock exclusive member-only discounts.
                </p>

                <form
                  className="flex flex-col gap-[16px]"
                  onSubmit={handleSubscribe}
                >
                  {/* Email Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none">
                      <Mail
                        size={18}
                        className="text-[var(--color-lavender-500)]"
                      />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSubmitting}
                      className="block w-full h-[48px] pl-[44px] pr-[16px] rounded-[8px] border-[1.5px] border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)] placeholder-[var(--color-lavender-500)] font-medium text-[14px] focus:outline-none focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/20 transition-all duration-200 disabled:opacity-60"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  {/* Submit Button: Primary Purple */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[48px] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary)]/60 text-white font-bold text-[16px] rounded-[8px] transition-all duration-200 flex items-center justify-center gap-[8px] group hover:shadow-[0_8px_24px_rgba(124,92,252,0.3)]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      <>
                        Subscribe Now
                        <ArrowRight
                          size={18}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer Terms: Lavender text with Purple Links */}
                <p className="text-center text-[var(--color-text-secondary)] text-[12px] mt-[24px] leading-[1.7] font-medium">
                  By subscribing, you agree to our{" "}
                  <a
                    href="/terms"
                    className="text-[var(--color-primary)] font-bold hover:underline"
                  >
                    Terms
                  </a>{" "}
                  &{" "}
                  <a
                    href="/privacy"
                    className="text-[var(--color-primary)] font-bold hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
