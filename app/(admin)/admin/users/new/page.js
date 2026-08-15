"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  UserPlus,
  Mail,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  UserCircle,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const NewUserPage = () => {
  // ─── STATE MAPPED TO USERSCHEMA ──────────────────────────────────────────

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor", // Default per schema
    status: "active",
    avatarUrl: "",
    access: {
      canAccessAdmin: true,
      canViewAnalytics: false,
      canManageStores: false,
    },
    emailVerified: false,
  });

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

  const generatePassword = () => {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let retVal = "";
    for (let i = 0; i < 12; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData((prev) => ({ ...prev, password: retVal }));
    setShowPassword(true);
  };

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────

  const PermissionCard = ({ title, desc, checked, onToggle, icon: Icon }) => (
    <div
      onClick={onToggle}
      className={`p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-4 ${
        checked
          ? "bg-[#EEEDFE] border-[#2D2380] shadow-sm"
          : "bg-white border-[#E0DEF5] hover:border-[#4A3DBF]"
      }`}
    >
      <div
        className={`mt-1 p-2 rounded-lg ${checked ? "bg-[#2D2380] text-white" : "bg-[#F7F6FF] text-[#7775A0]"}`}
      >
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <h4
          className={`text-[14px] font-bold ${checked ? "text-[#2D2380]" : "text-[#1A1340]"}`}
        >
          {title}
        </h4>
        <p className="text-[12px] text-[#7775A0] leading-snug mt-0.5">{desc}</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? "bg-[#2D2380] border-[#2D2380]" : "border-[#E0DEF5]"}`}
      >
        {checked && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1000px] mx-auto">
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
              <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                <UserPlus size={24} className="text-[#F4A836]" />
                Add New Staff Member
              </h1>
              <p className="text-[#7775A0] text-[14px]">
                Create a new account and define granular access permissions.
              </p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors duration-150">
            <Save size={18} />
            Create Account
          </button>
        </div>

        {/* ─── FORM GRID ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Account Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Basics */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                <UserCircle size={18} className="text-[#2D2380]" />
                Profile Identity
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Full Name <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Sarah Jenkins"
                    maxLength={120}
                    required
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Login Email <span className="text-[#E24B4A]">*</span>
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
                      onChange={handleInputChange}
                      placeholder="email@sociantech.com"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none transition-all lowercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5 flex justify-between">
                  <span>
                    Initial Password <span className="text-[#E24B4A]">*</span>
                  </span>
                  <button
                    onClick={generatePassword}
                    className="text-[#2D2380] text-[12px] font-bold flex items-center gap-1 hover:underline"
                  >
                    <RefreshCw size={12} /> Generate Strong Password
                  </button>
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7775A0]"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 characters"
                    required
                    className="w-full pl-10 pr-12 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] font-mono text-[#1A1340] focus:border-[#2D2380] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7775A0] hover:text-[#1A1340]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[11px] text-[#7775A0] mt-2 flex items-center gap-1.5 leading-snug">
                  <AlertCircle size={12} />
                  Passwords are encrypted using bcrypt (cost factor 12) before
                  storage.
                </p>
              </div>
            </div>

            {/* Granular Access (access sub-doc) */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-5">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                <Shield size={18} className="text-[#2D2380]" />
                Granular Access Permissions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <PermissionCard
                  title="Admin Dashboard Access"
                  desc="Allows user to log into the CMS at /admin. Minimum requirement for staff."
                  icon={ShieldCheck}
                  checked={formData.access.canAccessAdmin}
                  onToggle={() => handleAccessToggle("canAccessAdmin")}
                />
                <PermissionCard
                  title="Analytics & Reports"
                  desc="Access to click-tracking metrics, traffic sources, and conversion logs."
                  icon={Activity}
                  checked={formData.access.canViewAnalytics}
                  onToggle={() => handleAccessToggle("canViewAnalytics")}
                />
                <PermissionCard
                  title="Store & Network Management"
                  desc="Full control over brand identities, affiliate networks, and tracking parameters."
                  icon={Shield}
                  checked={formData.access.canManageStores}
                  onToggle={() => handleAccessToggle("canManageStores")}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Role & Status */}
          <div className="space-y-6">
            {/* Role Assignment */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                <ShieldCheck size={18} className="text-[#2D2380]" />
                System Role
              </h2>

              <div className="space-y-3">
                {[
                  {
                    id: "editor",
                    name: "Editor",
                    desc: "Manages coupons and blogs.",
                    color: "border-[#E0DEF5]",
                  },
                  {
                    id: "admin",
                    name: "Administrator",
                    desc: "Manages all content & stores.",
                    color: "border-[#E0DEF5]",
                  },
                  {
                    id: "super_admin",
                    name: "Super Admin",
                    desc: "Full system & user control.",
                    color: "border-[#1A1340]",
                  },
                ].map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.role === r.id ? "bg-[#1A1340] border-[#1A1340] text-white" : "bg-white border-[#E0DEF5] hover:border-[#4A3DBF]"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.id}
                      checked={formData.role === r.id}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div
                      className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${formData.role === r.id ? "border-[#F4A836] bg-[#F4A836]" : "border-[#E0DEF5]"}`}
                    >
                      {formData.role === r.id && (
                        <div className="w-1.5 h-1.5 bg-[#1A1340] rounded-full" />
                      )}
                    </div>
                    <div>
                      <span
                        className={`block text-[14px] font-bold ${formData.role === r.id ? "text-[#F4A836]" : "text-[#1A1340]"}`}
                      >
                        {r.name}
                      </span>
                      <span
                        className={`text-[11px] ${formData.role === r.id ? "text-white/60" : "text-[#7775A0]"}`}
                      >
                        {r.desc}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Account Lifecycle */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                <RefreshCw size={18} className="text-[#2D2380]" />
                Account Status
              </h2>

              <label className="flex items-center justify-between p-3 border border-[#E0DEF5] rounded-lg cursor-pointer hover:bg-[#F7F6FF]">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1A1340]">
                  <CheckCircle
                    size={16}
                    className={
                      formData.emailVerified
                        ? "text-[#22B07D]"
                        : "text-[#7775A0]"
                    }
                  />
                  Email Pre-Verified
                </div>
                <input
                  type="checkbox"
                  name="emailVerified"
                  checked={formData.emailVerified}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      emailVerified: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#2D2380]"
                />
              </label>

              <div className="pt-2">
                <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                  Account Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                >
                  <option value="active">Active (Enabled)</option>
                  <option value="disabled">Disabled (No Login)</option>
                </select>
              </div>
            </div>

            {/* Profile Avatar */}
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)] space-y-4">
              <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-3 mb-2">
                <UserCircle size={18} className="text-[#2D2380]" />
                Avatar URL
              </h2>
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#EEEDFE] border border-[#E0DEF5] flex items-center justify-center overflow-hidden shadow-inner">
                  {formData.avatarUrl ? (
                    <img
                      src={formData.avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#2D2380] font-bold text-[24px]">
                      {formData.name ? formData.name[0].toUpperCase() : "?"}
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] text-[#1A1340] focus:border-[#2D2380] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewUserPage;
