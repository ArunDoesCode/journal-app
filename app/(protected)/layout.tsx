import { BottomNav } from "@/components/navbar"
import { Providers } from "@/lib/providers"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <main>{children}</main>
      <BottomNav />
    </Providers>
  )
}
