import type { NextConfig } from "next";

// Allow extra properties that Next might support depending on installed version
const nextConfig: import("next").NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
};


export default nextConfig;
