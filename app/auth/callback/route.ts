import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const metadata = data.user.user_metadata
      const fullName =
        typeof metadata.full_name === "string"
          ? metadata.full_name
          : typeof metadata.name === "string"
            ? metadata.name
            : null
      const avatarUrl =
        typeof metadata.avatar_url === "string"
          ? metadata.avatar_url
          : typeof metadata.picture === "string"
            ? metadata.picture
            : null

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          full_name: fullName,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" }
      )

      if (profileError) {
        redirect("/measure?warning=profile-sync")
      }

      redirect("/measure")
    }
  }

  redirect("/login?error=auth")
}
