/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable ultra-fast modern formats
    formats: ["image/avif", "image/webp"],

    // Agar external links hain (Cloudinary, AWS, etc.), unhe yahan whitelist karein
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // 🔥 Strictly allow Cloudinary
        pathname: "/**", // Allow all images from Cloudinary
      },
      {
        protocol: "https",
        hostname: "**", // (Aap apna specific image domain bhi daal sakte hain jaise 'res.cloudinary.com')
      },
    ],

    // Cache optimized images for 30 days (default is too short)
    minimumCacheTTL: 2592000,
  },
};

export default nextConfig;
