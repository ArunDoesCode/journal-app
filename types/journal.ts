export interface JournalEntry {
  id: string
  user_id: string
  date: string
  text_content: string | null
  audio_url: string | null
  created_at: string
}
