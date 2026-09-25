import { createClient } from "@/lib/supabase/client"
import type { ApiResponse, Profile, ProfileUpdateInput } from "@/types"

export async function getProfile(): Promise<ApiResponse<Profile>> {
  const supabase = createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (!userId) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    return { success: false, message: error.message, errorCode: error.code }
  }

  return {
    success: true,
    data: data ?? {
      id: userId,
      height_cm: null,
      full_name: null,
      avatar_url: null,
      weight_check_weeks: 1,
      created_at: "",
    },
  }
}

export async function upsertProfile(
  values: ProfileUpdateInput
): Promise<ApiResponse<Profile>> {
  const supabase = createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (!userId) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...values })
    .select()
    .single()

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}
