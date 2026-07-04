import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // No Next image-optimizer runs on the Cloudflare worker, so <Image> must
  // serve the source URL directly — otherwise /_next/image 400s on the
  // Supabase signed URLs and avatars render as broken images.
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
