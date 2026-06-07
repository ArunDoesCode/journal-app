---
name: client-data-state
description: "Use when fetching data from Supabase, writing a mutation, designing a Zustand store, calling an async function from a client component, handling useTransition, or managing cross-component state. Triggers: fetch, mutation, supabase, zustand, store, state management, async, useTransition, router.refresh, data function, client data, read data, write data, delete, update record. DO NOT USE for UI styling, folder structure, or form layout."
argument-hint: "Describe the data operation or state shape you need to implement."
---

# Client Data & State

Zustand conventions live in **[nextjs-standards.md](../../../nextjs-standards.md)** — State Management section. This skill adds the **project-level overrides** which are significant for this PWA.

## Owns
- Supabase browser client usage and pattern
- `lib/api/[feature]/[feature].ts` function design
- Zustand store structure and naming
- `useTransition` / `startTransition` wrapping in client components
- `router.refresh()` after mutations
- Cross-component state decisions (store vs local)

## Never Touches
- Visual output of data → hand off to `ui-form-standards`
- Where files are placed → hand off to `structure-guard`
- PWA / offline behavior → hand off to `pwa-runtime-ux`

## ⚠️ Project Overrides (Critical — Replaces Standards Doc Defaults)

| Standard default | **This project** |
|---|---|
| `"use server"` server actions | **None.** All data functions run in client context. |
| Axios (`axiosInstance`) | **Not used.** Use Supabase browser client SDK directly. |
| nuqs for URL/filter state | **Not used.** Use Zustand or local `useState`. |
| `cookies()` for auth token | **Not used.** Supabase handles auth via `@supabase/ssr`. |
| `router.refresh()` to re-fetch server data | Still valid for triggering page-level re-renders after mutations. |

## Data Function Pattern (replaces server action pattern)
Functions in `lib/api/[feature]/[feature].ts` are plain async functions — no directive:

```ts
// lib/api/measurements/measurements.ts
import { createBrowserClient } from "@/lib/supabase/client";
import type { ApiResponse, Measurement } from "@/types";

export async function getMeasurements(): Promise<ApiResponse<Measurement[]>> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.from("measurements").select("*");
  if (error) return { success: false, message: error.message, errorCode: error.code };
  return { success: true, data: data ?? [] };
}
```

Return shape is always `{ success: true, data }` or `{ success: false, message, errorCode }` — same as standards doc.

## Calling Data Functions from Client Components
Same pattern as standards doc — `useTransition`, toast, disable during pending:

```ts
const [isPending, startTransition] = useTransition();

const handleSave = () => {
  startTransition(async () => {
    const result = await saveMeasurement(data);
    if (result.success) toast.success("Saved");
    else toast.error(result.message || "Something went wrong");
  });
};
```

## Zustand Store Rules (unchanged from standards doc)
- Wrap with `devtools` middleware
- Interface: state + actions together
- `setX: (value) => set({ x: value })` pattern
- Always include `clearAll` action
- File: `lib/store/[feature]Store.ts`, hook: `use[Feature]Store`

## State Placement Decision
| State type | Where |
|---|---|
| Transient form field value | Local `useState` in the component |
| Async loading / error for one fetch | Local `useState` in the view |
| Selected item shared across siblings | Zustand store |
| Persisted filter / sort preference | Zustand store (or `localStorage` if survives refresh) |
| URL-driven filter (would have been nuqs) | Zustand store + optional `useEffect` to sync |

## Handoff
- Store designed, data function written → `ui-form-standards` for how to wire it into a form.
- File placement needed → `structure-guard`.
