import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable filesystem caching for `next dev`
    turbopackFileSystemCacheForDev: false,
    // Enable filesystem caching for `next build`
    turbopackFileSystemCacheForBuild: false,
    /* turbo: {
      memoryLimit: 1024 * 1024 * 128,  // 128MB лимит
      treeShaking: true,  // Удаление неиспользуемого кода
    },*/
  },
};

export default nextConfig;
