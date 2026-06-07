"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Mic, Square } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { insertJournalEntry, updateJournalEntry, uploadAudio } from "@/lib/api/journal/journal"
import { useJournalDraftStore } from "@/lib/store/journalDraftStore"
import { createClient } from "@/lib/supabase/client"
import type { JournalEntry } from "@/types"

function useRecordingTimer() {
  const [seconds, setSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = () => {
    setSeconds(0)
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
  }
  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current)
  }
  const format = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  }

  return { seconds, start, stop, format }
}

interface Props {
  onSubmitted: () => void
  existingEntry?: JournalEntry
  onCancelEdit?: () => void
}

export function JournalComposer({ onSubmitted, existingEntry, onCancelEdit }: Props) {
  const router = useRouter()
  const isEditing = !!existingEntry

  // In edit mode use local state pre-filled with existing; in new mode use persisted draft
  const draft = useJournalDraftStore()
  const [editText, setEditText] = useState(existingEntry?.text_content ?? "")
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(existingEntry?.audio_url ?? null)

  const text = isEditing ? editText : draft.text
  const audioUrl = isEditing ? editAudioUrl : draft.audioUrl
  const setText = isEditing ? setEditText : draft.setText
  const setAudioUrl = isEditing ? setEditAudioUrl : draft.setAudioUrl

  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const extRef = useRef<string>("webm")
  const chunksRef = useRef<Blob[]>([])
  const { seconds, start: startTimer, stop: stopTimer, format } = useRecordingTimer()

  // Always release mic on unmount (covers navigate-away, cancel, etc.)
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const releaseStream = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop())
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const canSubmit = (text.trim().length > 0 || audioUrl !== null) && !recording

  const startRecording = async () => {
    // iOS Safari only supports audio/mp4; use webm on everything else
    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : ""
    extRef.current = mimeType.includes("mp4") ? "mp4" : "webm"

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        releaseStream() // safety net in case not already released
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
        if (blob.size === 0) {
          toast.error("Recording failed. Please try again.")
          return
        }
        setUploading(true)
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error("Not authenticated")
          const today = new Date().toISOString().split("T")[0]
          const url = await uploadAudio(blob, user.id, today, extRef.current)
          setAudioUrl(url)
          toast.success("Audio saved")
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Upload failed")
        } finally {
          chunksRef.current = []
          mediaRecorderRef.current = null
          setUploading(false)
        }
      }
      mediaRecorderRef.current = recorder
      recorder.start(1000) // collect data every 1s — required for iOS to emit ondataavailable
      setRecording(true)
      startTimer()
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
        const msg = isIOS
          ? "Microphone blocked. Go to Settings → Apps → Safari → Microphone → Allow, then reload."
          : "Microphone blocked. Tap the 🔒 icon in your browser address bar and allow Microphone, then reload."
        toast.error(msg, { duration: 6000 })
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        toast.error("No microphone found on this device.")
      } else {
        toast.error("Could not start recording.")
      }
    }
  }

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current
    if (recorder?.state === "recording") {
      recorder.requestData()
      recorder.stop()
    }
    releaseStream() // kills iOS OS-level mic indicator immediately
    mediaRecorderRef.current = null
    setRecording(false)
    stopTimer()
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    startTransition(async () => {
      const payload = { text_content: text.trim() || null, audio_url: audioUrl }

      const res = isEditing
        ? await updateJournalEntry(existingEntry.id, payload)
        : await insertJournalEntry({
            date: new Date().toISOString().split("T")[0],
            ...payload,
          })

      if (res.success) {
        toast.success(isEditing ? "Entry updated" : "Entry saved")
        if (!isEditing) {
          draft.clearDraft()
          router.refresh()
        }
        onSubmitted()
      } else {
        toast.error(res.message || "Failed to save")
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {isEditing && (
        <p className="text-xs text-muted-foreground">Editing today&apos;s entry</p>
      )}

      <Textarea
        placeholder="How are you feeling today?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-24 resize-none"
        rows={3}
      />

      <div className="flex items-center gap-2">
        {!recording ? (
          <Button
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={uploading || isPending || audioUrl !== null}
            className="gap-2"
          >
            <Mic size={16} />
            {audioUrl ? "Audio recorded ✓" : "Record audio"}
          </Button>
        ) : (
          <Button variant="destructive" size="sm" onClick={stopRecording} className="gap-2">
            <Square size={14} />
            Stop — {format(seconds)}
          </Button>
        )}
        {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
        {audioUrl && isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-destructive"
            onClick={() => setAudioUrl(null)}
            disabled={isPending}
          >
            Remove audio
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        {onCancelEdit && (
          <Button variant="outline" onClick={onCancelEdit} disabled={isPending || recording} className="flex-1">
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || isPending || uploading}
          className="flex-1"
        >
          {isPending ? "Saving…" : isEditing ? "Update entry" : "Save entry"}
        </Button>
      </div>
    </div>
  )
}
