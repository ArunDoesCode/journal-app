"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { getMeasurements } from "@/lib/api/measurements/measurements"
import { getProfile } from "@/lib/api/profile/profile"
import { useMeasureStore } from "@/lib/store/measureStore"
import type { ChartRange, Measurement } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import ChartRangeSelector from "@/components/pages/measure/ChartRangeSelector"

const MetricSelector = dynamic(
  () => import("@/components/pages/measure/MetricSelector").then((module) => module.MetricSelector)
)
const MeasurementChart = dynamic(
  () => import("@/components/pages/measure/MeasurementChart").then((module) => module.MeasurementChart),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
  }
)
const WeightChart = dynamic(
  () => import("@/components/pages/measure/WeightChart"),
  {
    loading: () => <Skeleton className="h-48 w-full rounded-xl" />,
  }
)
const MeasureSheet = dynamic(
  () => import("@/components/pages/measure/MeasureSheet").then((module) => module.MeasureSheet)
)
const WeightSheet = dynamic(() => import("@/components/pages/measure/WeightSheet"))

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

const RANGE_DAYS: Record<Exclude<ChartRange, "all_time">, number> = {
  week: 7,
  month: 30,
}

function filterMeasurementsByRange(
  measurements: Measurement[],
  range: ChartRange
): Measurement[] {
  if (range === "all_time") {
    return measurements
  }

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
  const {
    measurements,
    selectedMetric,
    chartRange,
    setChartRange,
    openSheet,
    openWeightSheet,
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
          <Button onClick={openSheet} className="rounded-full shadow-lg">
            Log Measurement
          </Button>
        </div>
        <MeasurementChart
          measurements={filteredMeasurements}
          selectedMetric={selectedMetric}
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
            openWeightSheet()
          }}
          disabled={isPending}
          className="rounded-full shadow-lg"
        >
          Log Weight
        </Button>
      </div>

      <MeasureSheet />
      <WeightSheet
        canLogWeight={canLogWeight}
        nextWeightDate={nextWeightDateLabel}
      />
    </div>
  )
}
