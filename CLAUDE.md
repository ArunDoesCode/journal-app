# Body Metrics — project memory

Next.js 16.2.6 / React 19.2.4 PWA for daily body measurements and journaling.
Supabase (Postgres + Storage + Auth), deployed on Vercel. Solo developer.

> This file is a **router**, not a manual. Details live in skills and
> `docs/nextjs-standards.md`, both loaded on demand. Keep this file under ~90 lines.

## Next.js 16 — not the Next.js in your training data

`AGENTS.md` (auto-generated, do not hand-edit) says it and it is worth repeating:
read `node_modules/next/dist/docs/` before writing framework code.

- `middleware.ts` → **`proxy.ts`** at the repo root, named export `proxy`.
- Turbopack is the default builder. Webpack plugins silently do nothing.
- `cookies()`, `headers()`, `params`, `searchParams` are **async** — await them.
- `next lint` is removed. `revalidateTag` takes a second `cacheLife` argument.

## Architecture in five lines

1. **Client-first.** `page.tsx` is a thin shell; the View fetches its own data.
2. **No `"use server"` anywhere.** `lib/api/*` are plain async functions on the Supabase **browser** client.
3. All data functions return `ApiResponse<T>` — `{success:true,data}` | `{success:false,message,errorCode}`.
4. Mutations wrap in `useTransition`; `isPending` disables submit; a sonner toast on every outcome.
5. Types live in `types/<domain>.ts` and are imported from `@/types` only.

## Banned

`"use server"` · axios · nuqs · **framer-motion** (installed but unused — never import) ·
raw hex/oklch in components · barrel exports anywhere except `types/`

## Quality gates

`npm run verify` = `format:check && typecheck && lint`. All three must pass. No test suite.
**Run it via `verify-agent`, never inline** — see the delegation policy below.

## Delegation policy

You (main thread, Opus) **coordinate. You do not implement.**

- Every code edit goes to `build-agent` or `ui-designer`. Even one-line fixes.
- Every broad search goes to `code-scout` before you Read anything yourself.
- Every gate run goes to `verify-agent`. Never run typecheck/lint inline — seeing raw
  compiler output makes you start fixing things you should be delegating.
- **Do not Read a file a subagent edited this turn** unless `verify-agent` or
  `review-agent` named it. If the work is wrong, re-dispatch a correction; don't fix it.
- Hand off by **path**, not paraphrase. Dispatch `docs/specs/007-x.md`, don't retell it.
- Budget: you may edit at most one file per turn, under 10 lines, in `docs/` or config only.

Workers end every response with: `FILES CHANGED` / `DECISIONS` / `NOT DONE` / `RISKS`.

## Agent routing

| Task | Agent | Model |
|---|---|---|
| Ideate, compare approaches, write a spec | `feature-ideation` | opus |
| Find code, inventory patterns | `code-scout` | haiku |
| Implement a feature, fix a bug | `build-agent` | sonnet |
| Style, layout, restyle, visual audit | `ui-designer` | sonnet |
| Audit a diff before committing | `review-agent` | sonnet |
| Run typecheck / lint / build | `verify-agent` | haiku |

Sequence for a new feature: ideation → scout → build → ui-designer → verify → review.
`build-agent` and `ui-designer` touch the same files — run them **sequentially, never in parallel**.

## Skill routing

| Domain | Skill |
|---|---|
| File placement, naming, imports, routes | `structure-guard` |
| Forms, validation, toasts, shadcn | `ui-form-standards` |
| Supabase, mutations, Zustand, async | `client-data-state` |
| Color, spacing, radius, type, layout | `design-system` |
| Manifest, offline, bottom nav, install | `pwa-runtime-ux` |
| Every coding task (behavioral) | `karpathy-guidelines` |

Agents load skills **explicitly** via the Skill tool. Do not rely on auto-invocation:
a subagent's prompt is narrow and often contains none of the skill's trigger words.

Base conventions the skills layer on top of: `docs/nextjs-standards.md`.

## Specs

`docs/specs/NNN-slug.md`. Check for an approved spec before building anything non-trivial.
`## Open questions` must be empty before a spec is `approved`; `## Build order` is the
dispatch interface for `build-agent`.
