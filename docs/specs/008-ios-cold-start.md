# 008 — iOS cold start

Status: approved

## Problem

An installed iOS PWA shows a 3-5s blank screen on cold launch. No HTML byte
can be sent until two sequential Supabase Auth network round-trips finish:

1. `proxy.ts` — `await supabase.auth.getUser()` hits
   `<project>/auth/v1/user` over the network on every matched request.
2. `app/(protected)/layout.tsx` — a second, redundant
   `await supabase.auth.getUser()` inside an `async` layout. Because the
   layout is `async` and awaits the network, React cannot stream the shell,
   so the nested `loading.tsx` files never get a chance to render.

A third redundant call lives in `lib/api/profile/profile.ts`:
`getProfile()` calls `getUser()` before querying `profiles`.

Verified fact: this Supabase project's JWKS endpoint returns an ES256
asymmetric key, so `supabase.auth.getClaims()` verifies the JWT **locally**
via WebCrypto against a cached JWKS, with no network call. Signature:
`node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts:2462`. It
returns `{ data, error }` where `data` is `{ claims, header, signature }` or
`null`; the user id is `data.claims.sub`.

On top of the auth latency, the installed PWA also has no working offline
app shell, does not feel native on iOS (viewport/safe-area/splash), and
ships a heavy, unbounded measure view.

## Phases

### Phase A — remove redundant network auth calls (this spec's scope, build-agent)

- `proxy.ts`: replace `getUser()` with `getClaims()`; key both route guards
  (protected redirect, login redirect) on presence of `claims` instead of
  `user`. Keep the cookie get/set plumbing that refreshes the session
  cookie exactly as is. Widen the matcher's negative lookahead to also
  exclude `sw.js`, `manifest.json`, `robots.txt`, and common image
  extensions, which currently each pay an auth round-trip.
- `app/(protected)/layout.tsx`: remove the redundant `getUser()` call and
  the `redirect("/login")`; make the component a plain synchronous server
  component. The proxy already guards every protected route and Supabase
  RLS protects the data, so this second check was pure duplicated latency.
  This is the change that lets React stream the shell immediately.
- `lib/api/profile/profile.ts`: `getProfile()` replaces its internal
  `getUser()` call with `getClaims()`, reading the id from
  `data.claims.sub`. `upsertProfile()` is unchanged.
- Add `app/(protected)/loading.tsx` as a shell-level fallback, and fix the
  `align-self-center` typo (not a real Tailwind class, a silent no-op) in
  `app/(protected)/measure/loading.tsx` and
  `app/(protected)/journal/loading.tsx` to match the working pattern in
  `app/(protected)/profile/loading.tsx`
  (`flex h-screen items-center justify-center`).

### Phase B — working offline app shell (concurrent, other agent)

Make the service worker actually install and precache the app shell so the
PWA has a working offline experience instead of an inert registration.
Touches `serwist.config.js`, `app/sw.ts`, `next.config.ts`.

### Phase C — iOS native feel (concurrent, other agent)

`viewport-fit=cover`, safe-area insets, and splash screens so the installed
PWA feels native on iOS instead of like a wrapped browser tab. Touches
`app/layout.tsx`, `globals.css`, `app/manifest.json`, `components/navbar.tsx`.

### Phase D — lighter first paint (concurrent, other agent)

Code-split `recharts` and bound the measurements query so the measure view
doesn't ship and fetch more than the first paint needs. Touches the measure
view and charts.

## Build order

1. Phase A (`proxy.ts`, `app/(protected)/layout.tsx`,
   `lib/api/profile/profile.ts`, loading states) — unblocks HTML streaming
   on every protected route; no dependency on B/C/D.
2. Phase B (service worker) — independent of A; can land in parallel.
3. Phase C (iOS shell/splash) — independent of A/B; can land in parallel.
4. Phase D (code-splitting/query bound) — independent of A/B/C; can land in
   parallel.
5. Verify all four together: cold-launch the installed PWA on an iOS
   device/simulator and confirm the shell paints before the auth round-trip
   resolves, and that navigating between `/measure`, `/journal`, and
   `/profile` shows the correct `loading.tsx` fallback.

## Open questions

(none)
