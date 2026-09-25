"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { getMeasurements } from "@/lib/api/measurements/measurements"
import { getProfile } from "@/lib/api/profile/profile"
import { useMeasureStore } from "@/lib/store/measureStore"
import type { Measurement } from "@/types"
import { buildMeasurementPrSummary } from "@/lib/utils/measurement-pr"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import ChartRangeSelector from "@/components/pages/measure/ChartRangeSelector"
import { MetricSelector } from "@/components/pages/measure/MetricSelector"

const ChartSkeleton = () => <Skeleton className="h-48 w-full rounded-xl" />

const MeasurementChart = dynamic(
  () =>
    import("@/components/pages/measure/MeasurementChart").then(
      (mod) => mod.MeasurementChart
    ),
  { ssr: false, loading: ChartSkeleton }
)
const WeightChart = dynamic(
  () => import("@/components/pages/measure/WeightChart"),
  { ssr: false, loading: ChartSkeleton }
)
const MeasureSheet = dynamic(() =>
  import("@/components/pages/measure/MeasureSheet").then(
    (mod) => mod.MeasureSheet
  )
)
const WeightSheet = dynamic(
  () => import("@/components/pages/measure/WeightSheet")
)

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
  // Range-bound subset fetched only for "week"/"month" chart display — never
  // used for PR calculations, which always need the full unbounded history.
  const [rangeMeasurements, setRangeMeasurements] = useState<
    Measurement[] | null
  >(null)

  // Full, unbounded history — the canonical source for PR calculations and
  // weight-check-date logic. Fetched once, independent of the chart range so
  // switching ranges can never silently narrow the PR basis.
  useEffect(() => {
    startTransition(async () => {
      const [measurementResult, profileResult] = await Promise.all([
        getMeasurements("all_time"),
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

  // Chart-only fetch, bounded server-side for "week"/"month" to keep the
  // payload small when a narrower range is selected.
  useEffect(() => {
    if (chartRange === "all_time") return
    startTransition(async () => {
      const result = await getMeasurements(chartRange)
      if (result.success) {
        setRangeMeasurements(result.data)
      } else {
        toast.error(result.message || "Failed to load measurements")
      }
    })
  }, [chartRange, startTransition])

  const lastWeightDate = useMemo(
    () =>
      measurements.find((measurement) => measurement.weight_kg !== null)
        ?.date ?? null,
    [measurements]
  )

  const nextWeightDate = useMemo(() => {
    if (!lastWeightDate) return null
    return addDays(lastWeightDate, weightCheckWeeks * 7)
  }, [lastWeightDate, weightCheckWeeks])

  const canLogWeight = useMemo(() => {
    if (!nextWeightDate) return true
    const today = new Date()
    const todayOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    )
    return todayOnly.getTime() >= nextWeightDate.getTime()
  }, [nextWeightDate])

  const nextWeightDateLabel = nextWeightDate ? formatDate(nextWeightDate) : null
  const prSummary = useMemo(
    () => buildMeasurementPrSummary(measurements),
    [measurements]
  )
  const metricPrDates = prSummary.prDatesByMetric[selectedMetric]
  const chartMeasurements =
    chartRange === "all_time" ? measurements : (rangeMeasurements ?? [])

  return (
    <div className="flex min-h-screen flex-col gap-4 p-4 pb-24">
      <h1 className="text-center text-xl font-semibold">Measure</h1>
      <div className="flex flex-col gap-6">
        <div className="flex w-full justify-between">
          <ChartRangeSelector value={chartRange} onChange={setChartRange} />
          <Button
            onClick={() => setMeasurementSheetOpen(true)}
            disabled={isPending}
            className="rounded-full shadow-lg"
          >
            Log Measurement
          </Button>
        </div>
        <MeasurementChart
          measurements={chartMeasurements}
          selectedMetric={selectedMetric}
          prDates={metricPrDates}
        />
        <MetricSelector />
        <h1 className="pl-2 font-bold">Weight </h1>

        <WeightChart measurements={chartMeasurements} />

        <Button
          onClick={() => {
            if (!canLogWeight) {
              toast.error(
                `Next weight entry available on ${nextWeightDateLabel}`
              )
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
