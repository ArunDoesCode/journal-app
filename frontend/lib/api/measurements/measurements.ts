import { createClient } from "@/lib/supabase/client"
import type { ApiResponse, Measurement } from "@/types"

export async function getMeasurements(): Promise<ApiResponse<Measurement[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("measurements")
    .select("*")
    .order("date", { ascending: false })

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data: data ?? [] }
}

export async function insertMeasurement(
  values: Omit<Measurement, "id" | "user_id">,
): Promise<ApiResponse<Measurement>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("measurements")
    .upsert({ user_id: user.id, ...values }, { onConflict: "user_id,date" })
    .select()
    .single()

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}
