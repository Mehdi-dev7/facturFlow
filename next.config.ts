import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Avatars Google OAuth
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // Avatars GitHub OAuth
    ],
  },
};

export default nextConfig;
