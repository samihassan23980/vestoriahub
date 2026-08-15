"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ShieldCheck,
  Mail,
  Lock,
  UserCircle,
  Activity,
  Clock,
  Unlock,
  Trash2,
  AlertTriangle,
  Key,
  CheckCircle,
  XCircle,
  ShieldAlert,
} from "lucide-react";

const EditUserPage = ({ params }) => {
  // ─── DUMMY DATA MAPPED TO USERSCHEMA ─────────────────────────────────────
  // Simulating fetching user data by ID
  const [formData, setFormData] = useState({
    _id: "usr_004",
    name: "Sarah Jenkins",
    email: "sarah@sociantech.com",
    role: "admin",
    status: "active",
    avatarUrl: "",
    emailVerified: true,
    loginAttempts: 5, // Currently locked out scenario
    lockoutUntil: "2026-04-20T10:00:00Z",
    lastLoginAt: "2026-04-18T14:22:00Z",
    createdAt: "2025-01-10T09:00:00Z",
    access: {
      canAccessAdmin: true,
      canViewAnalytics: true,
      canManageStores: true,
    },
  });

  const isLocked =
    formData.lockoutUntil && new Date(formData.lockoutUntil) > new Date();

  // ─── HANDLERS ────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccessToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      access: { ...prev.access, [field]: !prev.access[field] },
    }));
  };

  const resetLockout = () => {
    setFormData((prev) => ({ ...prev, loginAttempts: 0, lockoutUntil: null }));
  };

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────

  const PermissionItem = ({ title, checked, onToggle, icon: Icon }) => (
    <div
      onClick={onToggle}
      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
        checked
          ? "bg-white border-[#2D2380] shadow-sm"
          : "bg-[#F7F6FF] border-[#E0DEF5] opacity-70"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${checked ? "bg-[#2D2380] text-white" : "bg-white text-[#7775A0]"}`}
        >
          <Icon size={18} />
        </div>
        <span
          className={`text-[14px] font-bold ${checked ? "text-[#1A1340]" : "text-[#7775A0]"}`}
        >
          {title}
        </span>
      </div>
      <div
        className={`w-10 h-5 rounded-full relative transition-colors ${checked ? "bg-[#22B07D]" : "bg-[#7775A0]"}`}
      >
        <div
          className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${checked ? "left-6" : "left-1"}`}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/users"
              className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white transition-colors bg-white shadow-sm"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight">
                  User Profile
                </h1>
                {isLocked && (
                  <span className="px-2 py-0.5 bg-[#FCEBEB] text-[#E24B4A] text-[10px] font-bold uppercase rounded border border-[#E24B4A]/20">
                    Account Locked
                  </span>
                )}
              </div>
              <p className="text-[#7775A0] text-[13px]">
                Member since {new Date(formData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-[#E0DEF5] text-[#E24B4A] hover:bg-[#FCEBEB] px-5 py-2.5 rounded-lg font-bold text-[14px] transition-all">
              <Trash2 size={16} />
              Delete Account
            </button>
            <button className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-2.5 rounded-lg font-bold text-[14px] shadow-sm transition-all">
              <Save size={18} />
              Update Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── LEFT: MAIN SETTINGS (Spans 2) ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-6">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                <UserCircle size={18} className="text-[#2D2380]" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#7775A0] cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                  System Role
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["editor", "admin", "super_admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setFormData({ ...formData, role: r })}
                      className={`py-2 px-3 rounded-lg text-[12px] font-bold uppercase tracking-wider border-[1.5px] transition-all ${formData.role === r ? "bg-[#1A1340] border-[#1A1340] text-[#F4A836]" : "bg-white border-[#E0DEF5] text-[#7775A0] hover:border-[#2D2380]"}`}
                    >
                      {r.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Permissions Engine */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                <ShieldCheck size={18} className="text-[#2D2380]" />
                Access Control List (ACL)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PermissionItem
                  title="Admin Access"
                  checked={formData.access.canAccessAdmin}
                  onToggle={() => handleAccessToggle("canAccessAdmin")}
                  icon={Activity}
                />
                <PermissionItem
                  title="View Analytics"
                  checked={formData.access.canViewAnalytics}
                  onToggle={() => handleAccessToggle("canViewAnalytics")}
                  icon={Clock}
                />
                <PermissionItem
                  title="Manage Stores"
                  checked={formData.access.canManageStores}
                  onToggle={() => handleAccessToggle("canManageStores")}
                  icon={ShieldAlert}
                />
              </div>
            </div>

            {/* Dangerous Actions */}
            <div className="bg-[#FCEBEB] border border-[#E24B4A]/20 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#E24B4A] shadow-sm">
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="text-[#1A1340] font-bold text-[15px]">
                    Security & Credentials
                  </h3>
                  <p className="text-[#7775A0] text-[13px]">
                    Force a password reset email to be sent to this user.
                  </p>
                </div>
              </div>
              <button className="bg-white border border-[#E24B4A] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white px-5 py-2 rounded-lg font-bold text-[13px] transition-all">
                Reset Password
              </button>
            </div>
          </div>

          {/* ─── RIGHT: SIDEBAR AUDIT ─── */}
          <div className="space-y-6">
            {/* Status & Security Health */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
              <h2 className="text-[16px] font-bold text-[#1A1340] mb-4">
                Account Health
              </h2>

              <div className="space-y-4">
                {/* Email Verification Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F6FF]">
                  <span className="text-[13px] font-semibold text-[#1A1340]">
                    Email Verified
                  </span>
                  {formData.emailVerified ? (
                    <CheckCircle size={18} className="text-[#22B07D]" />
                  ) : (
                    <XCircle size={18} className="text-[#FF6B35]" />
                  )}
                </div>

                {/* Brute Force Lock Status */}
                <div
                  className={`p-4 rounded-lg border flex flex-col gap-3 ${isLocked ? "bg-[#FAEEDA] border-[#F4A836]/30" : "bg-[#E1F5EE] border-[#22B07D]/30"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[#1A1340]">
                      Login Status
                    </span>
                    {isLocked ? (
                      <Lock size={16} className="text-[#BA7517]" />
                    ) : (
                      <Unlock size={16} className="text-[#22B07D]" />
                    )}
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed text-[#7775A0]">
                    {isLocked
                      ? `Account locked until ${new Date(formData.lockoutUntil).toLocaleTimeString()} due to ${formData.loginAttempts} failed attempts.`
                      : `Account is healthy. ${formData.loginAttempts} failed attempts recorded.`}
                  </p>
                  {isLocked && (
                    <button
                      onClick={resetLockout}
                      className="w-full bg-[#1A1340] text-[#F4A836] font-bold py-2 rounded text-[12px] hover:bg-[#2D2380] transition-colors"
                    >
                      Unlock Account Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Audit Logs Fragment */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm">
              <h2 className="text-[16px] font-bold text-[#1A1340] mb-4 flex items-center gap-2">
                <Activity size={18} className="text-[#2D2380]" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22B07D] mt-2 shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1340]">
                      Successful Login
                    </p>
                    <p className="text-[11px] text-[#7775A0]">
                      {new Date(formData.lastLoginAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F4A836] mt-2 shrink-0" />
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1340]">
                      Coupon Updated
                    </p>
                    <p className="text-[11px] text-[#7775A0]">
                      Apr 15, 2026 • 10:12 AM
                    </p>
                  </div>
                </div>
              </div>
              <button className="w-full mt-6 py-2 text-[12px] font-bold text-[#2D2380] border border-[#E0DEF5] rounded-lg hover:bg-[#F7F6FF] transition-colors">
                View All Activity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserPage;
