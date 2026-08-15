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

    // Simulate network request
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Admin Auth Logic
    if (username === "admin" && password === "VestoriaHub5248@") {
      localStorage.setItem("adminuser", JSON.stringify({ username }));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Authenticated",
        text: "Welcome back to the dashboard.",
        showConfirmButton: false,
        timer: 1500,
        background: "#13152B", // var(--navy-600) Card bg
        color: "#FFFFFF",      // Primary Text
        iconColor: "#7C5CFC",  // Vivid Purple Core Primary
      }).then(() => {
        router.push("/admin");
      });
    } else {
      setFieldError(true);
      // Professional SweetAlert2 Error Handling aligned with theme specifications
      Swal.fire({
        icon: "error",
        title: "Authentication Failed",
        text: "The username or password you entered is incorrect.",
        confirmButtonColor: "#7C5CFC", // Vivid Purple Accent Button
        background: "#13152B",         // var(--navy-600) Surface
        color: "#FFFFFF",              // White primary text
        iconColor: "#F87171",          // Semantic danger color
        customClass: {
          popup: "rounded-[16px] border border-[var(--indigo-line)]",
          confirmButton: "rounded-[8px] px-6 py-2.5 font-bold text-white",
        },
      });
      setPassword(""); // Clear password field on error
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-800 px-4 py-[40px] font-sans relative overflow-hidden">
      {/* Ambient structural backdrop using the dominant core purple highlight values */}
      <div className="absolute -top-[160px] -right-[160px] w-[420px] h-[420px] rounded-full bg-purple-500/[0.04] pointer-events-none blur-[60px]" />
      <div className="absolute -bottom-[180px] -left-[140px] w-[380px] h-[380px] rounded-full bg-purple-600/[0.05] pointer-events-none blur-[60px]" />

      <div className="relative w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
        {/* Top Badge (Highlight Tag variant mapping to Primary Purple and Navy Accent lines) */}
        <div className="mb-[24px] text-center flex justify-center">
          <span className="inline-flex items-center gap-[8px] rounded-[6px] px-[12px] py-[6px] text-[11px] font-bold uppercase tracking-[0.1em] bg-purple-500 text-white shadow-lg shadow-purple-500/10">
            <span className="h-[6px] w-[6px] rounded-full bg-purple-100 animate-pulse" />
            VestoriaHub • Secure Portal
          </span>
        </div>

        {/* Login Card (Near-black Navy base with Indigo card surface border rules) */}
        <div className="relative rounded-[24px] border border-[var(--indigo-line)] bg-navy-600 px-[32px] py-[40px] shadow-[0_20px_60px_rgba(3,4,10,0.6)]">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-[8px] mb-[32px]">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-navy-500 border border-[var(--indigo-line)] flex items-center justify-center mb-[4px]">
              <Sparkles size={22} className="text-purple-400" />
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white leading-none">
              Admin Access
            </h1>
            <p className="text-[14px] text-lavender-400">
              Secure management for deals, stores, and content.
            </p>
          </div>

          {/* Form Layout */}
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-[24px]"
            noValidate
          >
            {/* Username Input Container */}
            <div className="flex flex-col gap-[8px]">
              <label
                htmlFor="admin-username"
                className="text-[12px] font-bold tracking-[0.06em] uppercase text-lavender-300"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none">
                  <User size={18} className="text-lavender-500" />
                </span>
                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="username"
                  className={`w-full h-[48px] rounded-[8px] border-[1.5px] bg-navy-700 pl-[44px] pr-[16px] text-[14px] text-white placeholder-lavender-500 focus:outline-none focus:ring-[3px] transition-all duration-200 disabled:opacity-60 ${
                    fieldError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[var(--indigo-line)] focus:border-purple-500 focus:ring-purple-500/10"
                  }`}
                  placeholder="Enter admin username"
                />
              </div>
            </div>

            {/* Password Input Container */}
            <div className="flex flex-col gap-[8px]">
              <label
                htmlFor="admin-password"
                className="text-[12px] font-bold tracking-[0.06em] uppercase text-lavender-300"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none">
                  <Lock size={18} className="text-lavender-500" />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="current-password"
                  className={`w-full h-[48px] rounded-[8px] border-[1.5px] bg-navy-700 pl-[44px] pr-[44px] text-[14px] text-white placeholder-lavender-500 focus:outline-none focus:ring-[3px] transition-all duration-200 disabled:opacity-60 ${
                    fieldError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[var(--indigo-line)] focus:border-purple-500 focus:ring-purple-500/10"
                  }`}
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  className="absolute inset-y-0 right-0 pr-[16px] flex items-center text-lavender-500 hover:text-purple-400 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldError && (
                <span className="flex items-center gap-[6px] text-[12px] text-red-400 font-medium mt-[2px]">
                  <AlertCircle size={13} /> Incorrect username or password.
                </span>
              )}
            </div>

            {/* Submit CTA Button (Vivid Purple to Bright Purple Core Action Mapping) */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-[8px] w-full h-[48px] rounded-[8px] bg-purple-500 hover:bg-purple-600 text-white font-semibold text-[16px] flex items-center justify-center gap-[8px] shadow-[0_8px_24px_rgba(124,92,252,0.2)] transition-all duration-200 hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-purple-500/30"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign in to Dashboard"
              )}
            </button>
          </form>

          {/* Footer Security Isolation Note */}
          <div className="mt-[32px] pt-[24px] border-t border-[var(--indigo-line)] flex items-center justify-center gap-[6px] text-[12px] text-lavender-400 font-medium">
            <ShieldCheck size={14} className="text-purple-400" />
            Encrypted Connection • Restricted Access
          </div>
        </div>

        {/* Global Copyright Anchor */}
        <p className="mt-[24px] text-[12px] text-center text-lavender-500">
          © {new Date().getFullYear()} www.vestoriahub.com. All rights reserved.
        </p>
      </div>
    </div>
  );
}