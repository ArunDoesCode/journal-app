"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import { getMeasurements } from "@/lib/api/measurements/measurements"
import { getProfile } from "@/lib/api/profile/profile"
import { useMeasureStore } from "@/lib/store/measureStore"
import type { ChartRange, Measurement } from "@/types"
import { buildMeasurementPrSummary } from "@/lib/utils/measurement-pr"
import { Button } from "@/components/ui/button"
import ChartRangeSelector from "@/components/pages/measure/ChartRangeSelector"
import { MetricSelector } from "@/components/pages/measure/MetricSelector"
import { MeasurementChart } from "@/components/pages/measure/MeasurementChart"
import { MeasureSheet } from "@/components/pages/measure/MeasureSheet"
import WeightSheet from "@/components/pages/measure/WeightSheet"
import WeightChart from "@/components/pages/measure/WeightChart"

function addDays(date: string, days: number): Date {
  const target = new Date(`${date}T00:00:00`)
  target.setDate(target.getDate() + days)
  return target
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const RANGE_DAYS: Record<ChartRange, number> = {
  week: 7,
  month: 30,
  all_time: 365,
}

function filterMeasurementsByRange(
  measurements: Measurement[],
  range: ChartRange
): Measurement[] {
  const days = RANGE_DAYS[range]
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (days - 1))

  return measurements.filter((measurement) => {
    const measurementDate = new Date(`${measurement.date}T00:00:00`)
    return measurementDate.getTime() >= startDate.getTime()
  })
}

export function MeasureView() {
  const [isPending, startTransition] = useTransition()
  const [measurementSheetOpen, setMeasurementSheetOpen] = useState(false)
  const [weightSheetOpen, setWeightSheetOpen] = useState(false)
  const {
    measurements,
    selectedMetric,
    chartRange,
    setChartRange,
    setMeasurements,
  } = useMeasureStore()

  const [weightCheckWeeks, setWeightCheckWeeks] = useState<1 | 2>(1)

  useEffect(() => {
    startTransition(async () => {
      const [measurementResult, profileResult] = await Promise.all([
        getMeasurements(),
        getProfile(),
      ])

      if (measurementResult.success) {
        setMeasurements(measurementResult.data)
      } else {
        toast.error(measurementResult.message || "Failed to load measurements")
      }

      if (profileResult.success) {
        setWeightCheckWeeks(profileResult.data.weight_check_weeks)
      } else {
        toast.error(profileResult.message || "Failed to load profile")
      }
    })
  }, [setMeasurements, startTransition, setWeightCheckWeeks])

  const lastWeightDate = useMemo(
    () => measurements.find((measurement) => measurement.weight_kg !== null)?.date ?? null,
    [measurements]
  )

  const nextWeightDate = useMemo(() => {
    if (!lastWeightDate) return null
    return addDays(lastWeightDate, weightCheckWeeks * 7)
  }, [lastWeightDate, weightCheckWeeks])

  const canLogWeight = useMemo(() => {
    if (!nextWeightDate) return true
    const today = new Date()
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    return todayOnly.getTime() >= nextWeightDate.getTime()
  }, [nextWeightDate])

  const nextWeightDateLabel = nextWeightDate ? formatDate(nextWeightDate) : null
  const prSummary = useMemo(
    () => buildMeasurementPrSummary(measurements),
    [measurements]
  )
  const metricPrDates = prSummary.prDatesByMetric[selectedMetric]
  const filteredMeasurements = useMemo(
    () => filterMeasurementsByRange(measurements, chartRange),
    [measurements, chartRange]
  )

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 pb-24">
      <h1 className="text-center text-xl font-semibold">Measure</h1>
      <div className="flex flex-col gap-6">
        <div className="flex w-full justify-between">
          <ChartRangeSelector value={chartRange} onChange={setChartRange} />
          <Button
            onClick={() => setMeasurementSheetOpen(true)}
            className="rounded-full shadow-lg"
          >
            Log Measurement
          </Button>
        </div>
        <MeasurementChart
          measurements={filteredMeasurements}
          selectedMetric={selectedMetric}
          prDates={metricPrDates}
        />
        <MetricSelector />
        <h1 className="pl-2 font-bold">Weight </h1>

        <WeightChart measurements={filteredMeasurements} />

        <Button
          onClick={() => {
            if (!canLogWeight) {
              toast.error(`Next weight entry available on ${nextWeightDateLabel}`)
              return
            }
            setWeightSheetOpen(true)
          }}
          disabled={isPending}
          className="rounded-full shadow-lg"
        >
          Log Weight
        </Button>
      </div>

      <MeasureSheet
        open={measurementSheetOpen}
        onOpenChange={setMeasurementSheetOpen}
      />
      <WeightSheet
        open={weightSheetOpen}
        onOpenChange={setWeightSheetOpen}
        canLogWeight={canLogWeight}
        nextWeightDate={nextWeightDateLabel}
      />
    </div>
  )
}
