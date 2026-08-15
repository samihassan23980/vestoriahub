/* app/admin/networks/[slug]/page.jsx */
/*
 * Admin page for editing an affiliate network by slug or ID.
 *
 * This component fetches the affiliate network from the backend API using the
 * provided slug (which may be either a human‑readable slug or a MongoDB
 * ObjectId). It handles form state, validation and submission for updating
 * the network. Usage statistics (linked stores, recent clicks) are also
 * displayed to provide context when editing. The implementation follows the
 * AffiliateNetwork schema, including validation for URL fields, tracking
 * parameter placeholders and numeric ranges.
 */

"use client";

import React, { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Store,
  MousePointerClick,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";

// -----------------------------------------------------------------------------
// Constants
//
// Colours used in the UI. Keeping them in a single object makes it easy to
// update the theme consistently across the entire form.
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

// Regex to validate tracking parameter placeholders, e.g. {subId}
const PLACEHOLDER_REGEX = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;

// Regex to detect a valid MongoDB ObjectId (24 hex characters)
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

// Initial form state. Defaults match the AffiliateNetwork schema defaults.
const initialFormData = {
  _id: "",
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
  updatedAt: "",
};

// -----------------------------------------------------------------------------
// Utility functions
//
// Extracts an error message from an API response. Tries to handle various
// response shapes returned by the backend. If no useful message is found,
// returns the provided fallback string.
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

// Checks whether a URL is valid (http or https). Empty strings are considered
// valid because the field is optional.
function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Normalises the shape of a network returned from the API to match the form
// state expected by this component. Handles multiple possible response
// structures.
function normalizeApiNetwork(payload = {}) {
  const network =
    payload?.data?.network ||
    payload?.network ||
    payload?.data ||
    payload ||
    {};
  return {
    _id: network._id || network.id || "",
    name: network.name || "",
    owner: network.owner || "",
    websiteUrl: network.websiteUrl || "",
    status: network.status || "active",
    trackingParams: network.trackingParams || "",
    cookieDays: Number(network.cookieDays ?? 30),
    commissionRate: Number(network.commissionRate ?? 0),
    paymentTerms: network.paymentTerms || "",
    minPayoutUsd: Number(network.minPayoutUsd ?? 0),
    contactEmail: network.contactEmail || "",
    accountManagerName: network.accountManagerName || "",
    updatedAt: network.updatedAt || network.createdAt || "",
  };
}

// Normalises the form data before sending it to the backend. Trims strings and
// ensures proper types. This mirrors the schema validation rules on the
// server.
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

// Simple slugify helper. Converts arbitrary strings to lower‑case URL slugs.
function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Extracts an array of networks from an API response. Supports multiple
// possible response shapes.
function getArrayFromApi(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.networks)) return payload.data.networks;
  if (Array.isArray(payload?.networks)) return payload.networks;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

// Formats a small status badge for the header. Uses static classes to avoid
// dynamic class generation issues in Tailwind.
function getSmallStatusBadge(status) {
  if (status === "active") {
    return (
      <span className="rounded-md border border-[#22B07D]/20 bg-[#22B07D]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#22B07D]">
        Active
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded-md border border-[#F4A836]/30 bg-[#F4A836]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#BA7517]">
        Pending
      </span>
    );
  }
  return (
    <span className="rounded-md border border-[#7775A0]/20 bg-[#7775A0]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#7775A0]">
      Inactive
    </span>
  );
}

// Returns classes for inputs based on error state.
function inputClass(hasError) {
  return `w-full rounded-lg border-[1.5px] bg-white px-4 py-2.5 text-[14px] text-[#1A1340] outline-none transition-all ${
    hasError
      ? "border-[#E24B4A] focus:border-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A]"
      : "border-[#E0DEF5] focus:border-[#2D2380]"
  }`;
}

// -----------------------------------------------------------------------------
// Main component: EditNetworkPage
//
export default function EditNetworkPage({ params }) {
  const router = useRouter();
  // In Next.js App Router, params can be a promise when navigating between
  // parallel routes. Using `use(params)` ensures that we wait for the value.
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;

  // Component state: form fields, usage statistics, loading and error states.
  const [formData, setFormData] = useState(initialFormData);
  const [usageStats, setUsageStats] = useState({
    stores: 0,
    totalClicks30d: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({});
  const [loadError, setLoadError] = useState("");

  // Derived values for form validation.
  const hasValidPlaceholder = useMemo(
    () => PLACEHOLDER_REGEX.test(formData.trackingParams),
    [formData.trackingParams],
  );
  const websiteUrlValid = useMemo(
    () => isValidHttpUrl(formData.websiteUrl),
    [formData.websiteUrl],
  );

  // Form error messages, computed on demand.
  const formErrors = useMemo(() => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Network name is required.";
    if (!formData.owner.trim())
      errors.owner = "Owner/company name is required.";
    if (formData.name.length > 120)
      errors.name = "Network name must be 120 characters or less.";
    if (formData.owner.length > 140)
      errors.owner = "Owner must be 140 characters or less.";
    if (!["pending", "active", "inactive"].includes(formData.status))
      errors.status = "Status must be pending, active, or inactive.";
    if (!websiteUrlValid)
      errors.websiteUrl = "Website URL must be a valid http/https URL.";
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

  // Determine if the form can be submitted. Prevent submission if there are
  // validation errors, if an update is already in progress, or if the network
  // has not yet been loaded.
  const canSubmit =
    Object.keys(formErrors).length === 0 &&
    !isSubmitting &&
    !loading &&
    Boolean(formData._id);

  // Fetch a network by ID from the backend. Throws an error if the response
  // is not ok. Returns the JSON response if successful.
  const fetchNetworkById = async (id) => {
    const res = await fetch(`/api/admin/affiliate-networks/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const msg = await getApiErrorMessage(res, "Failed to load network.");
      throw new Error(msg);
    }
    const json = await res.json();
    return json;
  };

  // Searches for a network by slug. If the slug looks like a MongoDB ObjectId
  // it will directly fetch by ID. Otherwise it will search by name and then
  // match either id, slugified name or exact lower‑case name.
  const fetchNetworkBySlugOrSearch = async (value) => {
    if (OBJECT_ID_REGEX.test(value)) {
      return fetchNetworkById(value);
    }
    const res = await fetch(
      `/api/admin/affiliate-networks?search=${encodeURIComponent(value)}&limit=50`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      const msg = await getApiErrorMessage(res, "Failed to search network.");
      throw new Error(msg);
    }
    const json = await res.json();
    const list = getArrayFromApi(json);
    const exact =
      list.find((item) => String(item._id || item.id) === value) ||
      list.find((item) => slugify(item.name) === value) ||
      list.find((item) => String(item.name || "").toLowerCase() === value);
    if (!exact?._id && !exact?.id) {
      throw new Error("Affiliate network not found.");
    }
    return fetchNetworkById(exact._id || exact.id);
  };

  // Loads a network given the slug from the URL. Sets loading/error states.
  const fetchNetwork = async () => {
    if (!slug) return;
    setLoading(true);
    setLoadError("");
    try {
      const json = await fetchNetworkBySlugOrSearch(slug);
      const network = normalizeApiNetwork(json);
      setFormData(network);
      setUsageStats({
        stores: Number(json?.data?.usageStats?.stores || 0),
        totalClicks30d: Number(json?.data?.usageStats?.totalClicks30d || 0),
      });
    } catch (error) {
      setLoadError(error?.message || "Failed to load affiliate network.");
      await Swal.fire({
        icon: "error",
        title: "Could not load network",
        text: error?.message || "Please try again.",
        confirmButtonColor: COLORS.error,
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch the network when the slug changes.
  useEffect(() => {
    fetchNetwork();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // When the form is submitting, warn the user about leaving the page.
  useEffect(() => {
    if (!isSubmitting) return;
    const beforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isSubmitting]);

  // Helper to mark a field as touched for validation messages.
  const markTouched = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  // Generic form field change handler. Supports text and number inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Sets the status field explicitly, and marks it touched.
  const setStatus = (status) => {
    setFormData((prev) => ({ ...prev, status }));
    markTouched("status");
  };

  // Shows a SweetAlert2 modal listing form errors. Called before submission.
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

  // Handles submission of the form. Performs validation, optional confirmation
  // for high‑risk changes to an active network, and sends the update request
  // to the backend. Displays success/error notifications accordingly.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Mark all fields as touched so errors show.
    setTouched({
      name: true,
      owner: true,
      websiteUrl: true,
      status: true,
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
    // Warn if editing an active network. Changing tracking parameters can
    // immediately affect live redirects, so confirm with the user.
    const isHighRiskTrackingChange = formData.status === "active";
    if (isHighRiskTrackingChange) {
      const result = await Swal.fire({
        icon: "warning",
        title: "Save changes to active network?",
        html: `
          <div style="text-align:left">
            <p>You are updating an active affiliate network.</p>
            <p style="margin-top:8px;font-size:13px;color:#7775A0">
              If tracking parameters changed, store affiliate redirects may be affected immediately.
            </p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Yes, save changes",
        cancelButtonText: "Cancel",
        confirmButtonColor: COLORS.coral,
        cancelButtonColor: COLORS.slate,
      });
      if (!result.isConfirmed) return;
    }
    setIsSubmitting(true);
    try {
      const payload = normalizePayload(formData);
      const res = await fetch(`/api/admin/affiliate-networks/${formData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = await getApiErrorMessage(
          res,
          "Failed to update affiliate network.",
        );
        throw new Error(msg);
      }
      const json = await res.json().catch(() => ({}));
      const updated = normalizeApiNetwork(json);
      setFormData((prev) => ({ ...prev, ...updated }));
      await Swal.fire({
        icon: "success",
        title: "Network updated",
        text: "Affiliate network updated successfully.",
        confirmButtonColor: COLORS.violet,
      });
      router.refresh();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Could not save changes",
        text: error?.message || "Something went wrong while saving.",
        confirmButtonColor: COLORS.error,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format last updated date for display. If not available, show fallback.
  const lastUpdatedLabel = formData.updatedAt
    ? new Date(formData.updatedAt).toLocaleDateString()
    : "Not available";

  // Render different states: loading, error, or the form.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F6FF] p-6">
        <div className="rounded-2xl border border-[#E0DEF5] bg-white px-6 py-5 shadow-sm">
          <div className="flex items-center gap-3 text-[#7775A0]">
            <svg
              className="animate-spin"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="12" x2="12" y2="12" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
            </svg>
            Loading affiliate network...
          </div>
        </div>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
        <div className="mx-auto max-w-[760px] rounded-2xl border border-[#E0DEF5] bg-white p-8 text-center shadow-sm">
          <svg
            className="mx-auto mb-4 text-[#E24B4A]"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16" />
          </svg>
          <h1 className="text-xl font-bold text-[#1A1340]">
            Affiliate network not available
          </h1>
          <p className="mt-2 text-sm text-[#7775A0]">{loadError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/admin/networks"
              className="rounded-lg border border-[#E0DEF5] bg-white px-4 py-2 text-sm font-semibold text-[#7775A0] hover:text-[#1A1340]"
            >
              Back to networks
            </Link>
            <button
              type="button"
              onClick={fetchNetwork}
              className="inline-flex items-center gap-2 rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-bold text-white hover:bg-[#e05520]"
            >
              <RefreshCw size={16} /> Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Default render: the edit form.
  return (
    <form
      onSubmit={handleSubmit}
      className="min-h-screen bg-[#F7F6FF] p-6 md:p-8"
    >
      <div className="mx-auto max-w-[1100px]">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/networks"
              className="rounded-lg border border-[#E0DEF5] bg-white p-2 text-[#7775A0] shadow-sm transition-colors hover:bg-white hover:text-[#1A1340]"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="flex items-center gap-2 text-[24px] font-bold leading-tight text-[#1A1340]">
                  <Network size={24} className="text-[#F4A836]" />
                  Edit Network: {formData.name || "Untitled"}
                </h1>
                {getSmallStatusBadge(formData.status)}
              </div>
              <p className="mt-0.5 text-[13px] text-[#7775A0]">
                Last updated {lastUpdatedLabel}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B35] px-8 py-3 text-[15px] font-bold text-white shadow-sm transition-colors duration-150 hover:bg-[#e05520] disabled:cursor-not-allowed disabled:bg-[#FF6B35]/40"
          >
            {isSubmitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}{" "}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Form Layout */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          {/* Left column (main details) */}
          <div className="space-y-6 xl:col-span-2">
            {/* Network identity */}
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

            {/* Tracking parameters */}
            <Card
              title="Tracking Parameter Template"
              description="Variables dynamically appended to store affiliate links."
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
              accent
            >
              <Field
                label={
                  <span className="flex w-full justify-between">
                    <span>
                      Parameters String{" "}
                      <span className="text-[#E24B4A]">*</span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#E24B4A]">
                      High Risk Edit
                    </span>
                  </span>
                }
                error={touched.trackingParams ? formErrors.trackingParams : ""}
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
              <div className="mt-3 flex items-start gap-3 rounded-lg border border-[#F4A836]/30 bg-[#FAEEDA] p-4">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-[#BA7517]"
                />
                <p className="text-[12px] font-medium leading-relaxed text-[#BA7517]">
                  <strong>Warning:</strong> Changing tracking parameters can
                  affect all stores using this network. Current linked stores:{" "}
                  <strong className="text-[#1A1340]">
                    {usageStats.stores || 0}
                  </strong>
                  . Use valid placeholders like
                  <code className="mx-1 rounded border border-[#F4A836]/20 bg-white px-1.5 py-0.5 font-bold text-[#F4A836]">
                    {"{subId}"}
                  </code>
                  .
                </p>
              </div>
            </Card>

            {/* Account management */}
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

          {/* Right column */}
          <div className="space-y-6">
            {/* Usage stats */}
            <div className="relative overflow-hidden rounded-xl bg-[#1A1340] p-6 shadow-lg">
              <div className="absolute right-0 top-0 -mr-10 -mt-10 h-32 w-32 rounded-full bg-[#F4A836]/10 blur-3xl" />
              <h2 className="relative z-10 mb-4 flex items-center gap-2 text-[16px] font-bold text-white">
                <Network size={18} className="text-[#F4A836]" /> Network Usage
              </h2>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <Store size={14} />{" "}
                    <span className="text-[13px]">Linked Stores</span>
                  </div>
                  <span className="text-[14px] font-bold text-white">
                    {usageStats.stores || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white/70">
                    <MousePointerClick size={14} />{" "}
                    <span className="text-[13px]">Clicks (30d)</span>
                  </div>
                  <span className="text-[14px] font-bold text-[#22B07D]">
                    {Number(usageStats.totalClicks30d || 0).toLocaleString()}
                  </span>
                </div>
                <Link
                  href={`/admin/stores?affiliateNetworkId=${formData._id}`}
                  className="mt-2 block w-full rounded-lg border border-white/10 bg-white/5 py-2 text-center text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  View Associated Stores
                </Link>
              </div>
            </div>

            {/* Integration status */}
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

            {/* Revenue & terms */}
            <Card
              title="Revenue & Terms"
              icon={<DollarSign size={18} className="text-[#2D2380]" />}
            >
              <Field
                label="Default Commission Rate"
                icon={<Percent size={14} className="text-[#7775A0]" />}
                error={touched.commissionRate ? formErrors.commissionRate : ""}
              >
                <div className="relative">
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
                    className={`${inputClass(
                      touched.commissionRate && formErrors.commissionRate,
                    )} pr-8`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#7775A0]">
                    %
                  </span>
                </div>
              </Field>
              <Field
                label="Cookie Window (Days)"
                icon={<Clock size={14} className="text-[#7775A0]" />}
                error={touched.cookieDays ? formErrors.cookieDays : ""}
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
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------------
// Helper components
//

function Card({ title, description, icon, right, accent, children }) {
  return (
    <div className="relative space-y-5 overflow-hidden rounded-xl border border-[#E0DEF5] bg-white p-6 shadow-[0_2px_12px_rgba(26,19,64,0.04)]">
      {accent ? (
        <div className="absolute left-0 top-0 h-full w-1.5 bg-[#F4A836]" />
      ) : null}
      <div className="flex items-start justify-between gap-4 border-b border-[#E0DEF5] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-[16px] font-bold text-[#1A1340]">
            {icon} {title}
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
        {typeof label === "string" ? (
          <>
            {label}{" "}
            {required ? <span className="text-[#E24B4A]">*</span> : null}
          </>
        ) : (
          label
        )}
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

function StatusButton({ label, value, current, onClick, color }) {
  const isActive = current === value;
  // Predefined static classes to avoid dynamic Tailwind class names. See
  // https://tailwindcss.com/docs/content-configuration#dynamic-class-names
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
        className={`h-2.5 w-2.5 rounded-full ${isActive ? dotClassMap[color] : "bg-[#E0DEF5]"}`}
      />
      {label}
    </button>
  );
}

// Loader icon as a React component. This mirrors the lucide Loader2 icon
// but avoids dynamic imports in conditional render.
function Loader2({ size = 18, className = "" }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="12" x2="12" y2="12" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    </svg>
  );
}
