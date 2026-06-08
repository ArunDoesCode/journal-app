"use client"

import { useEffect } from "react"
import { Toaster, toast } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleOffline = () =>
      toast.error("App is offline. Please connect to the internet.")
    window.addEventListener("offline", handleOffline)

    return () => window.removeEventListener("offline", handleOffline)
  }, [])

  return (
    <>
      <Toaster richColors position="top-right" />
      {children}
    </>
  )
}
