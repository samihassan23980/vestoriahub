/* app/admin/networks/new/page.jsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  Save,
  Network,
  Link as LinkIcon,
  Building,
  UserCircle,
  Percent,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Settings,
  Mail,
  Loader2,
  BookOpen,
  ExternalLink,
} from "lucide-react";

const COLORS = {
  ink: "#1A1340",
  indigo: "#2D2380",
  violet: "#4A3DBF",
  gold: "#F4A836",
  coral: "#FF6B35",
  mist: "#F7F6FF",
  lilac: "#EEEDFE",
  iris: "#E0DEF5",
  slate: "#7775A0",
  success: "#22B07D",
  error: "#E24B4A",
};

const PLACEHOLDER_REGEX = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;

const initialFormData = {
  name: "",
  owner: "",
  websiteUrl: "",
  status: "active",
  trackingParams: "",
  cookieDays: 30,
  commissionRate: 0,
  paymentTerms: "",
  minPayoutUsd: 0,
  contactEmail: "",
  accountManagerName: "",
};

async function getApiErrorMessage(res, fallback = "Something went wrong.") {
  try {
    const data = await res.json();

    if (Array.isArray(data?.details)) {
      return data.details
        .map((item) => {
          if (typeof item === "string") return item;
          return item?.message || item?.field || "";
        })
        .filter(Boolean)
        .join("\n");
    }

    return data?.error || data?.message || data?.details || fallback;
  } catch {
    return fallback;
  }
}

function isValidHttpUrl(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizePayload(formData) {
  return {
    name: formData.name.trim(),
    owner: formData.owner.trim(),
    websiteUrl: formData.websiteUrl.trim(),
    status: formData.status,
    trackingParams: formData.trackingParams.trim(),
    cookieDays: Number(formData.cookieDays || 0),
    commissionRate: Number(formData.commissionRate || 0),
    paymentTerms: formData.paymentTerms.trim(),
    minPayoutUsd: Number(formData.minPayoutUsd || 0),
    contactEmail: formData.contactEmail.trim().toLowerCase(),
    accountManagerName: formData.accountManagerName.trim(),
  };
}

export default function NewNetworkEditor() {
  const router = useRouter();

  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const hasValidPlaceholder = useMemo(
    () => PLACEHOLDER_REGEX.test(formData.trackingParams),
    [formData.trackingParams],
  );

  const websiteUrlValid = useMemo(
    () => isValidHttpUrl(formData.websiteUrl),
    [formData.websiteUrl],
  );

  const formErrors = useMemo(() => {
    const errors = {};

    if (!formData.name.trim()) errors.name = "Network name is required.";
    if (!formData.owner.trim())
      errors.owner = "Owner/company name is required.";

    if (formData.name.length > 120) {
      errors.name = "Network name must be 120 characters or less.";
    }

    if (formData.owner.length > 140) {
      errors.owner = "Owner must be 140 characters or less.";
    }

    if (!websiteUrlValid) {
      errors.websiteUrl = "Website URL must be a valid http/https URL.";
    }

    if (!formData.trackingParams.trim()) {
      errors.trackingParams = "Tracking parameters are required.";
    } else if (!hasValidPlaceholder) {
      errors.trackingParams =
        "Tracking params must contain at least one placeholder like {subId}.";
    }

    const cookieDays = Number(formData.cookieDays);
    if (!Number.isFinite(cookieDays) || cookieDays < 0 || cookieDays > 365) {
      errors.cookieDays = "Cookie days must be between 0 and 365.";
    }

    const commissionRate = Number(formData.commissionRate);
    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      errors.commissionRate = "Commission rate must be between 0 and 100.";
    }

    const minPayoutUsd = Number(formData.minPayoutUsd);
    if (!Number.isFinite(minPayoutUsd) || minPayoutUsd < 0) {
      errors.minPayoutUsd = "Minimum payout cannot be negative.";
    }

    if (formData.paymentTerms.length > 100) {
      errors.paymentTerms = "Payment terms must be 100 characters or less.";
    }

    if (formData.contactEmail.length > 200) {
      errors.contactEmail = "Contact email must be 200 characters or less.";
    }

    if (formData.accountManagerName.length > 140) {
      errors.accountManagerName =
        "Account manager name must be 140 characters or less.";
    }

    return errors;
  }, [formData, hasValidPlaceholder, websiteUrlValid]);

  const canSubmit = Object.keys(formErrors).length === 0 && !isSubmitting;

  useEffect(() => {
    if (!isSubmitting) return;

    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isSubmitting]);

  const markTouched = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const setStatus = (status) => {
    setFormData((prev) => ({ ...prev, status }));
  };

  const showFieldErrors = async () => {
    const errorList = Object.values(formErrors);

    await Swal.fire({
      icon: "error",
      title: "Please fix the form",
      html: `
        <div style="text-align:left">
          <ul style="padding-left:18px;margin:0">
            ${errorList.map((err) => `<li>${err}</li>`).join("")}
          </ul>
        </div>
      `,
      confirmButtonText: "Got it",
      confirmButtonColor: COLORS.error,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      name: true,
      owner: true,
      websiteUrl: true,
      trackingParams: true,
      cookieDays: true,
      commissionRate: true,
      minPayoutUsd: true,
      paymentTerms: true,
      contactEmail: true,
      accountManagerName: true,
    });

    if (!canSubmit) {
      await showFieldErrors();
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = normalizePayload(formData);

      const response = await fetch("/api/admin/affiliate-networks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await getApiErrorMessage(
          response,
          "Failed to create affiliate network.",
        );
        throw new Error(message);
      }

      const json = await response.json().catch(() => ({}));
      const network = json?.data?.network || json?.network;

      await Swal.fire({
        icon: "success",
        title: "Network connected",
        text: "Affiliate network created successfully.",
        confirmButtonText: "Continue",
        confirmButtonColor: COLORS.violet,
      });

      if (network?._id) {
        router.push(`/admin/networks/${network._id}`);
      } else {
        router.push("/admin/networks");
      }

      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Could not save network",
        text: error?.message || "Something went wrong while saving.",
        confirmButtonText: "Got it",
        confirmButtonColor: COLORS.error,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="mx-auto max-w-[1100px]">
        <form onSubmit={handleSubmit}>
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/networks"
                className="rounded-lg border border-[#E0DEF5] bg-white p-2 text-[#7775A0] shadow-sm transition-colors hover:bg-white hover:text-[#1A1340]"
              >
                <ArrowLeft size={20} />
              </Link>

              <div>
                <h1 className="flex items-center gap-2 text-[24px] font-bold leading-tight text-[#1A1340]">
                  <Network size={24} className="text-[#F4A836]" />
                  Connect Affiliate Network
                </h1>
                <p className="text-[14px] text-[#7775A0]">
                  Add a partner network and configure its tracking engine.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-8 py-3 text-[15px] font-bold text-white shadow-sm transition-all duration-150 hover:bg-[#e05520] disabled:cursor-not-allowed disabled:bg-[#FF6B35]/40"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Saving..." : "Save Network"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card
                title="Network Identity"
                icon={<Building size={18} className="text-[#2D2380]" />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Network Display Name"
                    required
                    error={touched.name ? formErrors.name : ""}
                  >
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={() => markTouched("name")}
                      placeholder="e.g. Impact Radius"
                      maxLength={120}
                      required
                      className={inputClass(touched.name && formErrors.name)}
                    />
                  </Field>

                  <Field
                    label="Parent Company / Owner"
                    required
                    error={touched.owner ? formErrors.owner : ""}
                  >
                    <input
                      type="text"
                      name="owner"
                      value={formData.owner}
                      onChange={handleChange}
                      onBlur={() => markTouched("owner")}
                      placeholder="e.g. Impact Tech, Inc."
                      maxLength={140}
                      required
                      className={inputClass(touched.owner && formErrors.owner)}
                    />
                  </Field>
                </div>

                <Field
                  label="Network Homepage URL"
                  error={touched.websiteUrl ? formErrors.websiteUrl : ""}
                >
                  <div className="relative">
                    <input
                      type="url"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      onBlur={() => markTouched("websiteUrl")}
                      placeholder="https://impact.com"
                      className={`${inputClass(
                        touched.websiteUrl && formErrors.websiteUrl,
                      )} pr-10`}
                    />
                    {formData.websiteUrl && websiteUrlValid ? (
                      <a
                        href={formData.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7775A0] hover:text-[#FF6B35]"
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : null}
                  </div>
                </Field>
              </Card>

              <Card
                title="Tracking Parameter Template"
                description="Configure how variables are appended to store affiliate links."
                icon={<LinkIcon size={18} className="text-[#2D2380]" />}
                right={
                  formData.trackingParams.length > 0 ? (
                    <div
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-bold ${
                        hasValidPlaceholder
                          ? "bg-[#E1F5EE] text-[#22B07D]"
                          : "bg-[#FCEBEB] text-[#E24B4A]"
                      }`}
                    >
                      {hasValidPlaceholder ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      {hasValidPlaceholder
                        ? "Valid Template"
                        : "Missing {placeholder}"}
                    </div>
                  ) : null
                }
              >
                <Field
                  label="Parameters String"
                  required
                  error={
                    touched.trackingParams ? formErrors.trackingParams : ""
                  }
                >
                  <input
                    type="text"
                    name="trackingParams"
                    value={formData.trackingParams}
                    onChange={handleChange}
                    onBlur={() => markTouched("trackingParams")}
                    placeholder="e.g. subId1={subId}&clickid={clickId}"
                    maxLength={300}
                    required
                    className={`w-full rounded-lg border-[1.5px] bg-[#F7F6FF] px-4 py-3 font-mono text-[14px] outline-none transition-all ${
                      touched.trackingParams && formErrors.trackingParams
                        ? "border-[#E24B4A] text-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A]"
                        : "border-[#E0DEF5] text-[#1A1340] focus:border-[#2D2380]"
                    }`}
                  />
                </Field>

                <div className="mt-3 rounded-lg border border-[#E0DEF5] bg-[#EEEDFE] p-3">
                  <p className="flex items-start gap-2 text-[12px] font-medium text-[#2D2380]">
                    <AlertCircle
                      size={14}
                      className="mt-0.5 shrink-0 text-[#F4A836]"
                    />
                    <span>
                      <strong>Important:</strong> Include at least one valid
                      placeholder. Examples:
                      <code className="mx-1 rounded bg-white px-1.5 py-0.5 font-bold text-[#F4A836]">
                        {"{subId}"}
                      </code>
                      <code className="mx-1 rounded bg-white px-1.5 py-0.5 font-bold text-[#F4A836]">
                        {"{clickId}"}
                      </code>
                      <code className="mx-1 rounded bg-white px-1.5 py-0.5 font-bold text-[#F4A836]">
                        {"{source}"}
                      </code>
                    </span>
                  </p>
                </div>
              </Card>

              <Card
                title="Account Management"
                icon={<UserCircle size={18} className="text-[#2D2380]" />}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field
                    label="Account Manager Name"
                    icon={<UserCircle size={14} className="text-[#7775A0]" />}
                    error={
                      touched.accountManagerName
                        ? formErrors.accountManagerName
                        : ""
                    }
                  >
                    <input
                      type="text"
                      name="accountManagerName"
                      value={formData.accountManagerName}
                      onChange={handleChange}
                      onBlur={() => markTouched("accountManagerName")}
                      placeholder="e.g. Sarah Jenkins"
                      maxLength={140}
                      className={inputClass(
                        touched.accountManagerName &&
                          formErrors.accountManagerName,
                      )}
                    />
                  </Field>

                  <Field
                    label="Contact Email"
                    icon={<Mail size={14} className="text-[#7775A0]" />}
                    error={touched.contactEmail ? formErrors.contactEmail : ""}
                  >
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      onBlur={() => markTouched("contactEmail")}
                      placeholder="e.g. partners@impact.com"
                      maxLength={200}
                      className={`${inputClass(
                        touched.contactEmail && formErrors.contactEmail,
                      )} lowercase`}
                    />
                  </Field>
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              <Card
                title="Integration Status"
                icon={<Settings size={18} className="text-[#2D2380]" />}
              >
                <div className="flex flex-col gap-3">
                  <StatusButton
                    label="Active (Live & Tracking)"
                    value="active"
                    current={formData.status}
                    onClick={setStatus}
                    color="success"
                  />
                  <StatusButton
                    label="Pending Setup (Testing)"
                    value="pending"
                    current={formData.status}
                    onClick={setStatus}
                    color="gold"
                  />
                  <StatusButton
                    label="Inactive (Paused)"
                    value="inactive"
                    current={formData.status}
                    onClick={setStatus}
                    color="slate"
                  />
                </div>
              </Card>

              <Card
                title="Revenue & Terms"
                icon={<DollarSign size={18} className="text-[#2D2380]" />}
              >
                <Field
                  label="Default Commission Rate (%)"
                  icon={<Percent size={14} className="text-[#7775A0]" />}
                  error={
                    touched.commissionRate ? formErrors.commissionRate : ""
                  }
                  hint="Network baseline rate. Individual stores can override this."
                >
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    onBlur={() => markTouched("commissionRate")}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 8"
                    className={inputClass(
                      touched.commissionRate && formErrors.commissionRate,
                    )}
                  />
                </Field>

                <Field
                  label="Cookie Window (Days)"
                  icon={<Clock size={14} className="text-[#7775A0]" />}
                  error={touched.cookieDays ? formErrors.cookieDays : ""}
                  hint="0 = session only. Max 365 days."
                >
                  <input
                    type="number"
                    name="cookieDays"
                    value={formData.cookieDays}
                    onChange={handleChange}
                    onBlur={() => markTouched("cookieDays")}
                    min="0"
                    max="365"
                    step="1"
                    placeholder="e.g. 30"
                    className={inputClass(
                      touched.cookieDays && formErrors.cookieDays,
                    )}
                  />
                </Field>

                <div className="border-t border-[#E0DEF5] pt-3">
                  <Field
                    label="Minimum Payout ($)"
                    error={touched.minPayoutUsd ? formErrors.minPayoutUsd : ""}
                  >
                    <input
                      type="number"
                      name="minPayoutUsd"
                      value={formData.minPayoutUsd}
                      onChange={handleChange}
                      onBlur={() => markTouched("minPayoutUsd")}
                      min="0"
                      step="0.01"
                      placeholder="e.g. 50"
                      className={inputClass(
                        touched.minPayoutUsd && formErrors.minPayoutUsd,
                      )}
                    />
                  </Field>
                </div>

                <Field
                  label="Payment Terms"
                  error={touched.paymentTerms ? formErrors.paymentTerms : ""}
                >
                  <input
                    type="text"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    onBlur={() => markTouched("paymentTerms")}
                    maxLength={100}
                    placeholder="e.g. Net-30, Bi-Weekly"
                    className={inputClass(
                      touched.paymentTerms && formErrors.paymentTerms,
                    )}
                  />
                </Field>
              </Card>
            </div>
          </div>
        </form>

        <NetworkGuide />
      </div>
    </div>
  );
}

function Card({ title, description, icon, right, children }) {
  return (
    <div className="space-y-5 rounded-xl border border-[#E0DEF5] bg-white p-6 shadow-[0_2px_12px_rgba(26,19,64,0.08)]">
      <div className="flex items-start justify-between gap-4 border-b border-[#E0DEF5] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#1A1340]">
            {icon}
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[13px] text-[#7775A0]">{description}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, icon, error, hint, children }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1A1340]">
        {icon}
        {label} {required ? <span className="text-[#E24B4A]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[12px] font-medium text-[#E24B4A]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-[#7775A0]">{hint}</p>
      ) : null}
    </div>
  );
}

function inputClass(hasError) {
  return `w-full rounded-lg border-[1.5px] bg-white px-4 py-2.5 text-[14px] text-[#1A1340] outline-none transition-all ${
    hasError
      ? "border-[#E24B4A] focus:border-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A]"
      : "border-[#E0DEF5] focus:border-[#2D2380]"
  }`;
}

function StatusButton({ label, value, current, onClick, color }) {
  const isActive = current === value;

  const activeClassMap = {
    success: "border-[#22B07D] bg-[#E1F5EE] text-[#22B07D]",
    gold: "border-[#F4A836] bg-[#FAEEDA] text-[#BA7517]",
    slate: "border-[#7775A0] bg-[#F7F6FF] text-[#7775A0]",
  };

  const dotClassMap = {
    success: "bg-[#22B07D]",
    gold: "bg-[#BA7517]",
    slate: "bg-[#7775A0]",
  };

  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2.5 text-[13px] font-semibold transition-all ${
        isActive
          ? activeClassMap[color]
          : "border-[#E0DEF5] bg-white text-[#7775A0] hover:border-[#4A3DBF] hover:text-[#1A1340]"
      }`}
    >
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          isActive ? dotClassMap[color] : "bg-[#E0DEF5]"
        }`}
      />
      {label}
    </button>
  );
}

function NetworkGuide() {
  return (
    <div className="mt-12 rounded-xl border border-[#2D2380] bg-[#1A1340] p-6 text-white shadow-lg md:p-8">
      <div className="mb-6 flex items-center gap-3 border-b border-[rgba(255,255,255,0.1)] pb-4">
        <BookOpen size={24} className="text-[#F4A836]" />
        <h2 className="text-[20px] font-bold text-white">
          Network Configuration Guide
        </h2>
      </div>

      <p className="mb-8 text-[14px] leading-relaxed text-[#A09EC0]">
        Use this guide when adding a new affiliate network so tracking, revenue,
        and contact data stay consistent.
      </p>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <GuideItem
          title="Network Display Name"
          example="Impact Radius or ShareASale"
          text="This is the admin-facing name shown when linking stores to a network."
        />

        <GuideItem
          title="Parent Company / Owner"
          example="Impact Tech, Inc."
          text="Identifies the legal company that owns the network for accounting and verification."
        />

        <div className="space-y-1 rounded-lg border border-[rgba(244,168,54,0.3)] bg-[rgba(244,168,54,0.1)] p-4 md:col-span-2">
          <h3 className="flex items-center gap-2 text-[14px] font-bold text-[#F4A836]">
            <AlertCircle size={16} /> Parameters String (Most Important)
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-[#E0DEF5]">
            <span className="font-semibold text-white">Why it is needed:</span>{" "}
            This is how the system injects dynamic click data into affiliate
            links. The backend replaces placeholders like{" "}
            <code className="rounded bg-[#1A1340] px-1.5 py-0.5 font-bold text-[#F4A836]">
              {"{subId}"}
            </code>{" "}
            at redirect time.
          </p>
        </div>

        <GuideItem
          title="Integration Status"
          example="Active, Pending, or Inactive"
          text="Controls whether the network is live, still being tested, or paused."
        />

        <GuideItem
          title="Default Commission Rate (%)"
          example="8 means 8%"
          text="Used as the baseline revenue estimate. Stores can later override this."
        />

        <GuideItem
          title="Cookie Window (Days)"
          example="30 for a 30-day tracking window"
          text="How long after a click you can still receive commission if the user buys."
        />

        <GuideItem
          title="Min Payout & Payment Terms"
          example="Min Payout: 50, Terms: Net-30"
          text="Used for cash-flow tracking and payout planning."
        />

        <GuideItem
          title="Account Manager Details"
          example="John Doe, john@impact.com"
          text="Keeps network contacts available when links break or commission terms need review."
        />
      </div>
    </div>
  );
}

function GuideItem({ title, text, example }) {
  return (
    <div className="space-y-1">
      <h3 className="text-[14px] font-bold text-[#F4A836]">{title}</h3>
      <p className="text-[13px] leading-relaxed text-[#E0DEF5]">
        <span className="font-semibold text-white">Why it is needed:</span>{" "}
        {text}
        <br />
        <span className="font-semibold text-[#22B07D]">Example:</span> {example}
        .
      </p>
    </div>
  );
}
