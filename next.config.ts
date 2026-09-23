import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output keeps the Docker image slim (self-contained Node server).
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Allow Arena's proxied live-preview host to load Next dev assets.
  allowedDevOrigins: ["*.e2b.app"],
  // On persistent servers, build uploads use the local chunked routes. On
  // serverless, the client sends multipart builds directly to Vercel Blob;
  // all metadata and credentials use the shared PostgreSQL database.
};

export default nextConfig;
