---
name: structure-guard
description: "Use when deciding where to place a file, naming a component or hook, organizing imports, setting up a new route, understanding the page-to-view pattern, typing a barrel export, or checking folder conventions. Triggers: where to put, which folder, file placement, move file, route layout, naming convention, import order, types barrel, page structure, folder structure. DO NOT USE for form logic, state management, or data fetching."
argument-hint: "Describe the file you need to place or the naming decision you need to make."
---

# Structure Guard

Full folder rules live in **[nextjs-standards.md](../../../nextjs-standards.md)** — this skill only states project overrides and acts as a decision guide. Do not duplicate the standards doc here.

## Owns
- File placement decisions (which folder, which subfolder)
- Route group layout (`(public)` / `(protected)`)
- Page → View pattern enforcement
- Component, hook, store, and type naming
- Import order and path alias usage
- Barrel export shape for `types/`

## Never Touches
- Form or validation logic → hand off to `ui-form-standards`
- Data fetching, store implementation → hand off to `client-data-state`
- PWA shell, manifest, offline behavior → hand off to `pwa-runtime-ux`

## Project Overrides for This PWA
These override the defaults in nextjs-standards.md:

| Standard default | This project |
|---|---|
| `lib/searchParams.ts` (nuqs cache) | **Not needed — delete or skip** |
| `lib/api/axios.ts` (server-only Axios) | **Not needed — use Supabase client** |
| `lib/api/[feature]/[feature].ts` with `"use server"` | Client-facing Supabase calls in `lib/api/[feature]/[feature].ts` — **no `"use server"` directive** |
| `page.tsx` fetches server-side, passes to View | `page.tsx` is a thin shell that renders the View directly; **View does its own data fetch** |

## Placement Decision Procedure
1. Is it a shadcn primitive? → `components/ui/` only, added via CLI.
2. Is it reusable across two or more features? → `components/common/`.
3. Is it a stateful container for exactly one page? → `components/views/[feature]/`.
4. Is it a focused UI piece (form, search bar) for exactly one page? → `components/pages/[feature]/`.
5. Is it a custom hook? → `lib/hooks/use[Name].ts`.
6. Is it a Zustand store? → `lib/store/[feature]Store.ts`.
7. Is it a Supabase data function? → `lib/api/[feature]/[feature].ts` (no `"use server"`).
8. Is it a type? → `types/[feature].ts`, re-exported from `types/index.ts`.

## Naming Quick Reference
| Thing | Convention |
|---|---|
| Component file | `PascalCase.tsx` |
| Hook file | `use[Name].ts` |
| Store file | `[feature]Store.ts` |
| API function file | `[feature].ts` |
| Type file | `[feature].ts` |
| Route folder | `kebab-case/` |

## Import Order
```
React / Next  →  third-party  →  @/components  →  @/lib  →  @/types  →  relative
```
- Always import components directly from their file (no barrel export in `components/`).
- Always import types from `@/types` (barrel export).

## Handoff
- Structural decision made → explain placement, then hand off to the appropriate skill for implementation.
