import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from the backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
