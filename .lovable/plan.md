# Plan: Client CRUD + AI Smart-Brief Onboarding

Note on backend: this is TanStack Start, so I'll use a **server route** (`src/routes/api/generate-brief.ts`) instead of a Supabase Edge Function. Same effect — key stays server-side. I'll prompt you for `GEMINI_API_KEY` when we switch to build mode.

## 1. Data model (ClientsContext)

Extend `Client` with the new questionnaire fields:
- `brandVibe: string` (tone of voice)
- `coreOffers: string` (products/services)
- `brief: string` (the AI-generated + user-edited creative brief)

Add `updateClient(id, patch)` and `deleteClient(id)` to the context; migrate seed data (empty strings for new fields).

## 2. Cards — hover + actions (`ClientsScreen.tsx`)

- On hover: existing lift stays, plus a small top-left action cluster fades in (`opacity-0 group-hover:opacity-100`, `transition-opacity`).
- Two subtle icon buttons: `Pencil` (edit) and `Trash2` (delete), each in a 32px rounded-xl white pill with `border-black/5`, soft shadow.
- Edit → opens `ClientDialog` in edit mode pre-filled with the client's data.
- Delete → opens an AlertDialog (shadcn) styled to match: white, rounded-3xl, RTL, primary destructive button in `#FF3B30`, secondary "ביטול".

Context additions: `editingClientId: string | null`, `openClientDialogFor(id | null)`. Dialog reads this to decide create vs edit.

## 3. Redesigned `ClientDialog` — questionnaire + Smart Brief

Widen modal to `max-w-2xl`, add internal scroll (`max-h-[85vh] overflow-y-auto`) since it now holds many fields. Sections, each using the existing `Field` component and input styles:

1. **פרטי עסק** — Business name, Industry
2. **קהל יעד** — Target audience (age, interests, pain points) — larger textarea
3. **זהות מותג** — Brand vibe / tone of voice (textarea) + brand colors swatches (existing)
4. **מוצרים / הצעות** — Core products/offers (textarea)
5. **אפיון יצירתי (Smart Brief)** — the AI section:
   - Prominent gradient button: "✨ צור אפיון חכם" — gradient `from-[#1E67FF] to-[#0B192C]`, white text, subtle glow shadow. Disabled until name+industry present.
   - Below it a large editable `<textarea>` (min 8 rows) for the brief; empty until generated, then populated and remains editable.

### Loading state (Apple-Intelligence style)

While Gemini is running, render an overlay inside the brief section:
- Soft blurred backdrop over the brief textarea only (not the whole modal).
- Animated conic-gradient border ring around the textarea (rotating hue: blue → purple → pink → blue) using Framer Motion `animate` on `background` rotation + CSS `mask` for border-only.
- Centered subtle label: "כותב אפיון חכם…" with three pulsing dots.
- Button swaps to a spinner with "יוצר…" and disables.

## 4. Server route: `src/routes/api/generate-brief.ts`

POST endpoint that:
- Reads `process.env.GEMINI_API_KEY` (returns 500 if missing).
- Validates payload with Zod: `{ name, industry, targetAudience, brandVibe, coreOffers, brandColors[] }`.
- Calls Gemini via REST: `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=…` with the payload.
- System-style prompt (Hebrew): instructs Gemini to act as a senior marketing strategist and produce a **comprehensive, DALL·E-ready creative brief** — covering brand essence, visual direction (mood, palette, composition, lighting, typography), audience insight, tone, do's/don'ts, and 3–4 recommended visual motifs. Returns plain Hebrew markdown-ish text (no JSON — the brief is human-editable).
- Returns `{ brief: string }`; on error returns `{ error }` with mapped 401/429/500.

## 5. Save flow

- Create mode: `addClient({ name, industry, targetAudience, brandVibe, coreOffers, brandColors, brief })`.
- Edit mode: `updateClient(editingClientId, patch)`.
- "שמור לקוח" disabled until name is non-empty. Reset local state and close on save.
- Downstream: `CreateScreen`'s call to `/api/generate-graphics` should also pass `brief` and `brandVibe` in the payload so DALL·E benefits from the smart brief. Small edit to `generate-graphics.ts` prompt builder to include them.

## Files touched

- NEW `src/routes/api/generate-brief.ts`
- EDIT `src/context/ClientsContext.tsx` — extended type, `updateClient`, `deleteClient`, `editingClientId`, `openClientDialogFor`
- EDIT `src/components/ClientsScreen.tsx` — hover action buttons, delete AlertDialog, edit trigger
- EDIT `src/components/ClientDialog.tsx` — big rewrite: questionnaire sections, Smart Brief button, Apple-Intelligence loading, edit-mode prefill, save via add/update
- EDIT `src/components/CreateScreen.tsx` + `src/routes/api/generate-graphics.ts` — forward `brief` and `brandVibe` into image prompt

## Secrets

I'll prompt for `GEMINI_API_KEY` in build mode.
