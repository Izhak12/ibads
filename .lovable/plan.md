# Clean commercial photography + frontend text overlay

Split the pipeline cleanly: the image model produces a text-free, high-end commercial photograph with negative space, and the app renders the Hebrew headline / subheadline / CTA on top with real fonts.

## 1. Image prompt becomes photography-only

In `src/routes/api/generate-ad-image.ts`:

- Add a `artDirectorSuffix` constant with the exact block requested (style, camera & lighting, composition with negative space, negative constraints: no text/letters/logos/watermarks, no plastic or cheap 3D look).
- Rewrite `buildPrompt` into a visual-only builder: business context (industry, audience, brand vibe, brand colors as a *color palette* instruction), the visual part of the art-director brief, the photo/reference usage block, then `. ${artDirectorSuffix}`.
- Remove every text-rendering instruction: no `headline`, `subheadline`, or `cta` is sent to the image API anymore, and the "text must appear letter by letter" section is deleted.
- Style references keep their role (lighting, palette, composition language) but explicitly "ignore their text and overlays".
- Also instruct where the negative space should sit (top or bottom third) so the overlay always lands on clean area.
- Route response stays exactly the same shape (`{ b64 }`), so the frontend keeps working unchanged.

## 2. Concept step stays text-generation only

In `src/routes/api/generate-graphics.ts`:

- Keep `headline` / `subheadline` / `cta` (now used only by the UI overlay).
- Reword the `designBrief` instruction so it describes only the photographic scene: subject, setting, lighting, mood, palette, composition and where the empty area is — no fonts, no badges, no CTA-button design, no text placement copy.
- Keep the same JSON shape and parser, so nothing else changes.

## 3. Text overlay on the card

In `src/components/GraphicCard.tsx`:

- Wrap the 1:1 image in a composition layer: photo `object-cover`, a soft dark gradient scrim for legibility, and RTL Hebrew typography using the already-installed Rubik/Heebo fonts — large bold headline, lighter subheadline, and a pill-shaped CTA button.
- Overlay text is sized with `clamp()`/percentage units so it scales with the card and stays readable in the grid.
- Download now exports the *composed* card (photo + overlay) as PNG at 1080x1080 using the already-installed `html-to-image`, instead of dumping the raw base64.
- Loading / error / copy-panel behaviour is untouched.

Gallery cards reuse the same component, so saved graphics get the same overlay from their stored headline/subheadline/CTA.

## Notes

- No database or storage changes; the stored PNG remains the clean background and the text is composed at render/export time.
- No new packages — `html-to-image`, `@fontsource/rubik`, `@fontsource/heebo` are already installed.
