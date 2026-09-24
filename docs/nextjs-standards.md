# Next.js Standards — Base Layer

## 1. Scope

This document is the **base convention layer** for the journal-app PWA. It describes what the codebase actually does today, derived by reading the source — not aspirational best practice. Five skills sit on top of this file and win on any conflict, because they encode project-specific overrides that were deliberately chosen for this app:

- [`.claude/skills/structure-guard/SKILL.md`](../.claude/skills/structure-guard/SKILL.md) — file placement, naming, import order, page→View pattern
- [`.claude/skills/client-data-state/SKILL.md`](../.claude/skills/client-data-state/SKILL.md) — data functions, Supabase, Zustand, `useTransition`
- [`.claude/skills/ui-form-standards/SKILL.md`](../.claude/skills/ui-form-standards/SKILL.md) — forms, shadcn, toasts, styling
- [`.claude/skills/pwa-runtime-ux/SKILL.md`](../.claude/skills/pwa-runtime-ux/SKILL.md) — manifest, service worker, offline, bottom nav
- [`.claude/skills/karpathy-guidelines/SKILL.md`](../.claude/skills/karpathy-guidelines/SKILL.md) — general coding behavior, not folder/stack specific

Read the relevant skill first for a specific task; read this file for everything the skill doesn't restate. If a skill and this document disagree, the skill is correct for this project and this document is stale — flag it.

## 2. Inherited Standards That Do NOT Apply Here

A foreign standards doc (`DiecastOS — Next.js Frontend Standards`, from an unrelated Hono/Supabase ERP project) was found at the repo root and was almost certainly the missing base layer the four skills above were written to sit on top of. It was merged into this file section by section — only where it was actually true of this codebase. The following prescriptions from that doc do **not** apply, several are actively banned, and a future agent should not reintroduce them just because they turn up in a stray reference doc:

| Inherited prescription                                                 | Verified against this repo                                                        | This project does instead                                                                              |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| TanStack Query for server state                                        | Not in `package.json`                                                             | Views fetch directly via `lib/api/*` in a `useEffect` + `useTransition` (§6, §8)                       |
| `apiFetch` / axios + `lib/api/routes.ts` constants                     | No axios, no Hono backend                                                         | Supabase browser client (`lib/supabase/client.ts`) called directly from `lib/api/**` functions         |
| nuqs URL state                                                         | Not in `package.json`                                                             | Zustand store or local `useState` (§7)                                                                 |
| TanStack React Table / `components/common/DataTable.tsx`               | Not in `package.json`; no `components/common/`                                    | `recharts` for charts; no data-table UI exists                                                         |
| Backend-driven realtime (EventSource/stream + query invalidation)      | No backend, no streams                                                            | Not used; state updates go straight into Zustand/`useState` after a fetch resolves                     |
| "Single data path — backend first" (Hono API for every read/write)     | No Hono, no separate backend at all                                               | The Supabase client **is** the backend boundary; RLS does the enforcement a backend would otherwise do |
| Worker Screen Rules (glove-friendly numpad UI, Hindi labels, QR login) | DiecastOS factory-floor domain concept                                            | N/A — irrelevant to a personal fitness/journal PWA                                                     |
| SSR + `initialData` Page → View pattern                                | `page.tsx` here renders a client View with no props, no server fetch              | See §6 — the View fetches client-side after mount, there is no `initialData` hydration                 |
| shadcn `Form`/`FormField`/`FormMessage` composition                    | `components/ui/form.tsx` does not exist                                           | Plain `register()` + manually rendered error `<p>` (§9)                                                |
| `packages/validators/` shared Zod schemas                              | No monorepo, no shared packages                                                   | Zod schema declared inline above the component (§9)                                                    |
| Monorepo path alias `@/` → `apps/web/src/`, `@diecastos/*` packages    | Single-app repo, `@/*` → repo root (`tsconfig.json`)                              | N/A                                                                                                    |
| `NEXT_PUBLIC_API_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `.env.example`     | Neither var referenced anywhere; no `.env.example` file exists, only `.env.local` | Two vars only — see §17                                                                                |
| Biome linting                                                          | ESLint flat config in use (`eslint.config.mjs`)                                   | `eslint .` (§12)                                                                                       |

## 3. Folder Structure

```
app/
  (public)/            route group, no auth required (layout.tsx wraps children only)
    login/page.tsx
  (protected)/         route group, auth-gated in layout.tsx via Supabase getUser()
    layout.tsx          checks session, redirects to /login, renders <Providers><main>{children}</main><BottomNav /></Providers>
    journal/page.tsx
    journal/loading.tsx
    measure/page.tsx
    measure/loading.tsx
    profile/page.tsx
    profile/loading.tsx
  auth/callback/route.ts   Supabase OAuth callback route handler
  layout.tsx            root layout: fonts, <html>/<head> PWA meta tags, ThemeProvider
  page.tsx               root redirect/landing
  globals.css
  manifest.json

components/
  ui/          shadcn primitives only, added via the shadcn CLI, never hand-rolled. e.g. button.tsx, card.tsx, input.tsx, select.tsx, sheet.tsx, switch.tsx, textarea.tsx, alert-dialog.tsx, progress.tsx, skeleton.tsx, spinner.tsx, sonner.tsx
  views/       one stateful container per page/feature, does its own data fetching. views/measure/MeasureView.tsx, views/journal/JournalView.tsx, views/profile/ProfileView.tsx, views/auth/LoginView.tsx
  pages/       focused, feature-scoped UI pieces used by exactly one View. pages/measure/{MeasureSheet,WeightSheet,MeasurementChart,WeightChart,MetricSelector,ChartRangeSelector}.tsx, pages/journal/{JournalComposer,JournalHistory}.tsx
  navbar.tsx           bottom nav shell (not under ui/views/pages — a top-level app-shell component)
  theme-provider.tsx   next-themes wrapper (also top-level, app-shell scope)

lib/
  api/         one folder per feature, one file named after the feature: api/journal/journal.ts, api/measurements/measurements.ts, api/profile/profile.ts. Plain async functions, no "use server".
  store/       Zustand stores: store/journalDraftStore.ts, store/measureStore.ts
  supabase/    client.ts (browser client factory), server.ts (server client factory, used in layout.tsx and proxy.ts)
  utils.ts     cn() helper (clsx + tailwind-merge)
  utils/       feature-specific pure helpers: utils/measurement-pr.ts (PR calculation). utils/index.ts currently duplicates the same cn() as lib/utils.ts — see Inconsistencies (§14).
  providers.tsx  client component: Toaster + Analytics + global offline listener

types/
  index.ts     the barrel — the ONLY import path components/lib should use for types
  base.ts      ApiResponse<T>
  journal.ts, measurements.ts, profile.ts   one file per feature
```

**Reserved for future use, do not assume they exist:**

- `components/common/` — referenced by `structure-guard` as the destination for anything reusable across two or more features. It does not exist yet; every current component is either a shadcn primitive, a single-page View, or a single-page page-piece.
- `lib/hooks/` — referenced by `structure-guard` for custom hooks (`use[Name].ts`). No hooks folder exists yet; the one bespoke hook in the codebase (`useRecordingTimer`) is defined inline inside `components/pages/journal/JournalComposer.tsx` rather than extracted. If you extract a second reusable hook, create `lib/hooks/` at that point — don't create it preemptively.

## 4. Naming

| Thing                                | Convention                                        | Example                                                                                     |
| ------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Component file                       | `PascalCase.tsx`                                  | `MeasureView.tsx`, `JournalComposer.tsx`                                                    |
| Hook file (once `lib/hooks/` exists) | `use<Name>.ts`                                    | `useOffline.ts`                                                                             |
| Store file                           | `<feature>Store.ts`                               | `measureStore.ts`, `journalDraftStore.ts`                                                   |
| Store hook export                    | `use<Feature>Store`                               | `useMeasureStore`, `useJournalDraftStore`                                                   |
| API function file                    | `<feature>/<feature>.ts`                          | `lib/api/journal/journal.ts`                                                                |
| Type file                            | `<feature>.ts`, re-exported from `types/index.ts` | `types/measurements.ts`                                                                     |
| Route folder                         | `kebab-case/`                                     | `journal/`, `measure/` (single-word here, but the rule is kebab-case for multi-word routes) |

## 5. Import Order

```
React / Next  →  third-party  →  @/components  →  @/lib  →  @/types  →  relative
```

From `components/views/profile/ProfileView.tsx`:

```ts
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
```

Note this file itself is not perfectly sorted (`@/components` block appears after `@/lib`, and `next/image` is last) — treat the _rule_ (React/Next → third-party → `@/components` → `@/lib` → `@/types` → relative) as canonical, not this specific file's ordering.

Rules that are consistently followed:

- Components are always imported directly from their file — there is no barrel export in `components/`.
- Types are always imported from `@/types` (the barrel), never from `types/measurements.ts` directly. See `components/pages/measure/MeasureSheet.tsx`: `import { MEASUREMENT_FIELDS, type MeasurementField, type MeasurementValues } from "@/types"`.

## 6. Page → View Pattern

`page.tsx` is a thin shell: it renders the View and nothing else. It does not fetch data itself. The View is a client component (`"use client"`) that fetches its own data in a `useEffect` + `useTransition`.

`app/(protected)/measure/page.tsx` in full:

```tsx
import { MeasureView } from "@/components/views/measure/MeasureView"

export default function MeasurePage() {
  return <MeasureView />
}
```

`components/views/measure/MeasureView.tsx` (trimmed) does the fetch:

```tsx
export function MeasureView() {
  const [isPending, startTransition] = useTransition()
  const { measurements, selectedMetric, chartRange, setChartRange, setMeasurements } = useMeasureStore()

  useEffect(() => {
    startTransition(async () => {
      const [measurementResult, profileResult] = await Promise.all([
        getMeasurements(),
        getProfile(),
      ])
      if (measurementResult.success) setMeasurements(measurementResult.data)
      else toast.error(measurementResult.message || "Failed to load measurements")
      ...
    })
  }, [setMeasurements, startTransition, setWeightCheckWeeks])
  ...
}
```

`journal/page.tsx` and `profile/page.tsx` follow the identical shell pattern. The auth gate lives one level up in `app/(protected)/layout.tsx`, which redirects to `/login` server-side before any View mounts — pages never re-check auth.

## 7. State Management

Decision table (from `client-data-state` skill, restated as the base default):

| State type                                                   | Where                                                            |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Transient form field value                                   | Local `useState` in the component                                |
| Async loading / error for one fetch                          | Local `useState` (or `useTransition`'s `isPending`) in the View  |
| Selected item / filter shared across siblings of one feature | Zustand store                                                    |
| Persisted filter or sort preference                          | Zustand store, `persist` middleware if it must survive a refresh |
| Draft input that must survive navigation/reload              | Zustand store with `persist` middleware                          |

Zustand conventions, canonical form (`lib/store/measureStore.ts`):

```ts
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
```

- Wrap with `devtools` middleware, name the store (`{ name: "measure-store" }`).
- State interface and actions interface are declared separately, then intersected on `create<...>()`.
- Every setter follows `setX: (value) => set({ x: value })`.
- A `clearAll` action resets to `initialState`.

**Inconsistency:** `lib/store/journalDraftStore.ts` does **not** follow this shape — it uses `persist` instead of `devtools`, combines state+actions in one interface, and calls its reset action `clearDraft` rather than `clearAll`:

```ts
export const useJournalDraftStore = create<JournalDraftState>()(
  persist(
    (set) => ({
      text: "",
      audioUrl: null,
      setText: (text) => set({ text }),
      setAudioUrl: (audioUrl) => set({ audioUrl }),
      clearDraft: () => set({ text: "", audioUrl: null }),
    }),
    { name: "journal-draft" }
  )
)
```

Treat `measureStore.ts` (devtools, split interfaces, `clearAll`) as the canonical pattern for new stores. Reach for `persist` instead of `devtools` only when the store must survive a page reload (as the journal draft intentionally does) — but still name the reset action `clearAll` for consistency, even though the existing store doesn't.

## 8. Data Functions

Files live at `lib/api/<feature>/<feature>.ts`. Every function is a plain `async function` — no `"use server"` directive, because all data access runs client-side through the Supabase browser client (`lib/supabase/client.ts`'s `createClient()`).

Contract: `ApiResponse<T>` (`types/base.ts`):

```ts
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string; errorCode?: string }
```

Both branches, from `lib/api/journal/journal.ts`:

```ts
export async function getJournalEntries(): Promise<
  ApiResponse<JournalEntry[]>
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .order("date", { ascending: false })

  if (error)
    return { success: false, message: error.message, errorCode: error.code }
  return { success: true, data: data ?? [] }
}
```

Auth-guarded mutations check for a user first and short-circuit with `success: false` if missing (`lib/api/profile/profile.ts`):

```ts
export async function upsertProfile(values: ProfileUpdateInput): Promise<ApiResponse<Profile>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: "Not authenticated" }
  ...
}
```

One function in `journal.ts`, `uploadAudio`, breaks the contract and throws instead of returning `ApiResponse` — it's called from inside a `try/catch` at the call site (`JournalComposer.tsx`) rather than an `if (!res.success)` check. This is a deliberate exception for a non-DB (storage upload) operation, not a pattern to copy for CRUD functions.

Errors map to toasts at the call site, never inside the data function itself:

```ts
const res = await insertMeasurement({ date: today, ...values })
if (!res.success) {
  toast.error(res.message || "Failed to save")
  return
}
```

## 9. Forms

**Note on shadcn `Form` primitives:** `components/ui/` does **not** currently contain a `form.tsx` or `label.tsx` (no `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` components exist in this repo). The `ui-form-standards` skill's checklist describes that composition as the target pattern, but no form in the codebase today uses it — see Inconsistencies (§14). Until those primitives are added, follow the pattern actually in use below, minus the `Form`/`FormMessage` wrapper components, using a plain `<label>` and a manually-rendered error `<p>`.

Canonical example, `components/views/profile/ProfileView.tsx`:

Zod schema above the component, RHF + zodResolver, typed `defaultValues`:

```tsx
const schema = z.object({
  height_cm: z.string(),
  weight_check_weeks: z.enum(["1", "2"]),
})

export function ProfileView() {
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
  ...
```

Submit wrapped in `useTransition`, `disabled={isPending}`:

```tsx
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
...
<Button type="submit" disabled={isPending || !isDirty}>
  {isPending ? "Saving…" : "Update"}
</Button>
```

Field-level error rendering (no `FormMessage`, plain conditional `<p>`):

```tsx
;<Input type="number" step="0.1" placeholder="170" {...register("height_cm")} />
{
  errors.height_cm && (
    <p className="text-xs text-destructive">{errors.height_cm.message}</p>
  )
}
```

This form has no required-field asterisk marker and no grid layout — it's a single-column `flex flex-col gap-4`. If a future form needs a 2-column layout or required markers, follow the `ui-form-standards` checklist (`grid grid-cols-1 md:grid-cols-2 gap-2`, `<span className="text-red-500">*</span>`) since nothing in the codebase currently contradicts those specific conventions — they're simply unexercised, not violated.

**Multi-step, non-RHF forms are also canonical here**, for wizard-style input: `components/pages/measure/MeasureSheet.tsx` collects 8 measurement fields one at a time via plain `useState` (`stepValues`, `currentStep`) with no Zod/RHF at all, validating each step inline (`isValidNumber`) before advancing. Use RHF+Zod for a single-screen form with several related fields (Profile); use plain `useState` step state for a linear wizard (Measure, Weight) where each screen is one field.

## 10. Toasts

Sonner only. Two Toaster usages exist in the codebase and they disagree — see Inconsistencies (§14). The one actually wired up and rendered is in `lib/providers.tsx`:

```tsx
import { Toaster, toast } from "sonner"
...
<Toaster richColors position="top-right" />
```

`components/ui/sonner.tsx` defines a themed wrapper around `sonner`'s `Toaster` (reads `next-themes`, custom icons, CSS var overrides) but it is not imported or rendered anywhere in the app — treat it as dead/unused code, not the active configuration, until it's wired in.

Usage pattern, everywhere:

```ts
if (res.success) toast.success("Profile updated")
else toast.error(res.message || "Failed to update")
```

- `import { toast } from "sonner"` — no custom toast component.
- Always pass a fallback string for error messages: `res.message || "Failed to ..."`.
- Messages are short, sentence case, no trailing punctuation (`"Signed out"`, `"Measurements saved"`, `"Audio saved"`).
- The global offline listener also lives in `lib/providers.tsx` and calls `toast.error(...)` directly on the `window` `"offline"` event — this is the one listener; don't duplicate it in feature components.

## 11. Theming

`next-themes`, class strategy, wired in `components/theme-provider.tsx`:

```tsx
<NextThemesProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
  {...props}
>
```

`app/globals.css` defines semantic color tokens (`--background`, `--foreground`, `--primary`, `--card`, `--muted`, `--border`, etc.) as CSS variables under `:root`, remapped for `.dark` (Tailwind v4 `@theme inline` + `@custom-variant dark (&:is(.dark *))`). Components consume the semantic Tailwind classes (`bg-background`, `text-muted-foreground`, `border`) rather than raw colors — see `ProfileView.tsx`'s `bg-muted`, `text-destructive`, `border`.

`theme-provider.tsx` also owns a `d` keyboard shortcut (`ThemeHotkey`) that toggles dark/light unless the target is a form field — this is app-shell behavior, not something to duplicate per-feature.

`ProfileView.tsx` reads/writes theme directly via `useTheme()` from `next-themes` for its in-app dark-mode switch, guarding first render with `useSyncExternalStore` to avoid a hydration mismatch:

```tsx
const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false)
...
{mounted ? (
  <Switch checked={resolvedTheme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
) : (
  <div className="h-5 w-11 rounded-full bg-input/90" />
)}
```

## 12. Code Style

- TypeScript `strict: true` (`tsconfig.json`), `moduleResolution: "bundler"`, path alias `@/*` → repo root.
- Prettier (`.prettierrc`) — read the literal settings, don't assume defaults:
  ```json
  {
    "endOfLine": "lf",
    "semi": false,
    "singleQuote": false,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 80,
    "plugins": ["prettier-plugin-tailwindcss"],
    "tailwindStylesheet": "app/globals.css",
    "tailwindFunctions": ["cn", "cva"]
  }
  ```
  Notably: **no semicolons** (`semi: false`) and **double quotes** (`singleQuote: false`) — this is the opposite of a common Prettier default assumption. Every file read for this document (`journal.ts`, `measureStore.ts`, `ProfileView.tsx`, etc.) confirms this — no trailing semicolons, double-quoted strings. Tailwind class ordering is auto-sorted by `prettier-plugin-tailwindcss`.
- ESLint flat config (`eslint.config.mjs`) extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`, ignores `.next/`, `out/`, `build/`, `next-env.d.ts`. No custom rules beyond that.
- `cn()` (`lib/utils.ts`, thin wrapper over `clsx` + `tailwind-merge`) for every conditional/merged className. Used pervasively, e.g. `app/layout.tsx`: `className={cn("antialiased", outfit.variable)}`.
- Icons: `lucide-react` only (`Mic`, `Square` in `JournalComposer.tsx`; `CircleCheckIcon` etc. in `sonner.tsx`).
- Default export vs named export is inconsistent across the codebase — see Inconsistencies (§14).
- No `any` anywhere in `app/`, `components/`, `lib/`, or `types/` — confirmed by grep, not just aspiration. Keep it that way.
- `interface` for object shapes (`Measurement`, `Profile`, `JournalEntry`), `type` for unions/aliases/derived types (`ChartRange`, `MeasurementField`, `Record<...>`) — see `types/measurements.ts`. This split is genuinely followed, not just stated.
- Props types: most components declare `interface <ComponentName>Props` (`ChartRangeSelectorProps`, `WeightSheetProps`); a few use a bare `interface Props` instead (`JournalComposer.tsx`, `JournalHistory.tsx`, `MeasurementChart.tsx`). Prefer the `<ComponentName>Props` form for new components.
- `as const` on fixed tuples that back a derived union type, e.g. `MEASUREMENT_FIELDS = [...] as const` → `type MeasurementField = (typeof MEASUREMENT_FIELDS)[number]` (`types/measurements.ts`).

## 13. Quality Gates

`package.json`:

```json
"scripts": {
  "lint": "eslint .",
  "format": "prettier --write \"**/*.{ts,tsx}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx}\"",
  "typecheck": "tsc --noEmit",
  "verify": "npm run format:check && npm run typecheck && npm run lint"
}
```

Run `npm run verify` before considering any change done. All three (`format:check`, `typecheck`, `lint`) must pass. There is no test suite (no `test` script, no test files anywhere in `app/`, `components/`, or `lib/`) — correctness is enforced by type-checking, linting, and manual/agent review only, not by automated tests.

## 14. Inconsistencies Found (documented, not silently resolved)

1. **Two Zustand store shapes.** `measureStore.ts` uses `devtools`, split `State`/`Actions` interfaces, and a `clearAll` action (matches every skill's stated convention). `journalDraftStore.ts` uses `persist`, a single combined interface, and a `clearDraft` action instead of `clearAll`. Treat `measureStore.ts` as canonical for new stores; `persist` is the right middleware choice only when the store must survive a reload.
2. **Two Toaster configurations, only one active.** `lib/providers.tsx` renders sonner's raw `<Toaster richColors position="top-right" />`, which is what the app actually ships. `components/ui/sonner.tsx` defines a separate, more elaborate themed `Toaster` wrapper (dark/light via `next-themes`, custom icons, CSS-var styling) that is never imported anywhere — it's dead code. The `ui-form-standards` skill's description of the Toaster config (`theme="dark" richColors duration={2000}`) matches neither file exactly; treat `lib/providers.tsx`'s actual JSX as ground truth.
3. **shadcn `Form` primitives don't exist yet.** `ui-form-standards`'s checklist references `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` — none of these are in `components/ui/`. The one RHF+Zod form in the codebase (`ProfileView.tsx`) uses plain `register()` + a manually rendered error paragraph, no `Form` wrapper, no grid layout, no required-field asterisk. Follow the existing plain pattern until/unless shadcn's `form.tsx` is actually added.
4. **Duplicate `cn()` definition.** `lib/utils.ts` and `lib/utils/index.ts` contain byte-identical `cn()` implementations. Nothing in the codebase currently imports from `lib/utils/index.ts` for `cn` (all call sites use `@/lib/utils`) — this appears to be leftover duplication from a refactor, not two sanctioned patterns.
5. **`uploadAudio` breaks the `ApiResponse<T>` contract.** It returns a bare `string` and `throw`s on failure instead of returning `ApiResponse<string>`, and its one call site (`JournalComposer.tsx`) wraps it in `try/catch` rather than checking `.success`. This is an intentional, isolated exception for a Storage upload, not a second sanctioned data-function shape — new `lib/api/**` functions should still return `ApiResponse<T>`.
6. **Client naming: `createClient` vs `createBrowserClient`.** `client-data-state`'s skill doc refers to `createBrowserClient` from `@/lib/supabase/client`; the actual exported function in `lib/supabase/client.ts` (and every call site: `journal.ts`, `profile.ts`, `measurements.ts`, `ProfileView.tsx`, `JournalComposer.tsx`) is named `createClient`. Use `createClient` — it's what exists.
7. **Import order is a stated rule, not a strictly enforced one.** `ProfileView.tsx` itself (used as the canonical form example in §5 and §9) has `@/components/*` imports interleaved after `@/lib/*` imports and a stray `next/image` import at the very end. Treat the ordering rule as the target, not a guarantee every existing file satisfies it.
8. **Default vs named export is mixed, not a settled convention.** `WeightSheet.tsx`, `WeightChart.tsx`, and `ChartRangeSelector.tsx` use `export default function`; every View and most other `pages/` components (`JournalComposer.tsx`, `MeasureSheet.tsx`, `MeasurementChart.tsx`, `MetricSelector.tsx`, `navbar.tsx`, etc.) use a named `export function`. There is no dominant pattern to codify — named export is more common, so prefer it for new components, but don't "fix" the existing default exports as part of an unrelated change.
9. **Zustand stores hold fetched server data, not just UI state.** `measureStore.ts`'s `measurements: Measurement[]` is data fetched from Supabase, cached in the store — this project does not follow a "Zustand is UI-state-only" rule some other codebases use, because there is no separate server-state cache (no TanStack Query) to keep it out of. Treat Zustand here as the single client-side cache for both UI state and fetched data.

## 15. Next.js 16 Specifics

This project is on Next.js **16.2.6**. Conventions that differ from older Next.js knowledge:

- **`middleware.ts` → `proxy.ts`.** The file at the repo root is `proxy.ts`, exporting a named `proxy` function (not `middleware`), plus the usual `export const config = { matcher: [...] }`. See `proxy.ts` — it runs the Supabase session refresh and the protected/login redirect logic that used to live in `middleware.ts`.
- **Turbopack is the default bundler.** `next.config.ts` sets `turbopack: {}` and no webpack-specific config is present. **Webpack-based Next plugins silently do nothing** — they are never invoked, the build still succeeds, and the feature is simply absent. This is not theoretical: it is exactly how `next-pwa` produced no service worker for this project.
- **Async dynamic APIs.** `cookies()`/`headers()` must be awaited. `lib/supabase/server.ts`'s client factory and `app/(protected)/layout.tsx` both `await createClient()` where the server Supabase client wraps `cookies()`. Any new Server Component or Route Handler reading `params`/`searchParams` must treat them as `Promise`s and `await` them.
- **`next lint` is removed.** The `lint` script runs `eslint .` directly (`package.json`), not `next lint`.
- **PWA: no bundler plugin.** `next.config.ts` wraps nothing. The service worker is built by the Serwist **CLI** in a `postbuild` script (`app/sw.ts` → `public/sw.js`) and registered manually from `components/sw-register.tsx` in production only. Both `next-pwa` and `@serwist/next`'s plugin were tried and produced no worker under Turbopack. See the `pwa-runtime-ux` skill.

## 16. Rendering Strategy

There is no ISR, no PPR, and no route in this app fetches data server-side to hydrate a client component with `initialData` — every route is one of two shapes:

| Route                                             | Rendering                                                                                                    | Notes                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `(public)/login`                                  | Server component shell → client `LoginView`                                                                  | Auth redirect happens in `proxy.ts`, not in the page                                            |
| `(protected)/*` (`journal`, `measure`, `profile`) | Server layout does the auth check (`getUser()`, redirect to `/login`) → thin server `page.tsx` → client View | View fetches its own data client-side after mount (§6); `loading.tsx` covers the gap until then |

Do not introduce `initialData`/SSR-fetch-then-hydrate for a route unless you also change the View to accept it as a prop — the current Views take no props and always fetch on mount.

## 17. Environment Variables

Two variables, both client-exposed (Supabase RLS is the actual security boundary, not keeping this server-only):

| Variable                               | Scope  | Purpose                                                                                                                       |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Client | Supabase project URL                                                                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client | Supabase publishable key (RLS-enforced) — note this project uses the newer `PUBLISHABLE_KEY` naming, not the older `ANON_KEY` |

Used in `lib/supabase/client.ts`, `lib/supabase/server.ts`, `proxy.ts`, and `app/layout.tsx`. There is no `NEXT_PUBLIC_API_URL` (no separate backend) and no `SUPABASE_SERVICE_ROLE_KEY` anywhere in the codebase. Values live in `.env.local` only — there is no `.env.example` checked in; if one is added, keep it in sync with these two vars.
