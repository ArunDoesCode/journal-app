"use client"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import type { Measurement, MeasurementField } from "@/types"

interface Props {
  measurements: Measurement[] | null
  selectedMetric: MeasurementField
}

export function MeasurementChart({ measurements, selectedMetric }: Props) {
  if (!measurements) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  const data = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date,
      value: m[selectedMetric] ?? null,
    }))
    .filter((d) => d.value !== null)

  return (
    <div style={{ width: "100%", height: 192 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(v: string) => v.slice(5)}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--card-foreground))",
              borderRadius: "0.5rem",
            }}
            formatter={(value) => [`${value} cm`, selectedMetric]}
            labelFormatter={(l) => `Date: ${l}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            className="stroke-primary"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
