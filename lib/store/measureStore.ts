import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { ChartRange, Measurement, MeasurementField } from "@/types"

interface MeasureState {
  selectedMetric: MeasurementField
  chartRange: ChartRange
  measurements: Measurement[]
}

interface MeasureActions {
  setSelectedMetric: (metric: MeasurementField) => void
  setChartRange: (range: ChartRange) => void
  setMeasurements: (measurements: Measurement[]) => void
  clearAll: () => void
}

const initialState: MeasureState = {
  selectedMetric: "waist",
  chartRange: "all_time",
  measurements: [],
}

export const useMeasureStore = create<MeasureState & MeasureActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setSelectedMetric: (metric) => set({ selectedMetric: metric }),
      setChartRange: (range) => set({ chartRange: range }),
      setMeasurements: (measurements) => set({ measurements }),
      clearAll: () => set(initialState),
    }),
    { name: "measure-store" }
  )
)
