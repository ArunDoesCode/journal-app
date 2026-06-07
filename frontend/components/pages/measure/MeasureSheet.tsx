"use client"

import { useRef, useTransition } from "react"
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
import { insertMeasurement } from "@/lib/api/measurements/measurements"
import { getMeasurements } from "@/lib/api/measurements/measurements"
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

export function MeasureSheet() {
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    sheetOpen,
    stepValues,
    currentStep,
    setStepValue,
    nextStep,
    prevStep,
    resetSheet,
    setMeasurements,
  } = useMeasureStore()

  const currentField = MEASUREMENT_FIELDS[currentStep]
  const currentValue = stepValues[currentField]
  const isLastStep = currentStep === MEASUREMENT_FIELDS.length - 1
  const isValidNumber = currentValue !== "" && !isNaN(Number(currentValue)) && Number(currentValue) > 0
  const progress = ((currentStep + 1) / MEASUREMENT_FIELDS.length) * 100

  const handleNext = () => {
    if (!isValidNumber) return
    if (isLastStep) {
      handleSubmit()
    } else {
      nextStep()
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const today = new Date().toISOString().split("T")[0]
      const values = Object.fromEntries(
        MEASUREMENT_FIELDS.map((f) => [f, stepValues[f] !== "" ? Number(stepValues[f]) : null]),
      )

      const res = await insertMeasurement({ date: today, ...values } as Parameters<typeof insertMeasurement>[0])
      if (res.success) {
        toast.success("Measurements saved")
        resetSheet()
        // Re-fetch so chart updates immediately without page reload
        const updated = await getMeasurements()
        if (updated.success) setMeasurements(updated.data)
      } else {
        toast.error(res.message || "Failed to save")
      }
    })
  }

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      // Show discard dialog when closing
      const dialog = document.querySelector('[role="alertdialog"]')
      if (!dialog) {
        // Only show if no dialog is already open
        const trigger = document.getElementById("discard-trigger")
        trigger?.click()
      }
    }
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85svh] rounded-t-2xl p-4" onPointerDownOutside={(e) => e.preventDefault()}>
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
                    <AlertDialogAction onClick={resetSheet}>Discard</AlertDialogAction>
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
                onChange={(e) => setStepValue(currentField, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
                className="text-3xl h-16 text-center font-light"
                autoFocus
              />
              <span className="text-muted-foreground text-lg font-medium w-8">cm</span>
            </div>
          </div>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={prevStep} disabled={isPending} className="flex-1">
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!isValidNumber || isPending}
              className="flex-1"
            >
              {isPending ? "Saving…" : isLastStep ? "Submit" : "Next"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
