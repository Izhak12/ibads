# Backend + Canvas Template Overhaul

## 1. Backend (`src/routes/api/generate-graphics.ts`)

Current state already satisfies the request — verify and leave logic intact:

- `model: "gpt-4o"` ✓
- `temperature: 0.7` ✓
- `response_format: { type: "json_object" }` ✓
- Strict Hebrew system prompt with headline/subheadline/cta contract ✓
- `safeParseItems` tolerates both `{items:[...]}` and bare `[...]`, pads missing items ✓

Only change: tighten the user message so the JSON shape matches the schema line in the system prompt (system prompt shows a bare array, request asks for `{items:[]}` — align both on `{items:[...]}` to prevent occasional shape drift). No functional refactor beyond that.

No changes to Auth, Clients context, `useClientAssets`, or DB fetching — this route is standalone and the request/response contract already used by `CreateScreen.tsx` stays identical.

## 2. Frontend Canvas (`src/components/GraphicCard.tsx`)

Rewrite the three templates with strict containment so nothing overflows the 1080×1080 canvas and the CTA can never be clipped.

### Shared container rules
- Outer wrapper keeps `aspect-ratio: 1 / 1`, `overflow: hidden`, and the existing scaled 1080px canvas — unchanged.
- Every template root uses `position: absolute; inset: 0; overflow: hidden; box-sizing: border-box` and an inner **safe area** with `padding: 64px` (≈40px scaled), `display: flex`, `flex-direction: column` so text blocks flow instead of using magic `top/bottom` offsets that clip.
- Every text node: `min-width: 0`, `max-width: 100%`, `overflow-wrap: anywhere`, `word-break: break-word`. CTA uses `flex-shrink: 0` and its own row wrapper with `margin-top: auto` so it is always anchored above the bottom padding, never inside a fixed-height parent that can crop it.
- Headline uses `clamp`-style sizing via a helper that picks font-size from headline length (e.g. ≤18 chars → 104px, ≤32 → 84px, else 64px) so long Hebrew strings don't overflow.
- Fonts: Heebo + Rubik already imported via `@fontsource` in `src/styles.css` — no new imports.

### Template A — Split Layout (replaces "Luxury Premium")
- Two vertical regions inside a single flex column: top 55% hero photo (`object-fit: cover`), bottom 45% solid block (`#0F1F38` navy or cream depending on palette rotation).
- Text block is a flex column with `justify-content: center`, `gap: 20px`, right-aligned RTL. No fixed heights on text — `flex: 1` region grows, CTA sits at natural end.
- CTA: gold `#D4AF7A` pill, `border-radius: 4px`, `padding: 18px 44px`, `align-self: flex-end`.
- Thin gold hairline divider under headline (140×1px).

### Template B — Polaroid Collage (replaces "Chalkboard Market")
- Dark chalkboard background retained, but polaroids are absolutely positioned **inside a bounded 1080×620 upper stage** (`position: absolute; top: 0; left: 0; right: 0; height: 620px; overflow: hidden`) so rotated polaroids can never bleed past the canvas edge.
- Up to 3 polaroids with clamped sizes (`min(360px, 34%)`) and rotations `-6°`, `4°`, `-2°`; `will-change: transform` to keep shadows crisp in `html-to-image`.
- Bottom 460px is a solid text region with 64px padding, flex-column, `justify-content: flex-end`, `gap: 20px`. Headline uses gold gradient with fallback `color`.
- CTA cream stamp, `flex-shrink: 0`, `align-self: flex-end`, rotated `-1.5°`.

### Template C — Premium Centered Card (replaces "Dynamic Collage")
- Warm base (`#F2ECE1`) with a full-bleed hero photo behind a centered translucent card.
- Card: `width: 78%; max-width: 820px; margin: auto; padding: 56px 48px; background: rgba(255,249,240,0.96); border-radius: 24px; box-shadow: 0 40px 80px -20px rgba(15,31,56,0.35)`.
- Card is a flex column, right-aligned RTL, `gap: 22px`. No absolute positioning inside — text and CTA flow naturally so nothing clips regardless of copy length.
- Small navy accent bar (`4px × 48px`) above headline instead of the previous sticker/badge chaos.
- CTA: navy pill with `ArrowLeft` icon, `border-radius: 999px`, `padding: 18px 36px`, `align-self: flex-end`, no rotation (prevents shadow-clip inside the card).
- Removes: diagonal accent band, organic blob photo, tilted secondary photo, rotated "חדש" sticker — these were the main sources of the boxy/overflow feel.

### Palette rotation
Keep `pickTemplate(index) = index % 3`. Add a parallel `pickPalette(index)` returning navy/cream/sage for Template A and C so consecutive graphics don't repeat the same colorway.

### Export fidelity
- `html-to-image` config unchanged (1080×1080, `pixelRatio: 1`).
- Continue awaiting `document.fonts.ready` before capture.
- Every `<img>` keeps `crossOrigin="anonymous"` and `display: block`.

## 3. Non-goals / regression guard
- No changes to `CreateScreen.tsx` data flow, `GraphicItem` type, `useClientAssets`, `ClientsContext`, `AuthScreen`, or any Supabase code.
- No new dependencies.
- No changes to `PreviewPanel`, `SuccessGrid`, or the download button UX.

## Files touched
1. `src/routes/api/generate-graphics.ts` — align user-message JSON shape hint with system prompt (one-line change).
2. `src/components/GraphicCard.tsx` — full rewrite of the three template components plus a shared `SafeCanvas` wrapper and headline-size helper. `GraphicCard` shell, scaling logic, and download handler stay as-is.
