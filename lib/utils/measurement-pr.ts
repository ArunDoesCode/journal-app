import {
  MEASUREMENT_FIELDS,
  type Measurement,
  type MeasurementField,
  type MeasurementPrSummary,
} from "@/types"

function emptyPrDatesByMetric(): Record<MeasurementField, string[]> {
  return Object.fromEntries(
    MEASUREMENT_FIELDS.map((field) => [field, [] as string[]])
  ) as Record<MeasurementField, string[]>
}

export function buildMeasurementPrSummary(
  measurements: Measurement[]
): MeasurementPrSummary {
  const byDateAsc = measurements
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  const prDatesByMetric = emptyPrDatesByMetric()
  const prPartsByDate: Record<string, MeasurementField[]> = {}
  const bestByMetric: Record<MeasurementField, number | null> =
    Object.fromEntries(
      MEASUREMENT_FIELDS.map((field) => [field, null])
    ) as Record<MeasurementField, number | null>

  for (const measurement of byDateAsc) {
    for (const field of MEASUREMENT_FIELDS) {
      const value = measurement[field]
      if (value === null) continue

      const best = bestByMetric[field]
      if (best !== null && value >= best) continue

      bestByMetric[field] = value
      prDatesByMetric[field].push(measurement.date)
      prPartsByDate[measurement.date] = [
        ...(prPartsByDate[measurement.date] ?? []),
        field,
      ]
    }
  }

  return { prDatesByMetric, prPartsByDate }
}

export function getPrPartsForDate(
  summary: MeasurementPrSummary,
  date: string
): MeasurementField[] {
  return summary.prPartsByDate[date] ?? []
}
