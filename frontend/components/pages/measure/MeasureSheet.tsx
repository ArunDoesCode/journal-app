"use client"

import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMeasureStore } from "@/lib/store/measureStore"
import { getMeasurements, insertMeasurement } from "@/lib/api/measurements/measurements"
import { buildMeasurementPrSummary, getPrPartsForDate } from "@/lib/utils/measurement-pr"
import {
  MEASUREMENT_FIELDS,
  type MeasurementField,
  type MeasurementValues,
} from "@/types"

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

const emptyStepValues = (): Record<MeasurementField, string> =>
  Object.fromEntries(MEASUREMENT_FIELDS.map((field) => [field, ""])) as Record<
    MeasurementField,
    string
  >

interface MeasureSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MeasureSheet({ open, onOpenChange }: MeasureSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [stepValues, setStepValues] = useState<Record<MeasurementField, string>>(
    emptyStepValues()
  )
  const [currentStep, setCurrentStep] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setMeasurements } = useMeasureStore()

  const currentField = MEASUREMENT_FIELDS[currentStep]
  const currentValue = stepValues[currentField]
  const isLastStep = currentStep === MEASUREMENT_FIELDS.length - 1
  const isValidNumber =
    currentValue !== "" && !isNaN(Number(currentValue)) && Number(currentValue) > 0
  const progress = ((currentStep + 1) / MEASUREMENT_FIELDS.length) * 100

  const resetLocalState = () => {
    setCurrentStep(0)
    setStepValues(emptyStepValues())
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const today = new Date().toISOString().split("T")[0]
      const values = MEASUREMENT_FIELDS.reduce<MeasurementValues>((acc, field) => {
        acc[field] = stepValues[field] !== "" ? Number(stepValues[field]) : null
        return acc
      }, {} as MeasurementValues)

      const res = await insertMeasurement({ date: today, ...values })
      if (!res.success) {
        toast.error(res.message || "Failed to save")
        return
      }

      resetLocalState()
      onOpenChange(false)

      const updated = await getMeasurements()
      if (!updated.success) {
        toast.error(updated.message || "Failed to refresh data")
        return
      }

      setMeasurements(updated.data)
      const summary = buildMeasurementPrSummary(updated.data)
      const todayPrParts = getPrPartsForDate(summary, today)

      if (todayPrParts.length === 0) {
        toast.success("Measurements saved")
        return
      }

      const labels = todayPrParts.map((field) => LABELS[field])
      if (labels.length === 1) {
        toast.success(`🏆 New personal record in ${labels[0]}`)
        return
      }

      toast.success(`🏆 Personal best day! New records in ${labels.join(", ")}`)
    })
  }

  const handleNext = () => {
    if (!isValidNumber) return
    if (isLastStep) {
      handleSubmit()
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, MEASUREMENT_FIELDS.length - 1))
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      const dialog = document.querySelector('[role="alertdialog"]')
      if (!dialog) {
        const trigger = document.getElementById("discard-trigger")
        trigger?.click()
      }
      return
    }

    onOpenChange(true)
  }

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="bottom"
        className="h-auto max-h-[85svh] rounded-t-2xl p-4"
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <div className="flex flex-col gap-6 pb-4">
          <SheetHeader className="gap-2">
            <div className="flex items-center justify-between">
              <SheetTitle>
                Step {currentStep + 1} of {MEASUREMENT_FIELDS.length}: {LABELS[currentField]}
              </SheetTitle>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button id="discard-trigger" style={{ display: "none" }} />
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard measurements?</AlertDialogTitle>
                    <AlertDialogDescription>
                      All entered values will be lost.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep going</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        resetLocalState()
                        onOpenChange(false)
                      }}
                    >
                      Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <Progress value={progress} className="h-1.5" />
          </SheetHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                placeholder="0.0"
                value={currentValue}
                onChange={(event) =>
                  setStepValues((prev) => ({ ...prev, [currentField]: event.target.value }))
                }
                onKeyDown={(event) => event.key === "Enter" && handleNext()}
                className="h-16 text-center text-3xl font-light"
                autoFocus
              />
              <span className="w-8 text-lg font-medium text-muted-foreground">cm</span>
            </div>
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
                disabled={isPending}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button onClick={handleNext} disabled={!isValidNumber || isPending} className="flex-1">
              {isPending ? "Saving…" : isLastStep ? "Submit" : "Next"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
