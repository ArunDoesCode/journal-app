"use client"

import { useEffect } from "react"
import { Ruler } from "lucide-react"
import { getMeasurements } from "@/lib/api/measurements/measurements"
import { useMeasureStore } from "@/lib/store/measureStore"
import { MetricSelector } from "@/components/pages/measure/MetricSelector"
import { MeasurementChart } from "@/components/pages/measure/MeasurementChart"
import { MeasureSheet } from "@/components/pages/measure/MeasureSheet"
import { Button } from "@/components/ui/button"

export function MeasureView() {
  const { measurements, selectedMetric, openSheet, setMeasurements } =
    useMeasureStore()

  useEffect(() => {
    getMeasurements().then((res) => {
      if (res.success) setMeasurements(res.data)
    })
  }, [setMeasurements])

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-6 p-4">
      <h1 className="text-xl font-semibold">Measure</h1>

      <MeasurementChart
        measurements={measurements}
        selectedMetric={selectedMetric}
      />
      <MetricSelector />

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2">
        <Button
          onClick={openSheet}
          size="lg"
          className="gap-2 rounded-full px-8 shadow-lg"
        >
          <Ruler size={18} />
          Measure
        </Button>
      </div>

      <MeasureSheet />
    </div>
  )
}
