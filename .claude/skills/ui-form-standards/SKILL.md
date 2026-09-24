---
name: ui-form-standards
description: "Use when writing a form, adding validation, using shadcn components, wiring toast notifications, handling loading or disabled states, styling with Tailwind, using cn(), or composing shadcn Form/Input/Button/Select/Sheet. Triggers: form, validation, zod schema, react hook form, toast, loading state, disabled button, shadcn, input styling, label, modal, sheet, dialog, skeleton, error message. DO NOT USE for folder placement, data fetching, or store design."
argument-hint: "Describe the form or UI component you are building."
---

# UI & Form Standards

Full conventions live in **[nextjs-standards.md](../../../docs/nextjs-standards.md)** — Forms, Toast, Theming, and Code Style sections. This skill is a decision guide and override layer only.

## Owns
- Form wiring: RHF + Zod via plain `register()` (see override below)
- Zod schema placement and type inference
- Toast usage (`toast.success`, `toast.error` from sonner)
- Loading / disabled state patterns (`isPending`, `useTransition`)
- Tailwind styling conventions and `cn()` usage
- shadcn component composition

## Never Touches
- Where the form file lives → hand off to `structure-guard`
- What data function the form calls → hand off to `client-data-state`
- PWA or offline behavior → hand off to `pwa-runtime-ux`

## Project Overrides — read these, they differ from the standards doc

**The shadcn `Form` primitives do not exist in this project.** `components/ui/` contains
no `form.tsx`, so `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl` and
`FormMessage` are unavailable. Do **not** import them and do not invent them. The one
RHF+Zod form in the repo (`components/views/profile/ProfileView.tsx`) uses plain
`register()` with a manual error paragraph. Follow that until someone adds `form.tsx`
deliberately.

**Styling uses semantic tokens, never palette classes.** The old `border-gray-200`
input class in this skill was wrong and is now blocked by `.claude/hooks/convention-guard.py`.
Inputs already carry their own styling from `components/ui/input.tsx` — do not re-skin them.

## Key Checklist (apply to every form)
- [ ] Zod schema defined **above** the component, type with `z.infer<typeof schema>`
- [ ] `useForm` with `zodResolver` and typed `defaultValues`
- [ ] Submit wrapped in `useTransition` → `startTransition`
- [ ] Submit button `disabled={isPending}` with `"Saving..."` label while pending
- [ ] Required fields marked with `<span className="text-destructive">*</span>`
- [ ] Error shown per field as `<p className="text-xs text-destructive">{errors.x?.message}</p>`
- [ ] Use `<Input />` / `<Textarea />` as-is; no extra border/shadow classes
- [ ] Action buttons: `flex gap-2`, each `flex-1` on mobile
- [ ] `toast.success()` on success, `toast.error(response.message || "...")` on failure

## Toast Rules
- Sonner only — `import { toast } from "sonner"`. No custom toast components.
- Provider is in `lib/providers.tsx`: `<Toaster richColors position="top-right" />`.
  Note `components/ui/sonner.tsx` exists but is **not imported anywhere** — it is dead
  code. Do not wire it up without asking; changing the live Toaster is a design decision.
- Messages: short, user-friendly, sentence case.

## Styling Rules
- Tailwind only. No CSS modules, no styled-components.
- Conditional classes: always via `cn()`.
- Semantic tokens first (`bg-background`, `text-foreground`, `text-muted-foreground`), direct Tailwind for one-offs.
- Icons: `lucide-react` only.
- Mobile-first breakpoints: `sm:`, `md:`, `lg:`.

## Handoff
- Form shell decided → `client-data-state` for the data function being called.
- File needs placing → `structure-guard`.
