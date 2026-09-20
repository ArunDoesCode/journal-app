"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CHART_RANGES, type ChartRange } from "@/types"

const LABELS: Record<ChartRange, string> = {
  week: "Week",
  month: "Month",
  all_time: "Year",
}

interface ChartRangeSelectorProps {
  value: ChartRange
  onChange: (value: ChartRange) => void
}

export default function ChartRangeSelector({
  value,
  onChange,
}: ChartRangeSelectorProps) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ChartRange)}>
      <SelectTrigger className="w-fit" aria-label="Chart range">
        <SelectValue placeholder="Select range" />
      </SelectTrigger>
      <SelectContent>
        {CHART_RANGES.map((range) => (
          <SelectItem key={range} value={range}>
            {LABELS[range]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
