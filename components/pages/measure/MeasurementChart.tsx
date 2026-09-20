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
  prDates: string[]
}

export function MeasurementChart({
  measurements,
  selectedMetric,
  prDates,
}: Props) {
  if (!measurements) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  const prDateSet = new Set(prDates)
  const data = measurements
    .slice()
    .reverse()
    .map((measurement) => ({
      date: measurement.date,
      value: measurement[selectedMetric] ?? null,
      isPr: prDateSet.has(measurement.date),
    }))
    .filter((point) => point.value !== null)

  return (
    <div style={{ width: "100%", height: 192 }}>
      <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            tickFormatter={(value: string) => value.slice(5)}
            className="text-muted-foreground"
          />
          <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--card-foreground)",
              borderRadius: "0.5rem",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            }}
            wrapperStyle={{ zIndex: 20 }}
            formatter={(value) => [`${value} cm`, selectedMetric]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="value"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 4 }}
            className="stroke-primary"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
