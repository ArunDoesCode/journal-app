import type { Metadata } from "next"
import { Outfit } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL

export const metadata: Metadata = {
  title: "Body Metrics",
  description: "Daily body measurement and journaling PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Body Metrics",
  },
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
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
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
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
