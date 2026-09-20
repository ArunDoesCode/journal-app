---
name: pwa-runtime-ux
description: "Use when setting up the PWA manifest, service worker, offline detection, bottom navigation shell, app installability, mobile-first interaction constraints, or the liquid glass nav effect. Triggers: PWA, manifest, offline, service worker, install prompt, bottom nav, app shell, mobile shell, next-pwa, icons, apple touch icon, network listener. DO NOT USE for feature business logic, form conventions, or data fetching."
argument-hint: "Describe the PWA or mobile UX requirement you are addressing."
---
# PWA & Runtime UX

Specific UX rules (nav design, offline behavior, audio, chart) are defined in **[plan.md](../../../docs/archive/plan-original.md)**. This skill provides a reusable implementation checklist.

## Owns

- `app/manifest.json` shape and required fields
- Serwist service worker: `app/sw.ts`, `serwist.config.js`, the `postbuild` script
- App shell caching strategy (app shell only — no data caching)
- Offline detection and toast trigger
- Bottom navigation component design rules
- PWA icon requirements

## Never Touches

- Feature business logic (measurement steps, journal audio) → implement in the relevant feature slice
- Form validation → hand off to `ui-form-standards`
- Data fetching pattern → hand off to `client-data-state`

## PWA Setup Checklist

> **Do NOT install `next-pwa`.** It is a webpack plugin and Next 16 builds with
> Turbopack, so it silently produces no service worker at all. It was removed from
> this project for exactly that reason. The `@serwist/next` *plugin* fails the same
> way — it was tried and rejected. Use the CLI flow below.

- [ ] Service worker source in `app/sw.ts` (Serwist + `defaultCache`)
- [ ] `serwist.config.js` maps `swSrc: app/sw.ts` → `swDest: public/sw.js`
- [ ] `"postbuild": "serwist build --config serwist.config.js"` in package.json —
      the worker is generated at build time, never hand-written
- [ ] Registration via `components/sw-register.tsx`, **production only** (`public/sw.js`
      persists on disk and `next dev` serves `public/` statically, so an ungated
      registration makes dev serve stale production assets)
- [ ] `public/sw.js` gitignored, prettier-ignored, and in eslint `globalIgnores`
- [ ] `app/manifest.json` present with: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, `icons`
- [ ] Icons at their real declared sizes — `icon-192.png` (192), `icon-512.png` (512),
      `icon-512-maskable.png` (512, ~20% safe-zone padding), `apple-touch-icon.png` (180).
      Sizes in the manifest must match the actual pixel dimensions or Chrome rejects
      them for installability. Master artwork: `docs/assets/icon-master.png`.
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
