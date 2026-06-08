import type { NextConfig } from "next"
import nextPwa from "next-pwa"

const withPWA = nextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "app-pages",
        expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      urlPattern: ({ request }: { request: Request }) =>
        ["style", "script", "font", "image"].includes(request.destination),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "app-static",
        expiration: { maxEntries: 120, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
  ],
})

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

const isDevelopment = process.env.NODE_ENV === "development"

export default isDevelopment ? nextConfig : withPWA(nextConfig)
