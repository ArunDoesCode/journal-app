---
name: pwa-runtime-ux
description: "Use when setting up the PWA manifest, service worker, offline detection, bottom navigation shell, app installability, mobile-first interaction constraints, or the liquid glass nav effect. Triggers: PWA, manifest, offline, service worker, install prompt, bottom nav, app shell, mobile shell, next-pwa, icons, apple touch icon, network listener. DO NOT USE for feature business logic, form conventions, or data fetching."
argument-hint: "Describe the PWA or mobile UX requirement you are addressing."
---
# PWA & Runtime UX

Specific UX rules (nav design, offline behavior, audio, chart) are defined in **[plan.md](../../../plan.md)**. This skill provides a reusable implementation checklist.

## Owns

- `public/manifest.json` shape and required fields
- `next-pwa` configuration in `next.config.ts`
- App shell caching strategy (app shell only — no data caching)
- Offline detection and toast trigger
- Bottom navigation component design rules
- PWA icon requirements

## Never Touches

- Feature business logic (measurement steps, journal audio) → implement in the relevant feature slice
- Form validation → hand off to `ui-form-standards`
- Data fetching pattern → hand off to `client-data-state`

## PWA Setup Checklist

- [ ] `next-pwa` installed and configured for **app shell caching only**
- [ ] `public/manifest.json` present with: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, `icons`
- [ ] Icons present: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` in `public/`
- [ ] `<link rel="manifest">` and `<meta name="theme-color">` in root `layout.tsx`
- [ ] `<meta name="apple-mobile-web-app-capable" content="yes">` in root `layout.tsx``

## Offline Detection Rule

A **single global listener** lives in `lib/providers.tsx` (or a dedicated `useOffline` hook in `lib/hooks/`):

```ts
useEffect(() => {
  const handleOffline = () => toast.error("App is offline. Please connect to the internet.");
  window.addEventListener("offline", handleOffline);
  return () => window.removeEventListener("offline", handleOffline);
}, []);
```

- Trigger: `window` `offline` event only.
- Toast: `toast.error(...)` from sonner — no custom component.
- One listener only — never duplicate in feature components.

## Bottom Navigation Rules (from plan.md)

- Floating fixed bar at bottom, 3 icons: Scale (Measure), Book (Journal), User (Profile).
- Classes: `backdrop-blur-xl`, `bg-background/80`, subtle top border, soft shadow.
- Active icon uses `text-foreground`; inactive uses `text-muted-foreground`.
- Touch target minimum: `48px` height.
- Component lives at `components/navbar.tsx`.

## Mobile-First Constraints

- All tap targets ≥ 44px.
- No hover-only interactions.
- Sheets slide up from bottom (not dialogs from center) for primary actions.
- Framer Motion allowed **only** for sheet enter/exit transitions — no decorative animations elsewhere.

## Handoff

- Shell and manifest done → feature slices can begin (use `client-data-state` + `ui-form-standards`).
