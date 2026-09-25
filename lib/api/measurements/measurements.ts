import { createClient } from "@/lib/supabase/client"
import { localISODateDaysAgo, todayLocalISODate } from "@/lib/utils/date"
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
    query = query.gte("date", localISODateDaysAgo(days - 1))
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
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (!userId) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("measurements")
    .upsert({ user_id: userId, ...values }, { onConflict: "user_id,date" })
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
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims.sub
  if (!userId) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("measurements")
    .upsert(
      { user_id: userId, date: todayLocalISODate(), weight_kg: weightKg },
      { onConflict: "user_id,date" }
    )
    .select()
    .single()

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}
