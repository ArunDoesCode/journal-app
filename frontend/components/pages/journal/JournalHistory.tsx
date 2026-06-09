"use client"

import { useState } from "react"
import { Volume2, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { JournalEntry } from "@/types"

interface Props {
  entries: JournalEntry[]
  prDates?: string[]
}

export function JournalHistory({ entries, prDates = [] }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const prDateSet = new Set(prDates)

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No previous entries.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-base font-medium">History</h2>
      {entries.map((entry) => {
        const expanded = expandedId === entry.id
        const preview = entry.text_content?.slice(0, 120) ?? ""
        const isLong = (entry.text_content?.length ?? 0) > 120

        return (
          <Card
            key={entry.id}
            className="cursor-pointer"
            onClick={() => setExpandedId(expanded ? null : entry.id)}
          >
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{entry.date}</span>
                  {prDateSet.has(entry.date) && <span>🏆 PR Day</span>}
                </div>
                <div className="flex items-center gap-2">
                  {entry.audio_url && (
                    <Volume2 size={14} className="text-muted-foreground" />
                  )}
                  {expanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="">
              {!expanded && (
                <p className="line-clamp-2 text-sm">
                  {preview}
                  {isLong && !expanded && "…"}
                </p>
              )}
              {expanded && (
                <div className="flex flex-col gap-3">
                  {entry.text_content && (
                    <p className="text-sm whitespace-pre-wrap">
                      {entry.text_content}
                    </p>
                  )}
                  {entry.audio_url && (
                    <audio
                      controls
                      src={entry.audio_url}
                      className="h-10 w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
