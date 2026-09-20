"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { getJournalEntries, getTodayEntry } from "@/lib/api/journal/journal"
import { getMeasurements } from "@/lib/api/measurements/measurements"
import {
  buildMeasurementPrSummary,
  getPrPartsForDate,
} from "@/lib/utils/measurement-pr"
import { JournalComposer } from "@/components/pages/journal/JournalComposer"
import { JournalHistory } from "@/components/pages/journal/JournalHistory"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { JournalEntry, Measurement } from "@/types"

export function JournalView() {
  const [isPending, startTransition] = useTransition()
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null | undefined>(undefined)
  const [entries, setEntries] = useState<JournalEntry[] | null>(null)
  const [measurements, setMeasurements] = useState<Measurement[] | null>(null)
  const [editing, setEditing] = useState(false)

  const fetchAll = useCallback(() => {
    startTransition(async () => {
      const [todayRes, entriesRes, measurementsRes] = await Promise.all([
        getTodayEntry(),
        getJournalEntries(),
        getMeasurements(),
      ])
      setTodayEntry(todayRes.success ? todayRes.data : null)
      setEntries(entriesRes.success ? entriesRes.data : [])
      setMeasurements(measurementsRes.success ? measurementsRes.data : [])
    })
  }, [startTransition])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSaved = useCallback(() => {
    setEditing(false)
    fetchAll()
  }, [fetchAll])

  const today = useMemo(() => new Date().toISOString().split("T")[0], [])
  const prSummary = useMemo(
    () => buildMeasurementPrSummary(measurements ?? []),
    [measurements]
  )
  const todayPrParts = getPrPartsForDate(prSummary, today)
  const prDateList = Object.keys(prSummary.prPartsByDate)
  const showPrompt = !editing && todayEntry === null && todayPrParts.length > 0
  const historyEntries = entries?.filter((e) => e.date !== todayEntry?.date) ?? []

  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-center text-xl font-semibold">Journal</h1>

      {todayEntry === undefined ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : todayEntry !== null && !editing ? (
        <Card>
          <CardHeader>
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
        <div className="flex flex-col gap-3">
          {showPrompt && (
            <Card className="border-chart-1/50 bg-chart-1/10 p-4">
                <p className="font-medium">🏆 Personal Best Day</p>
                <p className="text-muted-foreground">
                  You hit new records in{" "}
                  {todayPrParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(", ")}.
                  What is working well for you today?
                </p>
            </Card>
          )}
          <JournalComposer
            onSubmitted={handleSaved}
            existingEntry={editing && todayEntry ? todayEntry : undefined}
            onCancelEdit={editing ? () => setEditing(false) : undefined}
          />
        </div>
      )}

      {entries === null || measurements === null || isPending ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : (
        <JournalHistory entries={historyEntries} prDates={prDateList} />
      )}
    </div>
  )
}
