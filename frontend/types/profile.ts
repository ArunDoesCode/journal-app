export interface Profile {
  id: string
  height_cm: number | null
  full_name: string | null
  avatar_url: string | null
  weight_check_weeks: 1 | 2
  created_at: string
}

export interface ProfileUpdateInput {
  height_cm: number | null
  weight_check_weeks: 1 | 2
}

export interface ProfileFormValues {
  height_cm: string
  weight_check_weeks: "1" | "2"
}
