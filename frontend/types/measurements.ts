export const MEASUREMENT_FIELDS = [
  "neck",
  "chest",
  "waist",
  "hips",
  "biceps",
  "forearm",
  "thighs",
  "calves",
] as const

export const CHART_RANGES = ["week", "month", "all_time"] as const

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]
export type ChartRange = (typeof CHART_RANGES)[number]

export interface Measurement {
  id: string
  user_id: string
  date: string
  weight_kg: number | null
  neck: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  biceps: number | null
  forearm: number | null
  thighs: number | null
  calves: number | null
}

export type MeasurementValues = Record<MeasurementField, number | null>

export interface UpsertMeasurementInput extends MeasurementValues {
  date: string
  weight_kg?: number | null
}
