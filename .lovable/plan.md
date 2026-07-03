# Overhaul graphic templates → 3 "designed" styles

## Data changes

`GraphicItem` (in `src/components/GraphicCard.tsx`) gains a `photos: string[]` field alongside the existing `backgroundUrl` (kept for back-compat). `CreateScreen.tsx` composes each item with:

```ts
photos: shuffle(assets).slice(0, Math.min(3, assets.length)).map(a => a.url)
backgroundUrl: photos[0]
```

Deterministic per item using `index` as seed so preview matches download and regenerations stay stable.

## Fonts

Add `@fontsource/rubik` (400/700/900) via `bun add` and `@import` in `src/styles.css` next to the existing Heebo imports. Rubik used for the rugged "Chalkboard" headline; Heebo stays for the other two.

## Templates

Rewrite `GraphicCard.tsx` to cycle three richer templates by `index % 3`. All render at 1080×1080, RTL, absolute positioning, layered z-index — no more flat "web div" strips.

### 1. Chalkboard Market
- Full canvas dark chalkboard: `#141414` base with a subtle radial-gradient vignette + repeating conic/linear noise gradient (pure CSS, no image asset) to fake chalk texture.
- 2–3 photos rendered as polaroids, absolutely positioned, overlapping in the upper 60%: `border: 14px solid #f5efe4`, `padding-bottom` for polaroid chin, `box-shadow: 0 30px 60px -10px rgba(0,0,0,0.7)`, rotations `-6deg`, `4deg`, `-2deg`. Falls back to 1 or 2 polaroids if fewer photos exist.
- Headline in Rubik 900, large, tight leading, with the gold gradient (`linear-gradient(135deg,#f6d365 0%,#fda085 100%)`) via `background-clip: text`. Fallback `color: #fda085` so PNG export renders even if `html-to-image` drops `-webkit-text-fill-color`.
- Subheadline in white, weight 400, muted opacity.
- CTA styled like a chalk stamp: warm cream background (`#f5efe4`), dark ink text, hand-stamped shadow, slight rotation `-1.5deg`, sharp 6px radius.
- Text block anchored bottom-right with generous padding (96px).

### 2. Luxury Premium
- Background: deep emerald→black vertical gradient (`linear-gradient(180deg,#0a1f18 0%,#050505 100%)`).
- Top 60% is the hero photo (`object-fit: cover`) with an overlay `linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(5,5,5,0.9) 85%, #050505 100%)` that seamlessly fades into the solid bottom.
- Above headline: a small lucide `Diamond` icon (48px, gold `#D4AF7A`), centered right.
- Headline: Heebo 800, gold (`#D4AF7A`), letter-spacing `-0.02em`, ~92px.
- Thin gold hairline divider under the headline: `height: 1px; width: 140px; background: #D4AF7A; opacity: 0.7;` aligned to the text edge.
- Subheadline in pure white, weight 400, ~30px.
- CTA: outlined pill, gold border + gold text, hover-less flat luxury look, sharp 2px radius.
- All bottom content sits inside the dark 40% with 96px padding, right-aligned.

### 3. Dynamic Collage
- Warm off-white base (`#F2ECE1`) with a coloured diagonal accent band behind everything (`linear-gradient(135deg, transparent 55%, #E86A4E 55%)`).
- Large photo top-right, ~62% width × 58% height, rounded-organic `border-radius: 40% 60% 55% 45% / 50% 45% 55% 50%` and heavy shadow.
- Smaller secondary photo bottom-left, ~40% × 38%, square with 24px radius, tilted `-4deg`, shadow.
- Text stacked centre-left (right-aligned RTL) between the two photos.
- Headline: Heebo 900, dark navy `#0F1F38`, ~72px, tight.
- Subheadline: Heebo 500, `#4A5A73`, ~28px.
- CTA: "Stamp badge" — dark navy pill with white text, lucide `ArrowLeft` icon (RTL direction of travel), rotated `-3deg`, thick shadow, `border-radius: 999px`, `padding: 20px 40px`.
- Small circular "SALE-style" sticker top-left: solid `#E86A4E` disc, 140px, white bold Rubik micro-label (e.g. הזמינו עכשיו) rotated `-8deg` — only rendered when `item.cta` is short.

## Shared rules
- Every text node explicitly sets `fontFamily`, `direction: "rtl"`, `textAlign: "right"` (Collage & Chalkboard) — Luxury Premium centers headline block to hug the divider line.
- No `position: static` for photo/text layers — absolute or layered flex only, so nothing reads as "web div".
- Heavy `box-shadow` on every photo layer (`0 30px 60px -15px rgba(0,0,0,0.55)` or stronger).
- Existing 1080×1080 scaled canvas, `html-to-image` export, and download button stay unchanged. `document.fonts.ready` await already covers the new Rubik weights.
- `pickTemplate` continues to be deterministic by `index % 3`; `accentColor` prop kept in signature but unused.

## Non-goals
- No backend / API prompt changes.
- No new bucket, RLS, or schema changes.
- No new dependencies beyond `@fontsource/rubik`.
