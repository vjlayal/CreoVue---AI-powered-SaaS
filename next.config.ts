import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Allow extra properties that Next might support depending on installed version
const nextConfig: import("next").NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
};

export default withSentryConfig(nextConfig, {
  org: "sample-org",
  project: "sample-project",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { disable: true },
  webpack: {
    reactComponentAnnotation: { enabled: true },
    treeshake: { removeDebugLogging: true },
  },
});
