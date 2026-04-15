import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LAN testing in development (mobile/other devices on same network).
  allowedDevOrigins: [
    "172.20.10.3",
    "localhost",
    "127.0.0.1",
  ],
};

export default nextConfig;
