"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Globe,
  ShieldCheck,
  Code,
  Palette,
  Share2,
  Save,
  AlertTriangle,
  Image as ImageIcon,
  Phone,
  Power,
  Activity,
  Plus,
  Trash2,
  DollarSign,
  Sliders,
  Link,
  LayoutTemplate,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function SiteSettingsPage() {
  // ─── TABS & UI STATE ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // ─── STATE PERFECTLY MAPPED TO MONGOOSE SCHEMA ───────────────────────────
  const [formData, setFormData] = useState({
    siteName: "VestoriaHub",
    siteTagline: "Your Ultimate Savings Ecosystem",
    siteDescription:
      "Discover the best verified coupons, deals, and Amazon discounts.",
    allowIndexing: true,
    contactEmail: "support@VestoriaHub.com",
    adminEmail: "admin@VestoriaHub.com",
    whatsappNumber: "",
    domainUrl: "https://www.vestoriahub.com",
    defaultCountryCode: "GLOBAL",
    branding: {
      logoUrl: "",
      logoAlt: "VestoriaHub logo",
      faviconUrl: "",
      defaultOgImage: "",
    },
    socials: {
      facebook: "",
      twitter: "",
      instagram: "",
      tiktok: "",
      pinterest: "",
      linkedin: "",
      youtube: "",
    },
    scripts: {
      googleAnalyticsId: "",
      googleTagManagerId: "",
      googleSiteVerification: "",
      facebookPixelId: "",
      customHeadCode: "",
      customBodyCode: "",
    },
    affiliate: {
      amazonAssociateTag: "VestoriaHub-20",
      skimlinksId: "",
      shareasaleId: "",
      cjPublisherId: "",
      impactRadiusId: "",
      awinPublisherId: "",
    },
    affiliateCodes: [],
    platformConfig: {
      defaultCurrency: "USD",
      defaultRegion: "US",
      couponExpiryWarningDays: 3, // Number
      showAffiliateDisclosure: true,
      affiliateDisclosureText:
        "As an Amazon Associate and affiliate, we earn from qualifying purchases.",
    },
    featureFlags: {
      showAmazonGallery: true,
      showBlogSection: true,
      showFeaturedDeals: true,
      maintenanceMode: false,
    },
  });

  // ─── API CONNECTIONS ─────────────────────────────────────────────────────

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Fixed URL to match your API structure
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) {
            setFormData((prev) => ({
              ...prev,
              ...data.settings,
              branding: { ...prev.branding, ...data.settings.branding },
              socials: { ...prev.socials, ...data.settings.socials },
              scripts: { ...prev.scripts, ...data.settings.scripts },
              affiliate: { ...prev.affiliate, ...data.settings.affiliate },
              platformConfig: {
                ...prev.platformConfig,
                ...data.settings.platformConfig,
              },
              featureFlags: {
                ...prev.featureFlags,
                ...data.settings.featureFlags,
              },
              affiliateCodes: data.settings.affiliateCodes || [],
            }));
          }
        } else {
          showNotification("Failed to load settings.", "error");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        showNotification("Network error loading settings.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setNotification(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification("Settings updated successfully!", "success");
      } else {
        showNotification(data.error || "Validation failed.", "error");
        console.error("Validation Details:", data.details);
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification("An unexpected error occurred.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ─── HANDLERS (AUDITED FOR TYPE SAFETY & IMMUTABILITY) ───────────────────

  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const keys = path.split(".");
      const newData = { ...prev };
      let current = newData;

      // Deep copy traversal to ensure strict React immutability
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;

      return newData;
    });
  };

  const updateAffiliateCode = (index, field, value) => {
    setFormData((prev) => {
      const updatedCodes = [...prev.affiliateCodes];
      // Properly clone the inner object to prevent direct state mutation
      updatedCodes[index] = { ...updatedCodes[index], [field]: value };
      return { ...prev, affiliateCodes: updatedCodes };
    });
  };

  const addAffiliateCode = () => {
    setFormData((prev) => ({
      ...prev,
      affiliateCodes: [
        ...prev.affiliateCodes,
        {
          networkName: "",
          type: "meta",
          metaName: "",
          contentValue: "",
          isActive: true,
        },
      ],
    }));
  };

  const removeAffiliateCode = (index) => {
    setFormData((prev) => ({
      ...prev,
      affiliateCodes: prev.affiliateCodes.filter((_, i) => i !== index),
    }));
  };

  // ─── REUSABLE UI COMPONENTS (AUDITED FOR CONTROLLED STATE) ───────────────

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-bold transition-all ${
        activeTab === id
          ? "bg-[#1A1340] text-[#F4A836] shadow-md"
          : "text-[#7775A0] hover:bg-[#EEEDFE] hover:text-[#2D2380]"
      }`}
    >
      <Icon size={18} strokeWidth={activeTab === id ? 2.5 : 2} />
      {label}
    </button>
  );

  const FormInput = ({
    label,
    path,
    type = "text",
    placeholder,
    multiline = false,
    colSpan = 1,
  }) => {
    // Safely extract deeply nested value and prevent React 'uncontrolled input' warnings
    const rawValue = path
      .split(".")
      .reduce((o, i) => (o ? o[i] : undefined), formData);
    const value = rawValue !== undefined && rawValue !== null ? rawValue : "";

    const handleChange = (e) => {
      let val = e.target.value;
      // Force Number type casting if the input is meant to be a number (prevents Schema errors)
      if (type === "number") {
        val = val === "" ? "" : Number(val);
      }
      handleInputChange(path, val);
    };

    return (
      <div className={`md:col-span-${colSpan}`}>
        <label className="block text-[13px] font-bold text-[#1A1340] mb-2">
          {label}
        </label>
        {multiline ? (
          <textarea
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={3}
            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] focus:ring-4 focus:ring-[#EEEDFE] outline-none transition-all resize-none"
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] focus:ring-4 focus:ring-[#EEEDFE] outline-none transition-all"
          />
        )}
      </div>
    );
  };

  const FormToggle = ({ label, desc, path, activeColor = "bg-[#22B07D]" }) => {
    // Safely resolve boolean to prevent undefined toggle crashes
    const rawValue = path
      .split(".")
      .reduce((o, i) => (o ? o[i] : undefined), formData);
    const isChecked = !!rawValue;

    return (
      <div className="flex items-center justify-between p-4 bg-[#F7F6FF] border border-[#E0DEF5] rounded-xl">
        <div>
          <h4 className="text-[14px] font-bold text-[#1A1340]">{label}</h4>
          {desc && <p className="text-[12px] text-[#7775A0] mt-0.5">{desc}</p>}
        </div>
        <button
          onClick={() => handleInputChange(path, !isChecked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            isChecked ? activeColor : "bg-[#D3D1E6]"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isChecked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6FF] flex items-center justify-center">
        <div className="flex flex-col items-center text-[#2D2380]">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="font-bold">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6FF] p-6 md:p-8">
      <div className="max-w-[1200px] mx-auto">
        {/* NOTIFICATION TOAST */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-lg shadow-lg text-white font-bold text-[14px] animate-in slide-in-from-top-4 ${notification.type === "success" ? "bg-[#22B07D]" : "bg-[#E24B4A]"}`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            {notification.message}
          </div>
        )}

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[32px] font-bold text-[#1A1340] leading-tight">
              Global Configuration
            </h1>
            <p className="text-[#7775A0] text-[16px] mt-1">
              Manage core settings, affiliate integrations, and feature flags.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e05520] disabled:bg-[#ffaa85] disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-bold text-[15px] shadow-sm transition-colors"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT: NAVIGATION */}
          <div className="lg:col-span-1 space-y-2 sticky top-8 h-fit">
            <TabButton id="general" label="Identity & Contact" icon={Globe} />
            <TabButton id="branding" label="Branding Assets" icon={Palette} />
            <TabButton
              id="platform"
              label="Platform Config"
              icon={LayoutTemplate}
            />
            <TabButton id="socials" label="Social Profiles" icon={Share2} />
            <TabButton
              id="affiliates"
              label="Affiliate Hub"
              icon={DollarSign}
            />
            <TabButton id="scripts" label="Tracking & Scripts" icon={Code} />
            <TabButton id="features" label="Features & System" icon={Sliders} />
          </div>

          {/* RIGHT: CONTENT */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white border border-[#E0DEF5] rounded-xl p-8 shadow-sm min-h-[600px]">
              {/* TAB: GENERAL */}
              {activeTab === "general" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4">
                    Identity & SEO Defaults
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Site Name" path="siteName" colSpan={2} />
                    <FormInput
                      label="Site Tagline"
                      path="siteTagline"
                      colSpan={2}
                    />
                    <FormInput
                      label="Global Meta Description"
                      path="siteDescription"
                      multiline
                      colSpan={2}
                    />
                    <FormInput
                      label="Canonical Domain URL"
                      path="domainUrl"
                      type="url"
                    />
                    <FormInput
                      label="Default Country Code"
                      path="defaultCountryCode"
                      placeholder="e.g., US or GLOBAL"
                    />
                  </div>

                  <h3 className="text-[16px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-3 mt-8">
                    Contact Routing
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Public Support Email"
                      path="contactEmail"
                      type="email"
                    />
                    <FormInput
                      label="System Admin Email"
                      path="adminEmail"
                      type="email"
                    />
                    <FormInput label="WhatsApp Number" path="whatsappNumber" />
                  </div>
                </div>
              )}

              {/* TAB: BRANDING */}
              {activeTab === "branding" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4">
                    Visual Assets
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <FormInput
                        label="Primary Logo URL"
                        path="branding.logoUrl"
                        type="url"
                      />
                      <FormInput
                        label="Logo Alt Text"
                        path="branding.logoAlt"
                      />
                    </div>
                    <div className="space-y-4">
                      <FormInput
                        label="Favicon URL"
                        path="branding.faviconUrl"
                        type="url"
                      />
                      <FormInput
                        label="Default OG Image URL"
                        path="branding.defaultOgImage"
                        type="url"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PLATFORM CONFIG */}
              {activeTab === "platform" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4">
                    Localization & Compliance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Default Currency"
                      path="platformConfig.defaultCurrency"
                      placeholder="USD"
                    />
                    <FormInput
                      label="Default Region"
                      path="platformConfig.defaultRegion"
                      placeholder="US"
                    />
                    <FormInput
                      label="Coupon Expiry Warning (Days)"
                      path="platformConfig.couponExpiryWarningDays"
                      type="number"
                    />
                  </div>

                  <div className="mt-8 space-y-4">
                    <FormToggle
                      label="Show FTC Affiliate Disclosure"
                      desc="Globally display the earnings disclaimer on outgoing links."
                      path="platformConfig.showAffiliateDisclosure"
                    />
                    {formData.platformConfig.showAffiliateDisclosure && (
                      <div className="pl-4 border-l-2 border-[#E0DEF5]">
                        <FormInput
                          label="Disclosure Text"
                          path="platformConfig.affiliateDisclosureText"
                          multiline
                          colSpan={2}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB: SOCIALS */}
              {activeTab === "socials" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4">
                    Social Media Presence
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(formData.socials).map((platform) => (
                      <div key={platform}>
                        <label className="block text-[13px] font-bold text-[#1A1340] mb-2 capitalize">
                          {platform} URL
                        </label>
                        <div className="relative">
                          <Link
                            className="absolute left-3 top-3 text-[#A09EB5]"
                            size={16}
                          />
                          <input
                            type="url"
                            value={formData.socials[platform] || ""}
                            onChange={(e) =>
                              handleInputChange(
                                `socials.${platform}`,
                                e.target.value,
                              )
                            }
                            placeholder={`https://${platform}.com/...`}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border-[1.5px] border-[#E0DEF5] rounded-lg text-[14px] focus:border-[#2D2380] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: AFFILIATE HUB */}
              {activeTab === "affiliates" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4 mb-6">
                      Core Publisher IDs
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormInput
                        label="Amazon Associate Tag"
                        path="affiliate.amazonAssociateTag"
                      />
                      <FormInput
                        label="Skimlinks ID"
                        path="affiliate.skimlinksId"
                      />
                      <FormInput
                        label="ShareASale ID"
                        path="affiliate.shareasaleId"
                      />
                      <FormInput
                        label="Impact Radius ID"
                        path="affiliate.impactRadiusId"
                      />
                      <FormInput
                        label="CJ Publisher ID"
                        path="affiliate.cjPublisherId"
                      />
                      <FormInput
                        label="Awin Publisher ID"
                        path="affiliate.awinPublisherId"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="flex items-center justify-between border-b border-[#E0DEF5] pb-4 mb-6">
                      <div>
                        <h2 className="text-[20px] font-bold text-[#1A1340]">
                          Site Verification Tags
                        </h2>
                        <p className="text-[13px] text-[#7775A0] mt-1">
                          Manage header tags needed for network approval.
                        </p>
                      </div>
                      <button
                        onClick={addAffiliateCode}
                        className="flex items-center gap-1.5 text-[#2D2380] font-bold text-[13px] hover:bg-[#EEEDFE] px-4 py-2 rounded-lg transition-colors border border-[#E0DEF5]"
                      >
                        <Plus size={16} /> Add Tag
                      </button>
                    </div>

                    <div className="space-y-4">
                      {formData.affiliateCodes.map((code, idx) => (
                        <div
                          key={idx}
                          className="bg-[#F7F6FF] p-5 rounded-xl border border-[#E0DEF5] relative"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[#1A1340] text-[14px]">
                              Tag #{idx + 1}
                            </h3>
                            <button
                              onClick={() => removeAffiliateCode(idx)}
                              className="text-[#E24B4A] hover:bg-[#FCEBEB] p-1.5 rounded-md transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="md:col-span-1">
                              <label className="text-[11px] font-bold text-[#7775A0] uppercase tracking-wider block mb-1">
                                Network
                              </label>
                              <input
                                type="text"
                                value={code.networkName || ""}
                                onChange={(e) =>
                                  updateAffiliateCode(
                                    idx,
                                    "networkName",
                                    e.target.value,
                                  )
                                }
                                placeholder="e.g. Awin"
                                className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                              />
                            </div>
                            <div className="md:col-span-1">
                              <label className="text-[11px] font-bold text-[#7775A0] uppercase tracking-wider block mb-1">
                                Type
                              </label>
                              <select
                                value={code.type || "meta"}
                                onChange={(e) =>
                                  updateAffiliateCode(
                                    idx,
                                    "type",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                              >
                                <option value="meta">Meta Tag</option>
                                <option value="script">JS Script</option>
                              </select>
                            </div>
                            {code.type === "meta" && (
                              <div className="md:col-span-2">
                                <label className="text-[11px] font-bold text-[#7775A0] uppercase tracking-wider block mb-1">
                                  Meta Name
                                </label>
                                <input
                                  type="text"
                                  value={code.metaName || ""}
                                  onChange={(e) =>
                                    updateAffiliateCode(
                                      idx,
                                      "metaName",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="e.g. awin-site-verify"
                                  className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] outline-none focus:border-[#2D2380]"
                                />
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-[#7775A0] uppercase tracking-wider block mb-1">
                              {code.type === "meta"
                                ? "Content Value"
                                : "Script Snippet"}
                            </label>
                            {code.type === "meta" ? (
                              <input
                                type="text"
                                value={code.contentValue || ""}
                                onChange={(e) =>
                                  updateAffiliateCode(
                                    idx,
                                    "contentValue",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] font-mono outline-none focus:border-[#2D2380]"
                              />
                            ) : (
                              <textarea
                                value={code.contentValue || ""}
                                onChange={(e) =>
                                  updateAffiliateCode(
                                    idx,
                                    "contentValue",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 bg-white border border-[#E0DEF5] rounded-md text-[13px] font-mono outline-none focus:border-[#2D2380] resize-y"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            <button
                              onClick={() =>
                                updateAffiliateCode(
                                  idx,
                                  "isActive",
                                  !code.isActive,
                                )
                              }
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                code.isActive ? "bg-[#22B07D]" : "bg-[#D3D1E6]"
                              }`}
                            >
                              <span
                                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  code.isActive
                                    ? "translate-x-4"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>
                            <span className="text-[12px] font-bold text-[#1A1340]">
                              {code.isActive ? "Active" : "Disabled"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SCRIPTS */}
              {activeTab === "scripts" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4">
                    Tracking & Injections
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput
                      label="Google Analytics 4 ID"
                      path="scripts.googleAnalyticsId"
                      placeholder="G-XXXXXXXXXX"
                    />
                    <FormInput
                      label="Google Tag Manager ID"
                      path="scripts.googleTagManagerId"
                      placeholder="GTM-XXXXXXX"
                    />
                    <FormInput
                      label="Facebook Pixel ID"
                      path="scripts.facebookPixelId"
                      placeholder="XXXXXXXXXX"
                    />
                    <FormInput
                      label="Google Site Verification"
                      path="scripts.googleSiteVerification"
                      placeholder="Token..."
                    />
                  </div>

                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1340] mb-2 font-mono">
                        {"<head>"} Custom Code
                      </label>
                      <textarea
                        value={formData.scripts.customHeadCode || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "scripts.customHeadCode",
                            e.target.value,
                          )
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-[#1A1340] text-[#F7F6FF] rounded-lg text-[13px] font-mono focus:ring-2 focus:ring-[#F4A836] outline-none resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[13px] font-bold text-[#1A1340] mb-2 font-mono">
                        {"<body>"} Custom Code
                      </label>
                      <textarea
                        value={formData.scripts.customBodyCode || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "scripts.customBodyCode",
                            e.target.value,
                          )
                        }
                        rows={4}
                        className="w-full px-4 py-3 bg-[#1A1340] text-[#F7F6FF] rounded-lg text-[13px] font-mono focus:ring-2 focus:ring-[#F4A836] outline-none resize-y"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: FEATURES & SYSTEM */}
              {activeTab === "features" && (
                <div className="space-y-8 animate-in fade-in duration-200">
                  <div>
                    <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4 mb-6">
                      Feature Flags
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      <FormToggle
                        label="Enable Amazon Discovery Gallery"
                        desc="Display the curated Amazon deals grid on the homepage."
                        path="featureFlags.showAmazonGallery"
                      />
                      <FormToggle
                        label="Enable Featured Deals"
                        desc="Show the top deals carousel banner."
                        path="featureFlags.showFeaturedDeals"
                      />
                      <FormToggle
                        label="Enable Blog Section"
                        desc="Allow visitors to read SEO buying guides and articles."
                        path="featureFlags.showBlogSection"
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[20px] font-bold text-[#1A1340] border-b border-[#E0DEF5] pb-4 mb-6 text-red-600">
                      System Controls
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                      <FormToggle
                        label="Search Engine Indexing"
                        desc="If disabled, adds a 'noindex' meta tag to prevent Google from crawling."
                        path="allowIndexing"
                      />
                      <FormToggle
                        label="Maintenance Mode"
                        desc="Lock down the frontend for visitors. Admins can still bypass."
                        path="featureFlags.maintenanceMode"
                        activeColor="bg-[#E24B4A]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
