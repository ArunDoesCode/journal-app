"use client"

import { useEffect, useState, useSyncExternalStore, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getProfile, upsertProfile } from "@/lib/api/profile/profile"
import type { ProfileFormValues } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import Image from "next/image"

const schema = z.object({
  height_cm: z.string(),
  weight_check_weeks: z.enum(["1", "2"]),
})

export function ProfileView() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState("User")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  )

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { height_cm: "", weight_check_weeks: "1" },
  })

  useEffect(() => {
    startTransition(async () => {
      const res = await getProfile()
      if (!res.success) {
        toast.error(res.message || "Failed to load profile")
        return
      }
      setFullName(res.data.full_name ?? "User")
      setAvatarUrl(res.data.avatar_url ?? null)
      reset({
        height_cm: res.data.height_cm?.toString() ?? "",
        weight_check_weeks: String(res.data.weight_check_weeks) as "1" | "2",
      })
    })
  }, [reset, startTransition])

  const onSubmit = (values: ProfileFormValues) => {
    const h = values.height_cm ? Number(values.height_cm) : null
    startTransition(async () => {
      const res = await upsertProfile({
        height_cm: h,
        weight_check_weeks: Number(values.weight_check_weeks) as 1 | 2,
      })
      if (res.success) {
        reset(values)
        toast.success("Profile updated")
      } else {
        toast.error(res.message || "Failed to update")
      }
    })
  }

  const handleLogout = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) {
        toast.error(error.message || "Failed to sign out")
        return
      }
      toast.success("Signed out")
      router.push("/login")
    })
  }

  const weightCheckWeeks = useWatch({
    control,
    name: "weight_check_weeks",
  })
  const isTwoWeekInterval = weightCheckWeeks === "2"

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-center text-xl font-semibold">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={fullName}
              className="h-12 w-12 rounded-full object-cover"
              height={48}
              width={48}
            />
          ) : (
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold">
              {fullName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Signed in as</span>
            <span className="font-medium">{fullName}</span>
          </div>
        </CardContent>
      </Card>

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
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">Weight logging interval</span>
                <span className="text-xs text-muted-foreground">
                  {isTwoWeekInterval ? "Every 2 weeks" : "Every week"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">1w</span>
                <Switch
                  checked={isTwoWeekInterval}
                  onCheckedChange={(checked) =>
                    setValue("weight_check_weeks", checked ? "2" : "1", {
                      shouldDirty: true,
                    })
                  }
                />
                <span className="text-xs text-muted-foreground">2w</span>
              </div>
            </div>
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending ? "Saving…" : "Update"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Dark mode</span>
            {mounted ? (
              <Switch
                checked={resolvedTheme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            ) : (
              <div className="h-5 w-11 rounded-full bg-input/90" />
            )}
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
