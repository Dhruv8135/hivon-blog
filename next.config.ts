import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zvadpxgfnlbfkatnhhbp.supabase.co",
      },
    ],
  },
};

export default nextConfig;
