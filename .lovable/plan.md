# Pipeline rebuild: gpt-image-1 as the actual designer

Today `/api/generate-graphics` returns text only, and `GraphicCard.tsx` renders one of 3 hardcoded CSS templates via `html-to-image`. We'll replace the visual output with real OpenAI image generations that incorporate the client's photos.

## Step 1 — `src/routes/api/generate-graphics.ts` (concept step)

- Keep `gpt-4o`, `temperature: 0.7`, `response_format: json_object`.
- Extend each item to include `designBrief` (English, rich visual concept). Each of the N items must be a **visually distinct** concept (composition, mood, palette usage from `brandColors`, typography style, photo placement).
- Update the system prompt: add a section instructing the model to output English `designBrief` alongside Hebrew `headline` / `subheadline` / `cta`, and to make every concept different from the others in the batch.
- Update the JSON shape example + `safeParseItems` to include `designBrief`.
- Update the exported `GraphicText` type. No auth/DB changes.

## Step 2 — new server route `src/routes/api/generate-ad-image.ts`

TanStack file route `POST /api/generate-ad-image`. Body:
```
{ headline, subheadline, cta, designBrief,
  clientName, clientIndustry, targetAudience, brandVibe,
  brandColors: string[], assetUrls: string[] (0–3) }
```

Handler:
1. Zod validate. Read `process.env.OPENAI_API_KEY` inside handler.
2. Build the exact prompt string from the spec, interpolating all dynamic values (brandColors joined as `#hex, #hex`).
3. If `assetUrls.length > 0`:
   - `fetch` each URL in parallel, take up to 3, get `arrayBuffer` + content-type.
   - Build `FormData` with `model=gpt-image-1`, `size=1024x1024`, `quality=high`, `prompt`, and each photo appended as `image[]` (Blob with filename).
   - POST to `https://api.openai.com/v1/images/edits` with `Authorization: Bearer …` (no Content-Type — let fetch set the multipart boundary).
4. Else: JSON POST to `https://api.openai.com/v1/images/generations` with the same model/size/quality/prompt.
5. Return `{ b64: data[0].b64_json }`. On upstream error, forward `{ error }` with status 500 (or pass through 402/429).
6. No explicit timeout wrapper — Cloudflare Worker fetch handles long upstreams; the client controls UX.

Route lives outside `/api/public/` since it's called from the app (no signature required); it's an unauthenticated endpoint, matching the existing `generate-graphics` pattern.

## Step 3 — rewire `src/components/CreateScreen.tsx`

- `GraphicItem` becomes `{ headline, subheadline, cta, status: 'loading'|'success'|'error', imageB64?: string, error?: string, retry: () => void }` (drop `backgroundUrl`, `photos`). Move the type into `GraphicCard.tsx` or a shared file — update both.
- Flow:
  1. `POST /api/generate-graphics` → get N concepts (with `designBrief`).
  2. Seed `items` with N `status:'loading'` entries and switch preview to `success` immediately (so the grid + skeletons render).
  3. Fire N **parallel** `/api/generate-ad-image` calls. Rotate `assetUrls` per index using the same deterministic slice logic used today (up to 3 photos per concept).
  4. As each resolves, update just that index (`imageB64` + `status:'success'`) via functional `setItems`. On failure set `status:'error'` and store a bound `retry` callback that re-fires the single request.
- Warning copy under the slider: "כל תמונה יכולה לקחת עד דקה" when count is high.

## Step 4 — `GraphicCard.tsx` + `SuccessGrid.tsx` + `PreviewPanel.tsx`

- **Remove**: `SplitLayout`, `PolaroidCollage`, `PremiumCard`, `GraphicCanvas`, `RENDER_SIZE`, `toPng` / `html-to-image` import, `PALETTES`, `pickTemplate`, `pickPalette`, font consts, `headlineFontSize`, `getPhotos`.
- `GraphicCard` now renders one of three states inside the 1:1 tile:
  - `loading`: skeleton with subtle shimmer + spinner + small caption "מייצר עיצוב…"
  - `error`: error icon + Hebrew message + "נסה שוב" button calling `item.retry()`
  - `success`: `<img src={`data:image/png;base64,${imageB64}`}>` filling the tile
- Download button (visible on hover in `success` only) triggers a direct anchor download of the base64 PNG — no canvas capture.
- `SuccessGrid` unchanged except it renders regardless of individual card status (grid appears as soon as concepts arrive). Header count reflects `items.length`.
- `PreviewPanel`: `loading` state now only covers the brief concept-generation phase; once concepts arrive we render the grid with skeletons for individual images.
- `html-to-image` dependency stays installed (harmless) unless we want to prune — leave it to avoid a lockfile churn; can remove later.

## Non-goals / untouched
- Auth, `ClientsContext`, `useClientAssets`, Supabase, DB schema, secrets. `OPENAI_API_KEY` already configured.
- `src/styles.css` font imports stay (harmless).
- Amount cap stays at 10.

## Notes / risks
- gpt-image-1 returns base64 by default on the images endpoints; total payload for 10×~1.5MB images is ~15MB in memory — acceptable for this app but we won't persist them.
- `images/edits` requires org verification on the OpenAI account; if the account isn't verified, edits fail. In that case we fall back automatically to `images/generations` (log a warning, no photo grounding).
