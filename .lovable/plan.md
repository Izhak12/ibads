# Plan: OpenAI Image Generation + Dynamic No-Scroll Grid

## 1. Backend — Server Route (not Edge Function)

This project is TanStack Start (not classic Supabase stack), so the correct backend boundary is a **TanStack server route**, not a Supabase Edge Function. It serves the same purpose (secure server-side call, key never exposed to client).

- Add `OPENAI_API_KEY` secret via the secure form (I'll prompt you).
- Create `src/routes/api/generate-graphics.ts` — POST endpoint that:
  - Accepts `{ clientName, clientIndustry, brandColor, text, brief, amount }`.
  - Builds a prompt combining brief + client context + brand color guidance.
  - Calls OpenAI `https://api.openai.com/v1/images/generations` with `model: "dall-e-3"`, `size: "1024x1024"`, `n: 1` — **DALL-E 3 only supports n=1**, so I'll issue `amount` parallel requests via `Promise.all`.
  - Returns `{ images: string[] }` (array of URLs).
  - Returns clear error JSON on 401/429/402/etc.

Note: DALL-E 3 URLs expire after ~1 hour. For this MVP that's fine (session display only). If you want persistence later, we'd add storage.

## 2. Frontend — Wire the form

- `CreateForm` submits payload to `/api/generate-graphics` via `fetch`.
- On submit: set preview state to `generating`, show the glowing orb over the grid area.
- On success: set state to `success` with returned image URLs, pass `amount` and `images` to `SuccessGrid`.
- On error: toast in Hebrew ("שגיאה ביצירת הגרפיקות") and return to idle.

## 3. Dynamic No-Scroll Grid (`SuccessGrid` rewrite)

Container fills the left panel exactly (`h-full w-full`, no scroll). Grid template picked by `amount`:

| Amount | Layout      | Tailwind classes                          |
|--------|-------------|-------------------------------------------|
| 1      | 1 centered  | `grid-cols-1 grid-rows-1` (max-w square) |
| 2–4    | 2×2         | `grid-cols-2 grid-rows-2`                 |
| 5–9    | 3×3         | `grid-cols-3 grid-rows-3`                 |
| 10     | 4×3         | `grid-cols-4 grid-rows-3`                 |

Each cell:
- Wrapper uses `aspect-square` with `min-h-0 min-w-0` for grid sizing, `object-cover`, `rounded-2xl`, subtle shadow.
- Framer Motion staggered fade-in (`opacity 0→1`, `y: 8→0`, `delay: index * 0.06`).
- Empty cells in a 3×3 with 5–8 items render as subtle placeholder tiles or are hidden (I'll hide them so grid stays clean).

To guarantee no scroll: left panel is `h-screen`, grid uses `h-full` with `gap-3`, and cells auto-size via CSS grid — the aspect-square is applied through `min()` sizing so cells never exceed available height.

## 4. Loading state

Existing `GeneratingOrb` stays; `PreviewPanel` shows it in the grid area while `generating`. On success, orb fades out, grid fades in.

## Secrets

I'll prompt for `OPENAI_API_KEY` when we switch to build mode.

## Files touched

- NEW `src/routes/api/generate-graphics.ts`
- EDIT `src/components/CreateForm.tsx` (submit handler, pass results up)
- EDIT `src/routes/index.tsx` or `PreviewPanel` (hold images state)
- EDIT `src/components/SuccessGrid.tsx` (dynamic layout + real images + fade-in)
