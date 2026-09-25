"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMeasureStore } from "@/lib/store/measureStore"
import {
  MEASUREMENT_FIELD_LABELS,
  MEASUREMENT_FIELDS,
  type MeasurementField,
} from "@/types"

export function MetricSelector() {
  const { selectedMetric, setSelectedMetric } = useMeasureStore()

  return (
    <Select
      value={selectedMetric}
      onValueChange={(v) => setSelectedMetric(v as MeasurementField)}
    >
      <SelectTrigger
        className="w-fit place-self-end px-8"
        aria-label="Measurement metric"
      >
        <SelectValue placeholder="Select metric" />
      </SelectTrigger>
      <SelectContent>
        {MEASUREMENT_FIELDS.map((field) => (
          <SelectItem key={field} value={field}>
            {MEASUREMENT_FIELD_LABELS[field]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
