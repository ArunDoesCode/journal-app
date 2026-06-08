import { createClient } from "@/lib/supabase/client"
import type { ApiResponse, Measurement, UpsertMeasurementInput } from "@/types"

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
  values: UpsertMeasurementInput
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

export async function insertWeight(
  weightKg: number
): Promise<ApiResponse<Measurement>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const today = new Date().toISOString().split("T")[0]
  const { data, error } = await supabase
    .from("measurements")
    .upsert(
      { user_id: user.id, date: today, weight_kg: weightKg },
      { onConflict: "user_id,date" }
    )
    .select()
    .single()

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}
