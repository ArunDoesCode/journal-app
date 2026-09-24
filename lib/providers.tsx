"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"
import { Analytics } from "@vercel/analytics/next"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOffline = () =>
      toast.error("App is offline. Please connect to the internet.")
    const handleOnline = () => toast.success("Back online.")

    if (!navigator.onLine) handleOffline()

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  return (
    <>
      <Toaster richColors position="top-right" />
      {children}
      <Analytics />
    </>
  )
}
