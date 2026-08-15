import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import SiteScripts from "./Components/SiteScripts";
import { getGlobalSettings } from "@/app/lib/getSettings";

// ─── BRAND TYPOGRAPHY SYSTEM ───────────────────────────────────────────────

// Headings & Editorial Display (Punchy, modern, geometry-balanced)
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: true,
});

// Primary Body & UI Interface (High legibility on Warm Cream canvas)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  adjustFontFallback: true,
});

// Coupon Codes, Discount Percentages & Numeric Badges
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
  adjustFontFallback: true,
});

// ─── DYNAMIC SEO & SOCIAL METADATA ────────────────────────────────────────

export async function generateMetadata() {
  const settings = await getGlobalSettings();

  const siteName = settings?.siteName || "VestoriaHub";
  const siteTagline = settings?.siteTagline || "Shop Smarter, Spend Lighter.";
  const description =
    settings?.siteDescription ||
    "Discover strictly verified coupons, curated marketplace discounts & expert shopping guides. Join 1.5M+ smart shoppers saving daily — 100% free.";
  const domainUrl = settings?.domainUrl || "https://www.vestoriahub.com";

  return {
    title: {
      template: `%s | ${siteName}`,
      default: `${siteName} | ${siteTagline}`,
    },
    description: description,
    metadataBase: new URL(domainUrl),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: `${siteName} | ${siteTagline}`,
      description: description,
      url: domainUrl,
      siteName: siteName,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} | ${siteTagline}`,
      description: description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ─── ROOT LAYOUT ──────────────────────────────────────────────────────────

export default async function RootLayout({ children }) {
  const settings = await getGlobalSettings();

  return (
    <html
      lang="en"
      className={`${outfit.variable} ${jakarta.variable} ${jetbrainsMono.variable} antialiased scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning={true}
    >
      <head>
        <SiteScripts settings={settings} />
      </head>
      <body
        className="min-h-screen flex flex-col font-sans bg-[var(--color-background)] text-[var(--color-text-primary)]"
        suppressHydrationWarning={true}
      >
        {/* Google Tag Manager (noscript fallback) */}
        {settings?.scripts?.googleTagManagerId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.scripts.googleTagManagerId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        {/* Custom Third-party Injection Scripts */}
        {settings?.scripts?.customBodyCode && (
          <div
            dangerouslySetInnerHTML={{
              __html: settings.scripts.customBodyCode,
            }}
          />
        )}

        {/* Maintenance Mode Guard */}
        {settings?.featureFlags?.maintenanceMode ? (
          <main className="flex-grow flex items-center justify-center relative w-full bg-[var(--color-surface)] z-50 px-4">
            <div className="text-center max-w-lg">
              <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] font-heading tracking-tight">
                Site Under Maintenance
              </h1>
              <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed">
                We are currently optimizing our systems to bring you verified savings and curated discounts.
              </p>
            </div>
          </main>
        ) : (
          <>
            <Navbar settings={settings} />
            <main className="flex-grow flex flex-col relative w-full">
              {children}
            </main>
            <Footer settings={settings} />
          </>
        )}
      </body>
    </html>
  );
}