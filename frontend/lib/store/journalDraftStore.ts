import { create } from "zustand"
import { persist } from "zustand/middleware"

interface JournalDraftState {
  text: string
  audioUrl: string | null
  setText: (text: string) => void
  setAudioUrl: (url: string | null) => void
  clearDraft: () => void
}

export const useJournalDraftStore = create<JournalDraftState>()(
  persist(
    (set) => ({
      text: "",
      audioUrl: null,
      setText: (text) => set({ text }),
      setAudioUrl: (audioUrl) => set({ audioUrl }),
      clearDraft: () => set({ text: "", audioUrl: null }),
    }),
    { name: "journal-draft" },
  ),
)
