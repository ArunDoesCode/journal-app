import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { ChartRange, Measurement, MeasurementField } from "@/types"
import { MEASUREMENT_FIELDS } from "@/types"

type StepValues = Record<MeasurementField, string>

const emptyStepValues = (): StepValues =>
  Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f, ""])) as StepValues

interface MeasureState {
  selectedMetric: MeasurementField
  chartRange: ChartRange
  measurements: Measurement[]
  sheetOpen: boolean
  weightSheetOpen: boolean
  stepValues: StepValues
  currentStep: number
}

interface MeasureActions {
  setSelectedMetric: (metric: MeasurementField) => void
  setChartRange: (range: ChartRange) => void
  setMeasurements: (measurements: Measurement[]) => void
  openSheet: () => void
  closeSheet: () => void
  openWeightSheet: () => void
  closeWeightSheet: () => void
  setStepValue: (field: MeasurementField, value: string) => void
  nextStep: () => void
  prevStep: () => void
  resetSheet: () => void
  clearAll: () => void
}

const initialState: MeasureState = {
  selectedMetric: "waist",
  chartRange: "month",
  measurements: [],
  sheetOpen: false,
  weightSheetOpen: false,
  stepValues: emptyStepValues(),
  currentStep: 0,
}

export const useMeasureStore = create<MeasureState & MeasureActions>()(
  devtools(
    (set) => ({
      ...initialState,
      setSelectedMetric: (metric) => set({ selectedMetric: metric }),
      setChartRange: (range) => set({ chartRange: range }),
      setMeasurements: (measurements) => set({ measurements }),
      openSheet: () => set({ sheetOpen: true }),
      closeSheet: () => set({ sheetOpen: false }),
      openWeightSheet: () => set({ weightSheetOpen: true }),
      closeWeightSheet: () => set({ weightSheetOpen: false }),
      setStepValue: (field, value) =>
        set((s) => ({ stepValues: { ...s.stepValues, [field]: value } })),
      nextStep: () =>
        set((s) => ({
          currentStep: Math.min(
            s.currentStep + 1,
            MEASUREMENT_FIELDS.length - 1
          ),
        })),
      prevStep: () =>
        set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      resetSheet: () =>
        set({
          sheetOpen: false,
          weightSheetOpen: false,
          stepValues: emptyStepValues(),
          currentStep: 0,
        }),
      clearAll: () => set(initialState),
    }),
    { name: "measure-store" }
  )
)
