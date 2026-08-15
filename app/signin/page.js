"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Tag,
} from "lucide-react";
import Swal from "sweetalert2";

export default function SignInPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState(false);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldError(false);

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Admin Auth Verification
    if (username === "admin" && password === "VestoriaHub5248@") {
      localStorage.setItem("adminuser", JSON.stringify({ username }));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Authenticated",
        text: "Welcome back to the admin portal.",
        showConfirmButton: false,
        timer: 1500,
        background: "#162B24",
        color: "#F8F0E5",
        iconColor: "#D9A441",
        customClass: {
          popup: "rounded-xl border border-[#25473C]",
        },
      }).then(() => {
        router.push("/admin");
      });
    } else {
      setFieldError(true);
      Swal.fire({
        icon: "error",
        title: "Authentication Failed",
        text: "The username or password you entered is incorrect.",
        confirmButtonColor: "#D9A441",
        background: "#162B24",
        color: "#F8F0E5",
        iconColor: "#C1432F",
        customClass: {
          popup: "rounded-2xl border border-[#25473C]",
          confirmButton: "rounded-lg px-6 py-2.5 font-bold !text-[#16241F]",
        },
      });
      setPassword("");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1612] px-4 py-12 font-sans relative overflow-hidden">
      {/* ─── AMBIENT BACKGROUND GLOW ACCENTS ─── */}
      <div className="absolute -top-32 -right-32 w-[450px] h-[450px] rounded-full bg-[#D9A441]/10 pointer-events-none blur-[140px]" />
      <div className="absolute -bottom-32 -left-32 w-[450px] h-[450px] rounded-full bg-[#1C352D]/80 pointer-events-none blur-[120px]" />

      <div className="relative w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-6 duration-500 ease-out z-10">
        
        {/* ─── TOP BRAND BADGE ─── */}
        <div className="mb-6 text-center flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-heading font-extrabold uppercase tracking-widest bg-[#162B24] !text-[#D9A441] border border-[#25473C] shadow-lg">
            <span className="h-2 w-2 rounded-full bg-[#D9A441] animate-pulse" />
            VestoriaHub • Secure Portal
          </span>
        </div>

        {/* ─── LOGIN CARD ─── */}
        <div className="relative rounded-[24px] border-2 border-[#25473C] bg-[#10201B] px-6 sm:px-8 py-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#162B24] border border-[#25473C] flex items-center justify-center text-[#D9A441] shadow-inner mb-1">
              <Tag size={22} />
            </div>
            
            <h1 className="text-[24px] sm:text-[26px] font-heading font-extrabold tracking-tight !text-[#FDFBF7] leading-tight">
              Admin Access
            </h1>
            
            <p className="text-[13.5px] !text-[#A8C3B0] font-normal">
              Secure control for deals, stores, and content.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            
            {/* Username Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="admin-username"
                className="text-[11.5px] font-heading font-extrabold tracking-wider uppercase !text-[#D5E4D9]"
              >
                Username
              </label>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User size={17} className="!text-[#8A8F8C]" />
                </span>
                
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="username"
                  className={`w-full h-[46px] rounded-xl border-2 bg-[#162B24] pl-10 pr-4 text-[14px] !text-[#FDFBF7] placeholder-[#8A8F8C] focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-60 ${
                    fieldError
                      ? "border-[#C1432F] focus:border-[#C1432F] focus:ring-[#C1432F]/15"
                      : "border-[#25473C] focus:border-[#D9A441] focus:ring-[#D9A441]/15"
                  }`}
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="admin-password"
                className="text-[11.5px] font-heading font-extrabold tracking-wider uppercase !text-[#D5E4D9]"
              >
                Password
              </label>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={17} className="!text-[#8A8F8C]" />
                </span>
                
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="current-password"
                  className={`w-full h-[46px] rounded-xl border-2 bg-[#162B24] pl-10 pr-10 text-[14px] !text-[#FDFBF7] placeholder-[#8A8F8C] focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-60 ${
                    fieldError
                      ? "border-[#C1432F] focus:border-[#C1432F] focus:ring-[#C1432F]/15"
                      : "border-[#25473C] focus:border-[#D9A441] focus:ring-[#D9A441]/15"
                  }`}
                  placeholder="Enter admin password"
                />
                
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center !text-[#8A8F8C] hover:!text-[#D9A441] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {fieldError && (
                <span className="flex items-center gap-1 text-[12px] !text-[#C1432F] font-semibold mt-1">
                  <AlertCircle size={13} /> Incorrect username or password.
                </span>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full h-[48px] rounded-xl bg-gradient-to-r from-[#D9A441] via-[#E5B558] to-[#D9A441] hover:from-[#E5B558] hover:to-[#D9A441] !text-[#16241F] font-heading font-bold text-[15px] flex items-center justify-center gap-2 shadow-[0_6px_20px_rgba(217,164,65,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed focus:outline-none"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin text-[#16241F]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </form>

          {/* Security Subtext */}
          <div className="mt-8 pt-6 border-t border-[#25473C] flex items-center justify-center gap-1.5 text-[11.5px] !text-[#A8C3B0] font-mono font-medium">
            <ShieldCheck size={14} className="text-[#D9A441]" />
            <span>Encrypted Session • Restricted Admin Access</span>
          </div>
        </div>

        {/* Global Copyright Anchor */}
        <p className="mt-6 text-[12px] text-center !text-[#8A8F8C] font-mono">
          © {new Date().getFullYear()} VestoriaHub.com. All rights reserved.
        </p>
      </div>
    </div>
  );
}