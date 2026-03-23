import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable filesystem caching for `next dev`
    turbopackFileSystemCacheForDev: false,
    // Enable filesystem caching for `next build`
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
