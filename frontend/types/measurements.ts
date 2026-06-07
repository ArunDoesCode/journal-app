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

export type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]

export interface Measurement {
  id: string
  user_id: string
  date: string
  neck: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  biceps: number | null
  forearm: number | null
  thighs: number | null
  calves: number | null
}
