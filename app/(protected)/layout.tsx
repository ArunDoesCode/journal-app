import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/navbar"
import { Providers } from "@/lib/providers"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <Providers>
      <main>{children}</main>
      <BottomNav />
    </Providers>
  )
}
