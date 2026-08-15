"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  ShieldAlert,
  Globe,
  MapPin,
  Network,
  Lock,
  ArrowRightLeft,
  Route,
  Settings,
  CheckCircle,
  PauseCircle,
  Loader2,
  BookOpen,
  AlertCircle,
} from "lucide-react";

export default function NewFirewallRuleEditor() {
  const router = useRouter();

  // ─── STATUS STATES ────────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ─── DATA STATE (Mapped Strictly to GeoFirewall Schema) ───────────────────
  const [formData, setFormData] = useState({
    ruleName: "",
    blockType: "country", // "country" | "ip_address" | "asn_cidr"
    value: "",
    action: "block", // "block" | "redirect"
    redirectUrl: "",
    scope: "global", // "global" | "routes"
    targetRoutes: "", // Stored as string in UI, converted to array on submit
    status: "active", // "active" | "inactive"
    reason: "",
  });

  // ─── HANDLERS ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (errorMessage) setErrorMessage(null);
  };

  const handleStatusChange = (newStatus) => {
    setFormData((prev) => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Client-Side Validation
    if (formData.action === "redirect" && !formData.redirectUrl.trim()) {
      setErrorMessage("Redirect Action requires a valid Destination URL.");
      setIsSubmitting(false);
      return;
    }

    if (formData.scope === "routes" && !formData.targetRoutes.trim()) {
      setErrorMessage("Route Scope requires at least one Target Route.");
      setIsSubmitting(false);
      return;
    }

    // 2. Schema Normalization & Payload Prep
    const payload = {
      ...formData,
      // Normalize country to uppercase perfectly for Vercel req.geo
      value:
        formData.blockType === "country"
          ? formData.value.toUpperCase().trim()
          : formData.value.trim(),

      // Clean up irrelevant fields based on selection to keep DB clean
      redirectUrl:
        formData.action === "block" ? "" : formData.redirectUrl.trim(),

      // Convert comma-separated string to an array of routes with leading slashes
      targetRoutes:
        formData.scope === "global"
          ? []
          : formData.targetRoutes
              .split(",")
              .map((r) => {
                const route = r.trim();
                if (!route) return null;
                return route.startsWith("/") ? route : `/${route}`;
              })
              .filter(Boolean), // Removes any nulls from empty commas
    };

    // 3. API Submission
    try {
      // Pointing to the specific API route we built for the Admin panel
      const response = await fetch("/api/admin/geo-firewall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save the firewall rule.");
      }

      // 4. Success Handling
      setSuccessMessage("Firewall rule successfully deployed to Edge.");

      // Brief delay so the user can read the success message before routing
      setTimeout(() => {
        router.push("/admin/firewall");
        router.refresh(); // Force Next.js to re-fetch the list data
      }, 1500);
    } catch (error) {
      console.error("[SUBMIT_RULE_ERROR]:", error);
      setErrorMessage(error.message || "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── UI COMPONENTS ───────────────────────────────────────────────────────
  const StatusToggle = ({
    label,
    value,
    current,
    onClick,
    activeColor,
    activeBg,
    icon: Icon,
  }) => (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-[1.5px] font-semibold text-[13px] transition-all flex-1 ${
        current === value
          ? `border-${activeColor} ${activeBg} text-${activeColor} shadow-sm`
          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF] hover:text-[#1A1340]"
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        {/* ─── NOTIFICATIONS BANNERS ─── */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-[#FCEBEB] border border-[#E24B4A]/30 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="text-[#E24B4A] shrink-0" />
            <p className="text-[14px] text-[#E24B4A] font-medium">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-[#E1F5EE] border border-[#22B07D]/30 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle size={20} className="text-[#22B07D] shrink-0" />
            <p className="text-[14px] text-[#22B07D] font-medium">
              {successMessage}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ─── HEADER ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sticky top-0 z-20 bg-[#F7F6FF]/90 backdrop-blur-md py-4 border-b border-[#E0DEF5]/50">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/firewall"
                className="p-2 border border-[#E0DEF5] rounded-lg text-[#7775A0] hover:text-[#1A1340] hover:bg-white bg-white shadow-sm transition-all"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-[24px] font-bold text-[#1A1340] leading-tight flex items-center gap-2">
                  <ShieldAlert size={24} className="text-[#E24B4A]" />
                  Create Firewall Rule
                </h1>
                <p className="text-[#7775A0] text-[14px]">
                  Configure edge-level access restrictions for the middleware.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={
                isSubmitting ||
                !!successMessage ||
                !formData.ruleName ||
                !formData.value
              }
              className={`flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-all duration-150 ${
                isSubmitting ||
                !!successMessage ||
                !formData.ruleName ||
                !formData.value
                  ? "bg-[#FF6B35]/40 text-white cursor-not-allowed"
                  : "bg-[#FF6B35] hover:bg-[#e05520] text-white"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : successMessage ? (
                <CheckCircle size={18} />
              ) : (
                <Save size={18} />
              )}
              {successMessage ? "Deployed Successfully" : "Deploy Rule to Edge"}
            </button>
          </div>

          {/* ─── FORM LAYOUT ─── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* ─── LEFT COLUMN (Identity & Target) ─── */}
            <div className="space-y-6">
              {/* Identity */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Settings size={18} className="text-[#2D2380]" /> Identity &
                  Audit
                </h2>

                <div>
                  <label className="block text-[13px] font-bold text-[#1A1340] mb-2 uppercase tracking-wide">
                    Rule Name <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="ruleName"
                    value={formData.ruleName}
                    onChange={handleChange}
                    placeholder="e.g. Block Malicious IP Cluster"
                    maxLength={120}
                    required
                    className="w-full px-4 py-2.5 bg-[#F7F6FF] border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] font-bold text-[#1A1340] focus:border-[#2D2380] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#1A1340] mb-1.5">
                    Internal Reason / Notes{" "}
                    <span className="text-[#7775A0] font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Why is this rule being added? (e.g. High chargeback rate, spam bot detected...)"
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[13px] text-[#7775A0] focus:border-[#2D2380] outline-none resize-none"
                  />
                </div>

                <div className="pt-2 border-t border-[#F7F6FF]">
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                    Rule Status
                  </label>
                  <div className="flex gap-3">
                    <StatusToggle
                      label="Active (Live)"
                      value="active"
                      current={formData.status}
                      onClick={handleStatusChange}
                      activeColor="[#22B07D]"
                      activeBg="bg-[#E1F5EE]"
                      icon={CheckCircle}
                    />
                    <StatusToggle
                      label="Inactive (Paused)"
                      value="inactive"
                      current={formData.status}
                      onClick={handleStatusChange}
                      activeColor="[#7775A0]"
                      activeBg="bg-[#F7F6FF]"
                      icon={PauseCircle}
                    />
                  </div>
                </div>
              </div>

              {/* Target Definition */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <MapPin size={18} className="text-[#2D2380]" /> Target
                  Definition
                </h2>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                    What are we restricting?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          blockType: "country",
                          value: "",
                        })
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-[1.5px] transition-colors ${
                        formData.blockType === "country"
                          ? "border-[#2D2380] bg-[#EEEDFE] text-[#2D2380]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF]"
                      }`}
                    >
                      <Globe size={18} className="mb-1" />
                      <span className="text-[12px] font-bold">Country</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          blockType: "ip_address",
                          value: "",
                        })
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-[1.5px] transition-colors ${
                        formData.blockType === "ip_address"
                          ? "border-[#E24B4A] bg-[#FCEBEB] text-[#E24B4A]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF]"
                      }`}
                    >
                      <MapPin size={18} className="mb-1" />
                      <span className="text-[12px] font-bold">IP Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          blockType: "asn_cidr",
                          value: "",
                        })
                      }
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border-[1.5px] transition-colors ${
                        formData.blockType === "asn_cidr"
                          ? "border-[#F4A836] bg-[#FAEEDA] text-[#BA7517]"
                          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF]"
                      }`}
                    >
                      <Network size={18} className="mb-1" />
                      <span className="text-[12px] font-bold">
                        Server Subnet
                      </span>
                    </button>
                  </div>
                </div>

                <div className="animate-in fade-in">
                  <label className="block text-[13px] font-bold text-[#1A1340] mb-1.5">
                    Target Value <span className="text-[#E24B4A]">*</span>
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder={
                      formData.blockType === "country"
                        ? "Enter 2-letter ISO code (e.g. RU, PK)"
                        : formData.blockType === "ip_address"
                          ? "e.g. 192.168.1.1"
                          : "e.g. 192.168.1.0/24"
                    }
                    required
                    className={`w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] font-mono outline-none transition-all ${
                      formData.blockType === "country" ? "uppercase" : ""
                    }`}
                  />
                  {formData.blockType === "country" && (
                    <p className="text-[11px] text-[#7775A0] mt-1.5">
                      Must be a valid 2-letter ISO Alpha-2 code.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN (Enforcement & Scope) ─── */}
            <div className="space-y-6">
              {/* Enforcement Action */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <ShieldAlert size={18} className="text-[#E24B4A]" />{" "}
                  Enforcement Action
                </h2>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                    Middleware Response
                  </label>
                  <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          action: "block",
                          redirectUrl: "",
                        })
                      }
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-md transition-colors ${
                        formData.action === "block"
                          ? "bg-[#E24B4A] text-white shadow-sm"
                          : "text-[#7775A0] hover:text-[#1A1340]"
                      }`}
                    >
                      <Lock size={16} /> Hard Block (403)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, action: "redirect" })
                      }
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-md transition-colors ${
                        formData.action === "redirect"
                          ? "bg-white text-[#2D2380] border border-[#E0DEF5] shadow-sm"
                          : "text-[#7775A0] hover:text-[#1A1340]"
                      }`}
                    >
                      <ArrowRightLeft size={16} /> Soft Redirect
                    </button>
                  </div>
                </div>

                {formData.action === "redirect" && (
                  <div className="p-4 bg-[#EEEDFE]/50 border border-[#4A3DBF]/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[13px] font-bold text-[#2D2380] mb-1.5">
                      Redirect Destination URL{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </label>
                    <input
                      type="text"
                      name="redirectUrl"
                      value={formData.redirectUrl}
                      onChange={handleChange}
                      placeholder="e.g. /not-available or /store/local-deals"
                      required={formData.action === "redirect"}
                      className="w-full px-4 py-2.5 bg-white border border-[#E0DEF5] rounded-lg text-[13px] font-mono outline-none focus:border-[#2D2380]"
                    />
                    <p className="text-[11px] text-[#7775A0] mt-1.5">
                      Where should users from this target be routed instead?
                    </p>
                  </div>
                )}
              </div>

              {/* Scope (Where does it apply) */}
              <div className="bg-white border border-[#E0DEF5] rounded-xl p-6 shadow-sm space-y-5">
                <h2 className="text-[16px] font-bold text-[#1A1340] flex items-center gap-2 border-b border-[#E0DEF5] pb-4">
                  <Route size={18} className="text-[#2D2380]" /> Rule Scope
                </h2>

                <div>
                  <label className="block text-[12px] font-bold text-[#7775A0] uppercase mb-2">
                    Apply Restriction To
                  </label>
                  <div className="flex bg-[#F7F6FF] p-1 rounded-lg border border-[#E0DEF5]">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          scope: "global",
                          targetRoutes: "",
                        })
                      }
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-md transition-colors ${
                        formData.scope === "global"
                          ? "bg-white text-[#2D2380] border border-[#E0DEF5] shadow-sm"
                          : "text-[#7775A0] hover:text-[#1A1340]"
                      }`}
                    >
                      <Globe size={16} /> Entire Website
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, scope: "routes" })
                      }
                      className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-md transition-colors ${
                        formData.scope === "routes"
                          ? "bg-white text-[#2D2380] border border-[#E0DEF5] shadow-sm"
                          : "text-[#7775A0] hover:text-[#1A1340]"
                      }`}
                    >
                      <Route size={16} /> Specific Routes
                    </button>
                  </div>
                </div>

                {formData.scope === "routes" && (
                  <div className="p-4 bg-[#F7F6FF] border border-[#E0DEF5] rounded-lg animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[13px] font-bold text-[#1A1340] mb-1.5">
                      Target Routes <span className="text-[#E24B4A]">*</span>
                    </label>
                    <p className="text-[11px] text-[#7775A0] mb-2">
                      Enter paths separated by commas. The system will
                      auto-format them.
                    </p>
                    <textarea
                      name="targetRoutes"
                      value={formData.targetRoutes}
                      onChange={handleChange}
                      placeholder="e.g. /admin, /api/private, /exclusive-deals"
                      rows={3}
                      required={formData.scope === "routes"}
                      className="w-full px-4 py-2 bg-white border border-[#E0DEF5] rounded-lg text-[13px] font-mono text-[#2D2380] outline-none resize-none focus:border-[#2D2380]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* ─── QUICK FIELD GUIDE ─── */}
        <div className="mt-12 bg-[#1A1340] border border-[#2D2380] rounded-xl p-6 md:p-8 shadow-lg text-white">
          <div className="flex items-center gap-3 mb-6 border-b border-[rgba(255,255,255,0.1)] pb-4">
            <BookOpen size={24} className="text-[#F4A836]" />
            <h2 className="text-[20px] font-bold text-white">
              Firewall Configuration Guide
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Target Types
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-white">Country:</span>{" "}
                Blocks traffic from a specific country using its 2-letter code
                (e.g., <code>RU</code> for Russia).
                <br />
                <span className="font-semibold text-white">
                  IP Address:
                </span>{" "}
                Blocks a single specific user/server (e.g.,{" "}
                <code>192.168.1.1</code>). Useful for stopping known scrapers.
                <br />
                <span className="font-semibold text-white">
                  Server Subnet (ASN):
                </span>{" "}
                Blocks entire clusters of servers. Usually used to block VPNs or
                Data Centers.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-[#F4A836] font-bold text-[14px]">
                Block vs. Redirect
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed">
                <span className="font-semibold text-[#E24B4A]">
                  Hard Block:
                </span>{" "}
                Best for malicious traffic. Instantly kills the connection with
                a 403 error. Doesn't load any graphics.
                <br />
                <span className="font-semibold text-[#22B07D]">
                  Soft Redirect:
                </span>{" "}
                Best for regional compliance. If a deal is only for the US, you
                can redirect UK users to a friendly <code>/uk-deals</code> page
                instead of showing an error.
              </p>
            </div>

            <div className="space-y-1 md:col-span-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] p-4 rounded-lg">
              <h3 className="text-white font-bold text-[14px] flex items-center gap-2">
                <Route size={16} /> Understanding Route Scope
              </h3>
              <p className="text-[13px] text-[#E0DEF5] leading-relaxed mt-2">
                If you select{" "}
                <span className="font-bold text-white">Entire Website</span>,
                the targeted users cannot see the homepage or any other link. If
                you select{" "}
                <span className="font-bold text-white">Specific Routes</span>,
                you can protect sensitive areas. For example, you can block all
                non-US countries from accessing the <code>/admin</code> paths,
                while letting them browse the main deals website normally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
