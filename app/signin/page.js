"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.error || "The email or password you entered is incorrect.";
        setErrorMessage(errorText);
        setPassword("");

        Swal.fire({
          icon: "error",
          title: "Authentication Failed",
          text: errorText,
          confirmButtonColor: "#8467D7",
          background: "#0f1722",
          color: "#FFFFFF",
          iconColor: "#F87171",
          customClass: {
            popup: "rounded-[16px] border border-[#33383e]",
            confirmButton: "rounded-[8px] px-6 py-2.5 font-bold text-white",
          },
        });
        return;
      }

      // Store user identity locally for UI components
      localStorage.setItem("adminuser", JSON.stringify(data.user));

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Authenticated",
        text: `Welcome back, ${data.user?.name || "Admin"}!`,
        showConfirmButton: false,
        timer: 1500,
        background: "#0f1722",
        color: "#FFFFFF",
        iconColor: "#8467D7",
      }).then(() => {
        router.push("/admin");
        router.refresh();
      });
    } catch (err) {
      const netError = "Unable to reach the authentication server. Please check your connection.";
      setErrorMessage(netError);

      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: netError,
        confirmButtonColor: "#8467D7",
        background: "#0f1722",
        color: "#FFFFFF",
        iconColor: "#F87171",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eff3f8] px-4 py-[40px] font-sans relative overflow-hidden">
      {/* Ambient background blur elements */}
      <div className="absolute -top-[160px] -right-[160px] w-[420px] h-[420px] rounded-full bg-[#8467D7]/[0.08] pointer-events-none blur-[60px]" />
      <div className="absolute -bottom-[180px] -left-[140px] w-[380px] h-[380px] rounded-full bg-[#8467D7]/[0.05] pointer-events-none blur-[60px]" />

      <div className="relative w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out">
        {/* Top Badge */}
        <div className="mb-[24px] text-center flex justify-center">
          <span className="inline-flex items-center gap-[8px] rounded-[6px] px-[12px] py-[6px] text-[11px] font-bold uppercase tracking-[0.1em] bg-[#8467D7] text-white shadow-lg shadow-[#8467D7]/20">
            <span className="h-[6px] w-[6px] rounded-full bg-[#F0E6F6] animate-pulse" />
            Pie • Secure Portal
          </span>
        </div>

        {/* Login Card */}
        <div className="relative rounded-[24px] border border-[#33383e] bg-[#0f1722] px-[32px] py-[40px] shadow-[0_20px_60px_rgba(3,4,10,0.6)]">
          {/* Header */}
          <div className="text-center flex flex-col items-center gap-[8px] mb-[32px]">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-[#16202f] border border-[#33383e] flex items-center justify-center mb-[4px]">
              <Sparkles size={22} className="text-[#8467D7]" />
            </div>
            <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-white leading-none">
              Admin Access
            </h1>
            <p className="text-[14px] text-[#9fadbb]">
              Secure management for deals, stores, and content.
            </p>
          </div>

          {/* Form Layout */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-[24px]" noValidate>
            {/* Email Input Container */}
            <div className="flex flex-col gap-[8px]">
              <label
                htmlFor="admin-email"
                className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#9fadbb]"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none">
                  <Mail size={18} className="text-[#9fadbb] opacity-70" />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="email"
                  className={`w-full h-[48px] rounded-[8px] border-[1.5px] bg-[#080d14] pl-[44px] pr-[16px] text-[14px] text-white placeholder-[#9fadbb]/60 focus:outline-none focus:ring-[3px] transition-all duration-200 disabled:opacity-60 ${
                    errorMessage
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#33383e] focus:border-[#8467D7] focus:ring-[#8467D7]/10"
                  }`}
                  placeholder="name@takemeout.com"
                />
              </div>
            </div>

            {/* Password Input Container */}
            <div className="flex flex-col gap-[8px]">
              <label
                htmlFor="admin-password"
                className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#9fadbb]"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-[16px] flex items-center pointer-events-none">
                  <Lock size={18} className="text-[#9fadbb] opacity-70" />
                </span>
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  autoComplete="current-password"
                  className={`w-full h-[48px] rounded-[8px] border-[1.5px] bg-[#080d14] pl-[44px] pr-[44px] text-[14px] text-white placeholder-[#9fadbb]/60 focus:outline-none focus:ring-[3px] transition-all duration-200 disabled:opacity-60 ${
                    errorMessage
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/10"
                      : "border-[#33383e] focus:border-[#8467D7] focus:ring-[#8467D7]/10"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  className="absolute inset-y-0 right-0 pr-[16px] flex items-center text-[#9fadbb] hover:text-[#8467D7] transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errorMessage && (
                <span className="flex items-center gap-[6px] text-[12px] text-red-400 font-medium mt-[2px]">
                  <AlertCircle size={13} /> {errorMessage}
                </span>
              )}
            </div>

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={submitting}
              className="mt-[8px] w-full h-[48px] rounded-[8px] bg-[#8467D7] hover:bg-[#9B7EE8] text-white font-semibold text-[16px] flex items-center justify-center gap-[8px] shadow-[0_8px_24px_rgba(132,103,215,0.2)] transition-all duration-200 hover:-translate-y-[2px] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-[3px] focus-visible:ring-[#8467D7]/30"
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
          <div className="mt-[32px] pt-[24px] border-t border-[#33383e] flex items-center justify-center gap-[6px] text-[12px] text-[#9fadbb] font-medium">
            <ShieldCheck size={14} className="text-[#8467D7]" />
            Encrypted Connection • Restricted Access
          </div>
        </div>

        {/* Global Copyright Anchor */}
        <p className="mt-[24px] text-[12px] text-center text-[#9fadbb]">
          © {new Date().getFullYear()} takesmeout.com. All rights reserved.
        </p>
      </div>
    </div>
  );
}