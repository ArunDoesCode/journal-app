import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Trust the x-forwarded-host header from tunnels (ngrok, cloudflared, etc.)
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.trycloudflare.com",
    "obsession-clad-dwindling.ngrok-free.dev",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  turbopack: {},
}

export default nextConfig
