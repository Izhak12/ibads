
## Plan: Client Management + AI Smart Brief

Note: Cloud is already enabled, so Gemini is available via the Lovable AI Gateway using the auto-provisioned `LOVABLE_API_KEY` — no need to prompt for `GEMINI_API_KEY`. This is a TanStack Start app, so the backend uses a server route (not a Supabase Edge Function).

### 1. Extend Client model & context
`src/context/ClientsContext.tsx`
- Add fields: `targetAudience`, `brandVibe`, `coreOffers`, `brief`.
- Add `updateClient(id, patch)` and `deleteClient(id)`.
- Add `openClientDialogFor(client)` to open in edit mode with prefilled data.

### 2. Client cards — hover actions + delete confirm
`src/components/ClientsScreen.tsx`
- Add subtle hover lift (shadow + translate) on each card.
- Top-left corner (RTL): two ghost icon buttons (Pencil, Trash2) that fade in on hover, in soft rounded backdrop.
- Edit → `openClientDialogFor(client)`.
- Delete → shadcn `AlertDialog` with minimal Apple-styled copy ("האם למחוק את הלקוח?"), destructive confirm.

### 3. AI Smart-Brief server route
`src/routes/api/generate-brief.ts`
- POST endpoint, Zod-validated body (all questionnaire fields).
- Calls Lovable AI Gateway `google/gemini-2.5-pro` with a Hebrew system prompt: "senior marketing strategist… produce a comprehensive, DALL-E/GPT-ready creative brief covering visual direction, tone, color mood, typography feel, composition ideas, do's/don'ts."
- Returns `{ brief: string }`. Handles 402/429 with clear errors.

### 4. Redesigned Client Dialog (questionnaire + AI)
`src/components/ClientDialog.tsx` — full redesign
- Wider modal (`max-w-2xl`), spacious padding, RTL.
- Fields: Business Name, Industry/Niche, Target Audience (textarea: age/interests/pain points), Brand Vibe / Tone (textarea), Core Products/Offers (textarea), Brand Colors (existing swatch picker).
- Distinct gradient "✨ צור אפיון חכם" button (navy → vibrant blue, subtle glow).
- On click: POST to `/api/generate-brief`, show `BriefLoadingOverlay` — Apple-Intelligence style: animated conic-gradient border sweeping around modal content, soft pulsing "מנתח את המותג…" text, shimmer.
- Result renders in a large editable `Textarea` (min-h ~ 240px) labeled "האפיון החכם — ניתן לערוך".
- Primary button becomes "שמור לקוח" — saves via `addClient` or `updateClient`.
- Works in both create and edit modes (prefill on edit; user can re-run brief).

### 5. Feed brief into image generation
`src/routes/api/generate-graphics.ts`
- Include `brandVibe` and full `brief` from the selected client in the DALL-E 3 prompt so generated graphics respect the strategist output.

`src/components/CreateScreen.tsx`
- Pass `brandVibe` and `brief` in the request payload.

### Technical notes
- No new npm deps; reuse existing shadcn `AlertDialog`, `Dialog`, `Textarea`, `Button`, Framer Motion.
- Strict RTL preserved (`dir="rtl"`, right-aligned labels).
- Colors stay in existing IBDIGITAL tokens (navy `#0B192C` + vibrant blue accent) — no hardcoded hex in new components except within the AI gradient button, which uses existing CSS vars.
