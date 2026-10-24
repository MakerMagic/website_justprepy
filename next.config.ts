import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  agentRules: false,
  // The local LAN preview needs the same dev hydration/HMR transport as localhost.
  allowedDevOrigins: ["192.168.1.2"],
};
export default nextConfig;
