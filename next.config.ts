import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   productionBrowserSourceMaps: false,  // ← ADD THIS
  poweredByHeader: false,              // ← ADD THIS
};

export default nextConfig;
