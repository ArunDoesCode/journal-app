"use client"

import { useState } from "react"
import { Volume2, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { JournalEntry } from "@/types"

interface Props {
  entries: JournalEntry[]
}

export function JournalHistory({ entries }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm text-center py-8">No previous entries.</p>
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
            <CardHeader className="pb-1 pt-3 px-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <div className="flex items-center gap-2">
                  {entry.audio_url && <Volume2 size={14} className="text-muted-foreground" />}
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {!expanded && (
                <p className="text-sm line-clamp-2">
                  {preview}
                  {isLong && !expanded && "…"}
                </p>
              )}
              {expanded && (
                <div className="flex flex-col gap-3">
                  {entry.text_content && (
                    <p className="text-sm whitespace-pre-wrap">{entry.text_content}</p>
                  )}
                  {entry.audio_url && (
                    <audio controls src={entry.audio_url} className="w-full h-10" />
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
