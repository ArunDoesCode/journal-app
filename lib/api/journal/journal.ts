import { createClient } from "@/lib/supabase/client"
import type { ApiResponse, JournalEntry } from "@/types"

export async function getJournalEntries(): Promise<ApiResponse<JournalEntry[]>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false })

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data: data ?? [] }
}

export async function getTodayEntry(): Promise<ApiResponse<JournalEntry | null>> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("date", today)
    .maybeSingle()

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}

export async function insertJournalEntry(values: {
  date: string
  text_content: string | null
  audio_url: string | null
}): Promise<ApiResponse<JournalEntry>> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }

  const { data, error } = await supabase
    .from("journal_entries")
    .upsert({ user_id: user.id, ...values }, { onConflict: "user_id,date" })
    .select()
    .single()

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}

export async function updateJournalEntry(
  id: string,
  values: { text_content: string | null; audio_url: string | null },
): Promise<ApiResponse<JournalEntry>> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data }
}


export async function uploadAudio(
  blob: Blob,
  userId: string,
  date: string,
  ext = "webm",
): Promise<string> {
  const supabase = createClient()
  const path = `${userId}/${date}.${ext}`

  const { error } = await supabase.storage
    .from("journal")
    .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from("journal").getPublicUrl(path)
  // Append timestamp to bust CDN/browser cache after re-upload
  return `${data.publicUrl}?t=${Date.now()}`
}
