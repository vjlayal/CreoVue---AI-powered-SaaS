import type { NextConfig } from "next";

// Allow extra properties that Next might support depending on installed version
const nextConfig: any = {
  // Primary option (supported in recent Next versions)
  middlewareClientMaxBodySize: '200mb',
  // Some Next versions expose this under `experimental` or `middleware` namespaces
  experimental: {
    middlewareClientMaxBodySize: '200mb',
  },
  // Also set API body parser limit as a fallback (some deploy targets read this)
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
  },
};

export default nextConfig;
