import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify is now enabled by default in Next.js 13+
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // optimizeFonts is now enabled by default in Next.js 12+
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
