"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  return (
    <div className="min-h-screen bg-[#1A1340] flex items-center justify-center p-4 relative overflow-hidden">
      {/* ─── BACKGROUND DECORATION ─── */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#2D2380] rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF6B35] rounded-full blur-[150px] opacity-20" />

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden shadow-2xl relative z-10">
        {/* ─── LEFT SIDE: BRANDING & ART ─── */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#2D2380] to-[#1A1340] relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[#F4A836] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(244,168,54,0.4)]">
              <ShieldCheck className="text-[#1A1340]" size={24} />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">
              Deal<span className="text-[#F4A836]">Verse</span>
            </span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Manage your <br />
              <span className="text-[#F4A836]">Savings Empire.</span>
            </h1>
            <p className="text-white/60 text-lg max-w-md leading-relaxed">
              Access the command center to curate world-class deals, manage
              affiliate networks, and monitor global shopping trends.
            </p>
          </div>

          <div className="flex items-center gap-4 text-white/40 text-sm font-medium">
            <span>© 2026 Sociantech</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span>v3.4.0-Stable</span>
          </div>
        </div>

        {/* ─── RIGHT SIDE: LOGIN FORM ─── */}
        <div className="p-8 md:p-12 lg:p-16 bg-white flex flex-col justify-center">
          <div className="mb-10 lg:hidden flex justify-center">
            <span className="text-[#1A1340] font-bold text-3xl">
              Deal<span className="text-[#FF6B35]">Verse</span>
            </span>
          </div>

          <div className="max-w-[400px] mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h2 className="text-[32px] font-bold text-[#1A1340] mb-2">
                Welcome Back
              </h2>
              <p className="text-[#7775A0] font-medium">
                Enter your administrative credentials.
              </p>
            </div>

            <form className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-[#1A1340] uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7775A0] group-focus-within:text-[#2D2380] transition-colors">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    placeholder="name@sociantech.com"
                    className="w-full pl-12 pr-4 py-4 bg-[#F7F6FF] border-2 border-transparent rounded-2xl text-[15px] text-[#1A1340] outline-none focus:border-[#2D2380] focus:bg-white transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[13px] font-bold text-[#1A1340] uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    title="Forgot Password"
                    className="text-[13px] font-bold text-[#FF6B35] hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7775A0] group-focus-within:text-[#2D2380] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    className="w-full pl-12 pr-14 py-4 bg-[#F7F6FF] border-2 border-transparent rounded-2xl text-[15px] text-[#1A1340] outline-none focus:border-[#2D2380] focus:bg-white transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7775A0] hover:text-[#1A1340] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <div className="relative flex items-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-[#E0DEF5] rounded-md peer-checked:bg-[#2D2380] peer-checked:border-[#2D2380] transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center text-white scale-0 peer-checked:scale-100 transition-transform">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.5L4.5 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-[14px] font-semibold text-[#7775A0] group-hover:text-[#1A1340] transition-colors">
                  Stay logged in
                </span>
              </label>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#1A1340] hover:bg-[#2D2380] text-[#F4A836] font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 group transition-all active:scale-[0.98]"
              >
                Sign In to Dashboard
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            </form>

            <div className="mt-10">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 text-[#7775A0] font-bold text-sm hover:text-[#1A1340] transition-colors"
              >
                <ChevronLeft size={16} />
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
