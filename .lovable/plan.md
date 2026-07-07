## Meta Ads Creative Pack — Backend + Results UI

Upgrade generation to return graphic text + Meta Ads copy in a single call, and turn each result card into a "Creative Pack" (graphic + primary text + link headline with copy buttons).

### 1. Backend — `src/routes/api/generate-graphics.ts`

Rewrite the system prompt with strict Direct Response rules, and extend the item schema:

- **New fields per item:** `primary_text` (long post copy, PAS / status-hook / direct value offer; forbid opening questions like "מחפשים קייטרינג?"; 2–5 short lines, punchy hook first line, then value + CTA), `link_headline` (max 4–5 words, action-oriented like "לקבלת תפריט האירועים").
- **Blacklist** reused: 'חלומית', 'קסם', 'בלתי נשכח', 'הפתעה קולינרית', 'פתרון אלגנטי', 'מגע אישי', 'הכי טעים שיש'.
- Keep existing `headline`, `subheadline`, `cta`, `designBrief`; keep `json_object` mode with `{"items":[...]}` wrapper; keep `${clientBrief}` / `${optionalText}` / `${amountOfGraphics}` variables.
- Update `GraphicText` type and `safeParseItems` to extract `primary_text` / `link_headline` (with sane fallbacks in the pad-to-amount loop).

### 2. Type propagation

- `src/components/GraphicCard.tsx` — extend `GraphicItem` with `primaryText?: string` and `linkHeadline?: string`.
- `src/components/CreateScreen.tsx` — read the two new fields from the API response, seed them into each `GraphicItem`, and pass them through unchanged (no change to `/api/generate-ad-image`, since the ad image only needs the on-graphic text).
- `src/hooks/useGeneratedGraphics.ts` — persist `primary_text` / `link_headline` alongside existing metadata (new nullable columns, backwards compatible).

### 3. Database — nullable columns on `generated_graphics`

Single migration adding `primary_text text` and `link_headline text` (both nullable, no RLS/grant changes needed). Gallery keeps working for older rows.

### 4. Frontend — "Creative Pack Card"

Refactor `GraphicCard.tsx` so each card becomes vertical:

- **Top:** the existing 1:1 image (unchanged loading/error/success states, download button still hovers over the image).
- **Bottom:** an Apple-style container — `rounded-2xl bg-black/[0.03] border border-black/5 p-4 flex flex-col gap-3` — with two labeled blocks:
  1. `טקסט מרכזי למודעה` — multi-line, `whitespace-pre-wrap text-sm leading-relaxed text-[#0B192C]`.
  2. `כותרת ממומן (ליד הכפתור)` — single line, `text-sm font-medium`.
- Each block has a sleek copy button (lucide `Copy` → `Check` for 1.5s on success), positioned at the block's start-edge in RTL (`dir="rtl"`), using `navigator.clipboard.writeText` + `sonner` toast fallback.
- The bottom section is hidden while `status !== "success"` or when both fields are empty (older rows).

### 5. Grid layout — `src/components/SuccessGrid.tsx`

- Cards are no longer square; drop the fixed `aspectRatio: 1/1` on the outer card and keep the 1:1 aspect only on the inner image wrapper in `GraphicCard`.
- Keep the responsive `cols` logic but change `gridAutoRows` from `auto` to allow taller cards. Ensure the outer container stays `overflow-y-auto` (already true) — the whole results panel keeps its own scroll and the page itself never scrolls.

### 6. Regression checks (no changes, just verify)

- `PreviewPanel` passes `items` through to `SuccessGrid` untouched — safe.
- `GalleryScreen` reads persisted rows; renders image only, so new nullable columns don't affect it.
- Client brief pipeline (`generate-brief`) untouched; brief textarea in `ClientDialog` untouched.
- `generate-ad-image` payload unchanged (only uses on-graphic text).

### Files touched

- edit `src/routes/api/generate-graphics.ts`
- edit `src/components/GraphicCard.tsx`
- edit `src/components/SuccessGrid.tsx`
- edit `src/components/CreateScreen.tsx`
- edit `src/hooks/useGeneratedGraphics.ts`
- new migration: add `primary_text`, `link_headline` to `generated_graphics`
