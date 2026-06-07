"use client"

import { useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getProfile, upsertProfile } from "@/lib/api/profile/profile"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

const schema = z.object({
  height_cm: z.string().optional(),
  weight_kg: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function ProfileView() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    getProfile().then((res) => {
      if (res.success) {
        reset({
          height_cm: res.data.height_cm?.toString() ?? "",
          weight_kg: res.data.weight_kg?.toString() ?? "",
        })
      }
    })
  }, [reset])

  const onSubmit = (values: FormValues) => {
    const h = values.height_cm ? Number(values.height_cm) : null
    const w = values.weight_kg ? Number(values.weight_kg) : null
    startTransition(async () => {
      const res = await upsertProfile({ height_cm: h, weight_kg: w })
      if (res.success) toast.success("Profile updated")
      else toast.error(res.message || "Failed to update")
    })
  }

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-center text-xl font-semibold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Body Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">
                Height (cm)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="170"
                {...register("height_cm")}
              />
              {errors.height_cm && (
                <p className="text-xs text-destructive">
                  {errors.height_cm.message}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">
                Current Weight (kg)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="70"
                {...register("weight_kg")}
              />
              {errors.weight_kg && (
                <p className="text-xs text-destructive">
                  {errors.weight_kg.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Update"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark mode</span>
            <Switch
              checked={resolvedTheme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isPending}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
