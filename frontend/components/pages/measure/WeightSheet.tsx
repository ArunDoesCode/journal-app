"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  getMeasurements,
  insertWeight,
} from "@/lib/api/measurements/measurements"
import { useMeasureStore } from "@/lib/store/measureStore"

interface WeightSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  canLogWeight: boolean
  nextWeightDate: string | null
}

export default function WeightSheet({
  open,
  onOpenChange,
  canLogWeight,
  nextWeightDate,
}: WeightSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [weightKg, setWeightKg] = useState("")
  const { setMeasurements } = useMeasureStore()
  const isValidWeight =
    weightKg !== "" && !isNaN(Number(weightKg)) && Number(weightKg) > 0

  const handleSubmit = () => {
    startTransition(async () => {
      if (!canLogWeight) {
        toast.error(
          nextWeightDate
            ? `Next weight entry available on ${nextWeightDate}`
            : "Weight logging not available yet"
        )
        return
      }

      const result = await insertWeight(Number(weightKg))
      if (!result.success) {
        toast.error(result.message || "Failed to save")
        return
      }

      toast.success("Weight saved")
      setWeightKg("")
      onOpenChange(false)

      const refreshed = await getMeasurements()
      if (!refreshed.success) {
        toast.error(refreshed.message || "Failed to refresh data")
        return
      }
      setMeasurements(refreshed.data)
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false)
      }}
    >
      <SheetContent side="bottom" className="h-auto rounded-t-2xl p-4">
        <div className="flex flex-col gap-4 pb-4">
          <SheetHeader>
            <SheetTitle>Log weight</SheetTitle>
          </SheetHeader>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              placeholder="70.0"
              value={weightKg}
              onChange={(event) => setWeightKg(event.target.value)}
            />
            <span className="text-sm font-medium text-muted-foreground">
              kg
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!isValidWeight || isPending || !canLogWeight}
          >
            {isPending ? "Saving…" : "Save weight"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
