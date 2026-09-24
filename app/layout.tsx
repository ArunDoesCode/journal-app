import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"

import "./globals.css"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL

export const metadata: Metadata = {
  title: "Body Metrics",
  description: "Daily body measurement and journaling PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Body Metrics",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(1 0 0)" },
    {
      media: "(prefers-color-scheme: dark)",
      color: "oklch(0.147 0.004 49.3)",
    },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", outfit.variable)}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        {supabaseOrigin && (
          <>
            <link
              rel="preconnect"
              href={supabaseOrigin}
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="apple-touch-icon-precomposed"
          href="/apple-touch-icon-precomposed.png"
        />
        {/* iOS apple-touch-startup-image splash screens (per-device-size PNGs)
            would go here — requires an image pipeline, not added in this pass. */}
      </head>
      <body>
        <ServiceWorkerRegister />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
