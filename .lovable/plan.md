# Decouple Ad Copy from Graphic Generation

Split the current "Creative Pack" flow so graphics generate first (image + on-graphic headline/subheadline/CTA only), and long-form ad copy is generated on-demand per card via a new endpoint with a rewritten Direct Response prompt.

## 1. Backend — new endpoint `src/routes/api/generate-ad-copy.ts`

New TanStack server route (`POST /api/generate-ad-copy`) using OpenAI `gpt-4o`, `response_format: json_object`, temperature ~0.9.

- **Input (Zod):** `clientName: string`, `clientBrief: string`, `graphicHeadline: string`, optional `graphicSubheadline`, `clientIndustry`, `targetAudience`, `brandVibe`.
- **System prompt:** the exact Direct Response spec supplied (5–10 line authentic copy; Hook → Bridge/Problem → Solution → 2–3 bullets → CTA; blacklist: 'חוויה קולינרית', 'קסום', 'חלום', 'פינוק', 'בלתי נשכח', 'מדהים', 'מרגש', 'מסע קולינרי'), with `${graphicHeadline}` and `${clientBrief}` interpolated.
- **Output:** `{ primary_text: string, link_headline: string }` — parsed with the same safe-clean logic as `generate-graphics.ts` and reasonable fallbacks on failure.
- Errors surface `429`/`402` distinctly like existing routes.

## 2. Backend — trim `src/routes/api/generate-graphics.ts`

- Remove `primary_text` / `link_headline` from the system prompt, JSON schema, `GraphicText` type, `safeParseItems`, and the pad-to-amount fallback loop.
- Restore the tighter prompt focused only on on-graphic headline/subheadline/CTA + `designBrief`.
- No change to `/api/generate-ad-image` (already only uses on-graphic text).

## 3. Types & data flow

- `GraphicItem` in `GraphicCard.tsx`: keep `primaryText?`, `linkHeadline?` fields but they start empty; add `copyStatus?: "idle" | "loading" | "success" | "error"` and `copyError?: string`.
- `CreateScreen.tsx`: stop reading `primary_text`/`link_headline` from `/api/generate-graphics`; seed each item with `copyStatus: "idle"`. Add a handler `handleGenerateCopy(index)` that:
  1. Sets that item's `copyStatus = "loading"`.
  2. POSTs to `/api/generate-ad-copy` with client context + that card's `headline` (+ `subheadline`).
  3. On success: updates the item with `primaryText`, `linkHeadline`, `copyStatus = "success"`, then calls `saveGeneratedGraphic` (or a new `updateGeneratedGraphic`) to persist the copy for the already-saved row.
  4. On error: `copyStatus = "error"` + toast.
- Pass `onGenerateCopy` down through `SuccessGrid` → `GraphicCard`.

## 4. Persistence — `src/hooks/useGeneratedGraphics.ts`

- Keep the existing `primary_text` / `link_headline` nullable columns (migration from the previous turn stays).
- Add `updateGraphicCopy(id, { primaryText, linkHeadline })` that patches the existing row after copy generation, so Gallery keeps working and re-renders show copy on refresh. No new migration needed.

## 5. UI — `src/components/GraphicCard.tsx`

Bottom section becomes state-driven (only rendered when `status === "success"`):

- **`copyStatus === "idle"` (or undefined):** show a single premium button, centered, full-width inside the card footer:
  - Label: `✏️ צור קופי למודעה` (lucide `PenLine` icon + text)
  - Style: `rounded-2xl bg-[#0B192C] text-white h-11 px-5 text-sm font-medium hover:bg-[#0B192C]/90 active:scale-[0.98] transition-all shadow-sm`
- **`copyStatus === "loading"`:** same button, disabled, spinner (`Loader2 animate-spin`) + `מייצר קופי…`.
- **`copyStatus === "error"`:** small red helper + retry button (same handler).
- **`copyStatus === "success"`:** reveal the existing minimalist container (`rounded-2xl bg-black/[0.03] border border-black/5 p-4`) with the two labeled blocks (`טקסט מרכזי למודעה`, `כותרת ממומן (ליד הכפתור)`) and the existing `CopyButton` components — unchanged design.
- Older Gallery rows that already have persisted `primaryText`/`linkHeadline` render directly in the success state (treat non-empty persisted copy as `success`).

## 6. Regression checks

- `SuccessGrid` continues to accept `items` + forwards the new `onGenerateCopy` prop; card heights already flexible.
- `GalleryScreen` reads persisted rows; unchanged (copy is optional and only shown when present).
- `generate-brief`, `ClientDialog`, `generate-ad-image`, auth flow untouched.

## Files touched

- new: `src/routes/api/generate-ad-copy.ts`
- edit: `src/routes/api/generate-graphics.ts` (remove copy fields from prompt/schema/parser)
- edit: `src/components/GraphicCard.tsx` (idle button + state-driven footer)
- edit: `src/components/SuccessGrid.tsx` (pass `onGenerateCopy` prop)
- edit: `src/components/CreateScreen.tsx` (new `handleGenerateCopy`, stop seeding copy from graphics call)
- edit: `src/hooks/useGeneratedGraphics.ts` (add `updateGraphicCopy`)
- no new migration
