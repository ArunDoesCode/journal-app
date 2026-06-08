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
import type { Measurement } from "@/types"

interface WeightChartProps {
  measurements: Measurement[] | null
}

export default function WeightChart({ measurements }: WeightChartProps) {
  if (!measurements) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  const data = measurements
    .slice()
    .reverse()
    .map((measurement) => ({
      date: measurement.date,
      value: measurement.weight_kg ?? null,
    }))
    .filter((item) => item.value !== null)

  return (
    <div style={{ width: "100%", height: 192 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--card-foreground))",
              borderRadius: "0.5rem",
            }}
            formatter={(value) => [`${value} kg`, "weight"]}
            labelFormatter={(label) => `Date: ${label}`}
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
