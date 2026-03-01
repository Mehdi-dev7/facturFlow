import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {}, // Turbopack par défaut en Next.js 16, gère fs/path nativement
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Avatars Google OAuth
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // Avatars GitHub OAuth
    ],
  },
};

export default nextConfig;
