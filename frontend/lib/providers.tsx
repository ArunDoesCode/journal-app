"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Offline toast
    const handleOffline = () =>
      toast.error("App is offline. Please connect to the internet.")
    window.addEventListener("offline", handleOffline)

    // Service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failure is non-fatal
      })
    }

    return () => window.removeEventListener("offline", handleOffline)
  }, [])

  return (
    <>
      <Toaster richColors position="top-right" />
      {children}
    </>
  )
}
