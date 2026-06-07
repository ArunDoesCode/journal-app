"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil } from "lucide-react"
import { getJournalEntries, getTodayEntry } from "@/lib/api/journal/journal"
import { JournalComposer } from "@/components/pages/journal/JournalComposer"
import { JournalHistory } from "@/components/pages/journal/JournalHistory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { JournalEntry } from "@/types"

export function JournalView() {
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null | undefined>(undefined)
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [editing, setEditing] = useState(false)

  const fetchAll = useCallback(() => {
    getTodayEntry().then((res) => setTodayEntry(res.success ? res.data : null))
    getJournalEntries().then((res) => setEntries(res.success ? res.data : []))
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSaved = useCallback(() => {
    setEditing(false)
    fetchAll()
  }, [fetchAll])

  const historyEntries = entries?.filter((e) => e.date !== todayEntry?.date) ?? []

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-center text-xl font-semibold">Journal</h1>

      {todayEntry === undefined ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : todayEntry !== null && !editing ? (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Today — {todayEntry.date}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs"
                onClick={() => setEditing(true)}
              >
                <Pencil size={12} />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {todayEntry.text_content && (
              <p className="text-sm whitespace-pre-wrap">{todayEntry.text_content}</p>
            )}
            {todayEntry.audio_url && (
              <audio controls src={todayEntry.audio_url} className="w-full h-10" />
            )}
          </CardContent>
        </Card>
      ) : (
        <JournalComposer
          onSubmitted={handleSaved}
          existingEntry={editing && todayEntry ? todayEntry : undefined}
          onCancelEdit={editing ? () => setEditing(false) : undefined}
        />
      )}

      {entries === null ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <JournalHistory entries={historyEntries} />
      )}
    </div>
  )
}
