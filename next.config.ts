import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image slim (self-contained Node server).
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Large app-build uploads (up to 150MB) are streamed through chunked
  // route handlers on the Node runtime — see app/api/builds/*.
  // This app must run on a persistent Node server; it is NOT designed
  // for serverless platforms with ephemeral filesystems.
};

export default nextConfig;
