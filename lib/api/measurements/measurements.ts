import { createClient } from "@/lib/supabase/client"
import type {
  ApiResponse,
  ChartRange,
  Measurement,
  UpsertMeasurementInput,
} from "@/types"

// Bounds the query to the chart's visible window for "week"/"month" so those
// ranges fetch less. "all_time" must return the full history unbounded —
// PR/personal-best calculations depend on seeing every row, not just the
// last year — so no cutoff is applied for it.
const RANGE_DAYS: Partial<Record<ChartRange, number>> = {
  week: 7,
  month: 30,
}

export async function getMeasurements(
  range: ChartRange = "all_time"
): Promise<ApiResponse<Measurement[]>> {
  const supabase = createClient()
  const days = RANGE_DAYS[range]

  let query = supabase.from("measurements").select("*")

  if (days !== undefined) {
    const cutoff = new Date()
    cutoff.setHours(0, 0, 0, 0)
    cutoff.setDate(cutoff.getDate() - (days - 1))
    const cutoffDate = cutoff.toISOString().split("T")[0]
    query = query.gte("date", cutoffDate)
  }

  const { data, error } = await query.order("date", { ascending: false })

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
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

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
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

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}
