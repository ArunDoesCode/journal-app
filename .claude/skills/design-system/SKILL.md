---
name: design-system
description: "Use when choosing a color, radius, spacing value, font size, or shadow; styling any component; building a new screen layout; or auditing existing UI for visual consistency. Governs semantic OKLch tokens, the radius scale, button variants and sizes, spacing rhythm, type scale, touch targets, and the liquid-glass-nav utility. Triggers: color, token, oklch, radius, rounded, spacing, gap, padding, font size, typography, layout, visual, restyle, polish, theme, dark mode, touch target, button variant, glass, shadow, ring, skeleton, chart colors. DO NOT USE for form validation logic, data fetching, or file placement."
---

# Body Metrics design system

Style `radix-luma`, baseColor `taupe`, iconLibrary `lucide`, cssVariables `true` (`components.json`). Tailwind v4, `@theme inline` in `app/globals.css`. For form composition see `ui-form-standards`; for file placement see `structure-guard`.

## 1. Token law

Use semantic tokens only: `bg-background`, `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`. Never raw hex/oklch inside a component.

**Sanctioned exceptions** (raw color, intentional): `bg-black/30` overlay scrim in `components/ui/alert-dialog.tsx` (`AlertDialogOverlay`) and `components/ui/sheet.tsx` (`SheetOverlay`). Do not re-flag these.

Real values (light `:root` / `.dark`):

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` | `oklch(0.147 0.004 49.3)` |
| `--foreground` | `oklch(0.147 0.004 49.3)` | `oklch(0.986 0.002 67.8)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.214 0.009 43.1)` |
| `--primary` | `oklch(0.511 0.096 186.391)` | `oklch(0.437 0.078 188.216)` |
| `--muted` | `oklch(0.96 0.002 17.2)` | `oklch(0.268 0.011 36.5)` |
| `--border` | `oklch(0.922 0.005 34.3)` | `oklch(1 0 0 / 10%)` |
| `--ring` | `oklch(0.714 0.014 41.2)` | `oklch(0.547 0.021 43.1)` |

## 2. Radius scale

Base `--radius: 0.45rem`, derived in `@theme inline`: `--radius-sm` ×0.6, `--radius-md` ×0.8, `--radius-lg` ×1, `--radius-xl` ×1.4, `--radius-2xl` ×1.8, `--radius-3xl` ×2.2, `--radius-4xl` ×2.6. Do not invent intermediate radii.

| Surface | Class |
|---|---|
| Buttons, Cards, alert-dialog content | `rounded-4xl` |
| Inputs, Selects (trigger/content), Sheet close button | `rounded-3xl` |
| Textarea, Skeleton, Select items | `rounded-2xl` |
| Nav pill, Switch, Progress | `rounded-full` |

Known drift: `MeasurementChart.tsx` / `WeightChart.tsx` / `JournalView.tsx` skeleton placeholders use `rounded-xl`, not the canonical `rounded-2xl` — flag in audits, fix to `rounded-2xl` rather than copying it forward.

## 3. Spacing rhythm

`gap-2` is the de-facto default (measured most frequent, 18 occurrences vs. 12 for `gap-1`, 6 for `gap-4`). `gap-6` marks the seam between major page sections (`flex flex-col gap-6 p-4` on view roots, e.g. `JournalView.tsx`). `p-4` is the page-container padding. `pb-24` on scrollable pages (`MeasureView.tsx`) clears the floating `liquid-glass-nav`. `Card` owns `--card-spacing` (`[--card-spacing:--spacing(6)]`, `4` for `size="sm"`) — never add `p-*`/`px-*`/`py-*` inside a `Card`, `CardHeader`, `CardContent`, or `CardFooter`.

## 4. Type scale — exactly three sizes

`text-sm` body copy, `text-xs` labels/meta (nav labels use `text-[10px]`, a documented one-off — not a fourth general size), `text-xl font-semibold` page titles (e.g. `<h1 className="text-center text-xl font-semibold">`). Weights: `font-medium` for button/card-title labels, `font-semibold` for page titles. Adding a fourth size is a design conversation, not a one-off.

## 5. Buttons

From `components/ui/button.tsx` `cva()`:

| Variant | Style |
|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/80` |
| `outline` | `border-border bg-background hover:bg-muted` |
| `secondary` | `bg-secondary text-secondary-foreground` |
| `ghost` | `hover:bg-muted hover:text-foreground` |
| `destructive` | `bg-destructive/10 text-destructive hover:bg-destructive/20` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| Size | Height |
|---|---|
| `xs` | `h-6` |
| `sm` | `h-8` |
| `default` | `h-9` |
| `lg` | `h-10` |
| `icon` / `icon-xs` / `icon-sm` / `icon-lg` | `size-9` / `size-6` / `size-8` / `size-10` |

All variants render `rounded-4xl`. Never pass a `className` that overrides variant color or radius; if no variant fits, that's a design conversation.

## 6. Touch targets

Minimum 48px on anything tappable. `navbar.tsx` links use `min-h-12 min-w-12` (48px). Mobile-first — no hover-only interactions (all interactive states pair `hover:` with a tappable base state). Primary actions use `Sheet` sliding up from the bottom (`data-[side=bottom]`), never centered dialogs; `AlertDialog` (centered, `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`) is reserved for confirmations only.

## 7. Charts

Recharts themed via CSS variables in `contentStyle` plus utility classes, identically in `MeasurementChart.tsx` and `WeightChart.tsx`:

```
<CartesianGrid strokeDasharray="3 3" className="stroke-border" />
<Tooltip contentStyle={{
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  color: "var(--card-foreground)",
  borderRadius: "0.5rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
}} />
<Line strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} className="stroke-primary" />
```

`--chart-1` through `--chart-5` form a teal ramp (identical in light and dark): `oklch(0.845 0.143 164.978)` → `oklch(0.696 0.17 162.48)` → `oklch(0.596 0.145 163.225)` → `oklch(0.508 0.118 165.612)` → `oklch(0.432 0.095 166.913)`. Both charts currently use only `stroke-primary` (single series); the `--chart-*` ramp is reserved for multi-series charts, not yet consumed.

## 8. Motion

No motion library is in use. `framer-motion` is listed in `package.json` (`"framer-motion": "^12.40.0"`) but has zero imports anywhere in the codebase — it's dead weight scheduled for removal. **Never import `framer-motion`.** Animation comes only from Radix data attributes (`data-open:animate-in`, `data-closed:animate-out`, `data-open:fade-in-0`, `data-open:zoom-in-95`), `tw-animate-css`, and plain Tailwind `transition-*`/`duration-*` utilities.

## 9. `liquid-glass-nav`

The one custom utility, defined in `app/globals.css`, navbar-only — not general purpose:

```css
.liquid-glass-nav {
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  background-color: oklch(from var(--card) l c h / 0.8);
  border: 1px solid oklch(from var(--border) l c h / 0.6);
  box-shadow:
    0 4px 24px oklch(0 0 0 / 0.12),
    0 1px 4px oklch(0 0 0 / 0.08);
}
```

Applied in `components/navbar.tsx` as `liquid-glass-nav fixed bottom-4 left-1/2 z-50 ... rounded-full p-2`, with scroll-driven hide/show toggling `translate-y-32 opacity-0 pointer-events-none` vs `translate-y-0 opacity-100` on scroll direction.

## 10. Dark mode

`next-themes` with `attribute="class"`; `.dark` class flips the token block in `app/globals.css`. There is a `d` keyboard hotkey to toggle theme. Rule: every new color must be defined in **both** `:root` and `.dark` — never add a token to only one.

## 11. Audit checklist

- Hardcoded palette classes (`bg-teal-500`, raw hex, raw `oklch()`) outside the two sanctioned scrim exceptions (§1)
- Invented radius values not on the `--radius-*` scale (§2) — includes stray `rounded-xl` (see known drift, §2)
- A fourth type size beyond `text-sm` / `text-xs` / `text-xl font-semibold` (§4)
- Any `framer-motion` import (§8)
- Tap targets under 48px / `min-h-12 min-w-12` (§6)
- A color token defined in only one of `:root` / `.dark` (§10)
- Padding (`p-*`, `px-*`, `py-*`) added directly inside a `Card`/`CardHeader`/`CardContent`/`CardFooter` instead of relying on `--card-spacing` (§3)
- A centered `AlertDialog`-style pattern used for a primary action instead of a bottom `Sheet` (§6)
