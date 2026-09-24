Here is the complete, finalized **Master AI-Ready Base Plan**. It incorporates every strategic decision we’ve made: minimalist UI, strict unit handling (CM only), the exact page flows, raw audio storage, and the industry-standard secure HttpOnly Cookie authentication.

You can copy the markdown block below and paste it directly into Cursor, Claude, v0, or your preferred AI coding assistant.

---

```markdown
# PROJECT: Body Metrics & Journal PWA
**Role:** Expert Next.js 15 + Supabase + Shadcn UI developer.
**Goal:** Build a minimalist, high-performance Progressive Web App (PWA) for daily body measurement and journaling. Strict focus on clean UX, mobile-first interactions, and secure authentication.

## 1. Tech Stack & Constraints
- **Framework:** Next.js 16(latest version) (App Router), TypeScript, React 19.
- **Backend/DB:** Supabase (Postgres, Storage, Auth).
- **UI:** Shadcn UI (Select, Sheet, Progress, Toast/Sonner, Switch, Button, Card, Input, Slider).
- **Styling:** Tailwind CSS. **STRICT RULE:** Use only base utilities for layout/spacing. Rely on CSS variables in `globals.css` for theming. No arbitrary values. Minimal animations via Framer Motion (only for sheet transitions).
- **Icons:** Lucide React.
- **Charts:** Recharts.
- **Offline:** NO offline sync or caching. Implement a global network listener that triggers a red Sonner toast: "App is offline. Please connect to the internet." when `navigator.onLine` is false.

## 2. Auth & Data Architecture (CRITICAL)
- **Mechanism:** Use Supabase Auth with **HttpOnly Cookies** via the official `@supabase/ssr` package. 
- **NO LocalStorage Tokens:** Do not manually manage JWTs in `localStorage`. Rely on Supabase's secure cookie handling.
- **Middleware:** Implement `middleware.ts` at the root using `createServerClient` from `@supabase/ssr` to automatically refresh expired sessions and protect routes.
- **Server vs. Client Boundary:**
  - **React Server Components (RSC):** Use for secure, initial data fetching (e.g., fetching the user's profile, chart data, and journal history on the server before rendering).
  - **Client Components (`'use client'`):** Use ONLY for interactive elements (e.g., the Measurement Step Form, Audio Recording, Dropdowns, Theme Toggling).
  - Create a `createClient()` utility for Server Components and a `createBrowserClient()` utility for Client Components, exactly as documented in the Supabase Next.js SSR guide.

## 3. Database Schema (Supabase Postgres)
*Note: All measurements are stored strictly in CM and KG. No unit conversions.*
- `profiles`: `id` (uuid, FK auth.users), `height_cm` (numeric), `weight_kg` (numeric), `created_at`.
- `measurements`: `id`, `user_id`, `date` (date, unique per user/day), `neck`, `chest`, `waist`, `hips`, `biceps`, `forearm`, `thighs`, `calves` (all numeric).
- `journal_entries`: `id`, `user_id`, `date` (date, unique per user/day), `text_content` (text, nullable), `audio_url` (text, nullable), `created_at`.

## 4. Core UX & Page Architecture

### A. Measure Page (Home - Scale Icon)
- **Layout:** 
  1. Top: Shadcn `<Select>` dropdown to choose a body part metric (Neck, Chest, Waist, Hips, Biceps, Forearm, Thighs, Calves).
  2. Middle: Single Recharts `LineChart` showing the trend for the selected dropdown metric. Use a Skeleton loader while fetching.
  3. Bottom: Prominent floating "Measure" button.
- **Step Form (Opens on "Measure" click):**
  - Shadcn `Sheet` slides up from bottom.
  - Top: `Progress` bar (0-100%).
  - Linear wizard: 8 steps. Each step has a large numeric `<Input>` + "cm" label. "Next" button disabled until valid numeric input.
  - Close button triggers a discard confirmation. State resets completely on close.
  - On final submit: Trigger chart skeleton -> Server Action/POST to Supabase -> refresh data -> close sheet.

### B. Journal Page (Book Icon)
- **Constraint:** Max 1 entry per day. Server checks DB for `CURRENT_DATE`. If exists, render a Read-Only view. If not, render Input Form.
- **Input Form:**
  - Auto-expanding `<Textarea>`.
  - Record button: Uses browser `MediaRecorder` API. Shows recording timer + stop button. On stop, uploads raw `.webm` blob to Supabase Storage (`/journal/{user_id}/{date}.webm`), saves URL to state.
  - Submit button enabled if text OR audio exists.
- **History View:**
  - Reverse-chronological list below the input/read-only card.
  - Each card: Date, 2-line text preview, audio icon if present.
  - Tap to expand full text + minimal HTML5 `<audio>` player.

### C. Profile Page (Profile Icon)
- Clean list layout using Shadcn `Card`.
- **Body Stats Section:** 
  - Input for "Height (cm)".
  - Input for "Current Weight (kg)".
  - "Update" button below to save these to the `profiles` table.
- **Settings:**
  - Theme Toggle: Dark/Light mode (using `next-themes` and Shadcn `Switch`).
  - Logout: Calls Supabase `signOut()` and redirects to login.

## 5. Technical Implementation Rules
1. **Liquid Glass Nav:** Create a floating bottom navigation bar (Scale, Book, Profile). Use `backdrop-blur-xl`, `bg-background/80`, a subtle top border, and soft shadow in `globals.css` to create the "liquid glass" effect.
2. **Audio Upload:** Handle blob -> Supabase Storage -> return public URL -> save to DB. Show a loading state on the button during upload.
3. **Chart Data:** Fetch measurements ordered by date. Map to `{ date, value }` for the selected metric. Recharts `ResponsiveContainer` + `LineChart`.
4. **Validation:** Step form blocks progression on empty/invalid input. Journal submit blocks if both text and audio are empty.
5. **PWA Setup:** Use `next-pwa` configured strictly for app shell caching only. Provide a basic `public/manifest.json`.

## 6. Execution Order for AI
1. Scaffold Next.js 15 + Supabase SSR client utilities + Middleware + Auth callback route.
2. Setup `globals.css` with minimal Shadcn variables, liquid glass nav styles, and theme tokens.
3. Build Layout with Liquid Glass Bottom Nav.
4. Implement Profile page (Height/Weight inputs, Theme toggle, Logout).
5. Build Measure page: Server Component for data fetching -> Client Component for Dropdown + Chart + "Measure" button.
6. Build Measurement Step Form Sheet (Client Component: progress bar, validation, discard logic, submit flow).
7. Build Journal page (Server check for 1/day constraint -> Client Component for text+audio input, Storage upload, history timeline).
8. Add global offline listener -> Sonner toast.
```

---

### Final PM/Dev Advice for Execution:

1. **Feed it in chunks:** Don't ask the AI to generate the entire app in one prompt. Start by saying: *"Execute Steps 1, 2, and 3 from the master plan."* Once the layout and auth are working, say: *"Now execute Step 5 (Measure Page)."*
2. **Supabase RLS:** Remind the AI (or do it yourself in the Supabase dashboard) to enable **Row Level Security (RLS)** on all tables, ensuring users can only `SELECT` and `INSERT` rows where `auth.uid() = user_id`.
3. **Icons:** Download 3 simple icons for your `public` folder (`icon-192.png`, `icon-512.png`, `apple-touch-icon.png`) so the PWA installs cleanly on your phone.

You have a rock-solid, highly pragmatic, and secure architecture ready to go. Good luck building!
