# Premium redesign + gpt-4o routing

## 1. Backend: force gpt-4o via OpenAI direct

File: `src/routes/api/generate-graphics.ts`

- Switch fetch target from Lovable AI Gateway to `https://api.openai.com/v1/chat/completions`.
- Use `process.env.OPENAI_API_KEY` (already configured). Return a clear 500 if missing.
- Body:
  - `model: "gpt-4o"` (hardcoded)
  - `temperature: 0.7`
  - `response_format: { type: "json_object" }` to guarantee parseable JSON
  - `messages`: keep the existing detailed Hebrew system prompt (`buildSystemPrompt`) unchanged, and pass a short user turn asking for exactly `${amount}` variations
- Keep `safeParseItems` — it already tolerates both `{items:[...]}` and bare arrays. Adjust the user-message wrapper so the model returns `{"items":[...]}` (required by `json_object` mode which forbids top-level arrays).
- Leave the padding/fallback logic and error handling as-is.

## 2. Frontend: luxury template redesign

File: `src/components/GraphicCard.tsx`

### Font
- Install `@fontsource/heebo` (weights 400/600/800) via `bun add`.
- Import it in `src/main.tsx` (or the root route file if that's the entry) so the font is embedded at build time — no Google Fonts CDN, no `@import` in `styles.css`.
- Set `fontFamily: '"Heebo", system-ui, sans-serif'` on every text node inside the canvas.

### Palette (replace current cream/navy/accent set)
Exactly three luxury palettes, cycled by index — brand accent is dropped from backgrounds:

```text
1. Deep Navy   bg #0F1F38   text #F9F6F0   muted #B8C2D1   cta bg #D9C48E (sand/gold)  cta text #0F1F38
2. Soft Cream  bg #F9F6F0   text #0F1F38   muted #4A5A73   cta bg #0F1F38              cta text #F9F6F0
3. Sage Green  bg #8DA399   text #F9F6F0   muted #EDEDE0   cta bg #0F1F38              cta text #F9F6F0
```

The `accentColor` prop is no longer used for the solid blocks; keep the prop signature but ignore it inside `pickTemplate`.

### Typography & spacing (applied inside all three templates)
- Headline: weight 800, line-height 1.1, letter-spacing -0.02em, sizes tuned per template (84 / 72 / 76).
- Subheadline: weight 400, line-height 1.4, `muted` color for contrast, sizes 30 / 26 / 28.
- All text `text-align: right`, `direction: rtl`, `align-items: flex-end` in the flex column so headline / subheadline / CTA share a clean right edge.
- Padding inside every solid text block: minimum 80px on the 1080 canvas (well above the 40px minimum). Horizontal split bottom pad ≥ 88px; vertical split side pad 88px; framed card 96px.
- Gap between headline / subheadline / CTA: 28px, with an extra 20px top margin on the CTA.

### CTA button
- `border-radius: 4px` (sharp premium rectangle), padding `18px 40px`, weight 700, letter-spacing -0.01em.
- Palette-driven bg/fg (sand on navy, navy on cream, navy on sage).
- No pill shape, no heavy drop shadow — a single subtle `0 6px 20px rgba(15,31,56,0.18)`.
- `align-self: flex-end` so it hugs the right edge.

### Template tweaks (keep 1:1 = 1080×1080 export path)
- **Horizontal split**: photo top 55%, solid bottom 45%; content vertically centered inside bottom block; right-aligned.
- **Vertical split (RTL)**: photo right 50%, solid left 50%; content vertically centered; right-aligned inside its block.
- **Framed card**: solid full-bleed background, photo 52% height with 32px radius and soft shadow, text below, right-aligned (change from centered).

Remove any leftover gradient overlays or text-shadow properties — text now sits on solid color only.

## 3. Non-goals
- No changes to the Zod input schema, storage, `useClientAssets`, or export pipeline.
- No changes to `CreateScreen`, `SuccessGrid`, or `PreviewPanel` beyond what's already wired.
- No new secrets; `OPENAI_API_KEY` is already present.

## Technical details
- gpt-4o with `response_format: { type: "json_object" }` requires the word "json" in the prompt (already present in the system prompt) and forbids returning a top-level array — the user-turn instruction will ask for `{"items":[...]}`.
- Heebo shipped via `@fontsource` guarantees the font is available at PNG export time; the existing `document.fonts.ready` await in `handleDownload` stays.
- Deterministic template + palette cycling by `index % 3` keeps a stable look across regenerations of the same batch and makes previews match downloads.
