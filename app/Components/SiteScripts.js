import Script from "next/script";

export default function SiteScripts({ settings }) {
  if (!settings) return null;

  const { scripts, affiliateCodes } = settings;

  // Filter dynamic network codes
  const metaTags =
    affiliateCodes?.filter((c) => c.isActive && c.type === "meta") || [];
  const scriptTags =
    affiliateCodes?.filter((c) => c.isActive && c.type === "script") || [];

  return (
    <>
      {/* 1. Dynamic Affiliate Meta Tags (e.g., Awin, ShareASale verify) */}
      {metaTags.map((code, idx) => (
        <meta
          key={`meta-${idx}`}
          name={code.metaName}
          content={code.contentValue}
        />
      ))}

      {/* 2. Dynamic Affiliate Script Injections */}
      {scriptTags.map((code, idx) => (
        <Script
          key={`script-${idx}`}
          id={`aff-script-${idx}`}
          strategy="afterInteractive"
        >
          {code.contentValue}
        </Script>
      ))}

      {/* 3. Google Analytics 4 */}
      {scripts?.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${scripts.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${scripts.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* 4. Google Tag Manager */}
      {scripts?.googleTagManagerId && (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${scripts.googleTagManagerId}');
          `}
        </Script>
      )}

      {/* 5. Custom Head Code (Rendered as raw HTML) */}
      {scripts?.customHeadCode && (
        <span dangerouslySetInnerHTML={{ __html: scripts.customHeadCode }} />
      )}
    </>
  );
}
