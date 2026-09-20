"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMeasureStore } from "@/lib/store/measureStore"
import { MEASUREMENT_FIELDS, type MeasurementField } from "@/types"

const LABELS: Record<MeasurementField, string> = {
  neck: "Neck",
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
  biceps: "Biceps",
  forearm: "Forearm",
  thighs: "Thighs",
  calves: "Calves",
}

export function MetricSelector() {
  const { selectedMetric, setSelectedMetric } = useMeasureStore()

  return (
    <Select
      value={selectedMetric}
      onValueChange={(v) => setSelectedMetric(v as MeasurementField)}
    >
      <SelectTrigger className="place-self-end w-fit px-8" aria-label="Measurement metric">
        <SelectValue placeholder="Select metric" />
      </SelectTrigger>
      <SelectContent>
        {MEASUREMENT_FIELDS.map((field) => (
          <SelectItem key={field} value={field}>
            {LABELS[field]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
