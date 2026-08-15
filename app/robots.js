export default function robots() {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.vestoriahub.com";

  return {
    rules: {
      userAgent: "*", // Har search engine bot (Google, Bing, etc.) ke liye
      allow: "/", // Pori website ko crawl karne ki permission
      disallow: [
        "/api/", // Backend API routes ko block karna zaroori hai
        "/admin/", // Admin panel ya dashboard ko hide rakhein
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`, // Aapka banaya hua sitemap link
  };
}
