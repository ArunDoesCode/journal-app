---
name: ui-form-standards
description: "Use when writing a form, adding validation, using shadcn components, wiring toast notifications, handling loading or disabled states, styling with Tailwind, using cn(), or composing shadcn Form/Input/Button/Select/Sheet. Triggers: form, validation, zod schema, react hook form, toast, loading state, disabled button, shadcn, input styling, label, modal, sheet, dialog, skeleton, error message. DO NOT USE for folder placement, data fetching, or store design."
argument-hint: "Describe the form or UI component you are building."
---

# UI & Form Standards

Full conventions live in **[nextjs-standards.md](../../../nextjs-standards.md)** — Forms, Toast, Theming, and Code Style sections. This skill is a decision guide and override layer only.

## Owns
- shadcn form wiring (RHF + Zod + `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`)
- Zod schema placement and type inference
- Toast usage (`toast.success`, `toast.error` from sonner)
- Loading / disabled state patterns (`isPending`, `useTransition`)
- Tailwind styling conventions and `cn()` usage
- shadcn component composition

## Never Touches
- Where the form file lives → hand off to `structure-guard`
- What data function the form calls → hand off to `client-data-state`
- PWA or offline behavior → hand off to `pwa-runtime-ux`

## No Project Overrides
Form, toast, and styling conventions are **unchanged** from nextjs-standards.md for this project. Apply them as written.

## Key Checklist (apply to every form)
- [ ] Zod schema defined **above** the component, type with `z.infer<typeof schema>`
- [ ] `useForm` with `zodResolver` and typed `defaultValues`
- [ ] Submit wrapped in `useTransition` → `startTransition`
- [ ] Submit button `disabled={isPending}` with `"Saving..."` label while pending
- [ ] Required fields marked with `<span className="text-red-500">*</span>`
- [ ] Error wrapper `<div className="h-2"><FormMessage /></div>` on every field
- [ ] Input base class: `shadow-md border border-gray-200 w-full`
- [ ] Form grid: `grid grid-cols-1 md:grid-cols-2 gap-2`
- [ ] Action buttons: `flex flex-col sm:flex-row gap-2 justify-end`
- [ ] `toast.success()` on success, `toast.error(response.message || "...")` on failure

## Toast Rules
- Sonner only — `import { toast } from "sonner"`. No custom toast components.
- Provider already in `lib/providers.tsx`: `<Toaster theme="dark" richColors duration={2000} />`
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
