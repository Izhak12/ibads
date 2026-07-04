# Upgrade: gpt-image-2 + style reference ads + richer designBrief

## 1. Model swap — `src/routes/api/generate-ad-image.ts`

- Replace both `model: "gpt-image-1"` strings (JSON generations call + multipart edits FormData) with `"gpt-image-2"`.
- Keep `quality: "high"`, `size: "1024x1024"`, `n: 1`.
- Do not add `input_fidelity` or `background: "transparent"`.
- Current file has no HTML overlay / textZone logic — text-in-image is already the flow, so nothing to "revert". Text rendering just becomes reliable now.
- Rewrite `buildPrompt` in **Hebrew** (see section 4).

## 2. Reference-ad uploads (new asset kind)

**DB** — new migration:
```sql
ALTER TABLE public.client_assets
  ADD COLUMN kind text NOT NULL DEFAULT 'photo'
    CHECK (kind IN ('photo', 'reference'));
CREATE INDEX client_assets_client_kind_idx
  ON public.client_assets (client_id, kind);
```
Existing rows keep `kind='photo'`. No new grants (table already granted). Existing RLS policies still apply.

**Hook** — `src/hooks/useClientAssets.ts`:
- Accept second arg `kind: 'photo' | 'reference' = 'photo'`.
- Include `kind` in the `select`, the `.eq("kind", kind)` filter, and the insert payload.
- Cache key becomes `["client-assets", clientId, kind]`.

**Dialog** — `src/components/ClientDialog.tsx`:
- Add a second `<Section title="דוגמאות עיצוב (סטייל רפרנס)">` under the business-assets section, wrapping a second `<AssetsUploader clientId={editingClientId} kind="reference" />`.
- `AssetsUploader` gains a `kind` prop, forwards it to `useClientAssets(clientId, kind)`, and shows a short helper line in Hebrew explaining "העלה 1–3 מודעות מוגמרות שאהבת — הסגנון שלהן ישמש השראה לעיצוב."

**Create screen** — `src/components/CreateScreen.tsx`:
- Call `useClientAssets(selectedClientId, "photo")` for `assets` (unchanged) and add `useClientAssets(selectedClientId, "reference")` for `refs`.
- In the assets summary panel, show two mini rows: photo count + reference count. Only photos remain required for `canGenerate`.
- Pass up to 3 photo URLs + up to 3 reference URLs per concept to the image route (all concepts share the same references; photos rotate as today).

## 3. `/api/generate-ad-image` input + prompt structure

- Extend `InputSchema` with `referenceUrls: z.array(z.string()).default([])` (cap to 3 in handler).
- When at least one photo OR reference exists → use `/v1/images/edits`. Build the multipart body appending images in this exact order:
  1. All photo blobs (`image[]`) — the "REAL photos".
  2. All reference blobs (`image[]`) — the "STYLE REFERENCES".
  This ordering is what the Hebrew prompt relies on ("התמונות הראשונות … התמונות האחרונות …").
- When both arrays are empty → `/v1/images/generations` (no ordering issue).
- Fallback: if `edits` returns non-OK, retry via `generations` (existing behaviour).
- Response shape unchanged: `{ b64 }`.

## 4. Hebrew image prompt

`buildPrompt(input, hasPhotos, hasRefs)` returns a Hebrew string that:
- Opens with business context: name, industry, target audience, brand vibe, brand colors.
- States the visual concept from `designBrief` (already Hebrew after §5).
- If `hasPhotos && hasRefs`:
  > "התמונות הראשונות המצורפות הן צילומים אמיתיים של העסק — השתמש בהן כתוכן הצילומי של המודעה. התמונות האחרונות המצורפות הן דוגמאות סטייל של מודעות מוגמרות — העתק מהן את שפת העיצוב, צפיפות הלייאאוט, סגנון הטיפוגרפיה, באדג'ים, אלמנטים דקורטיביים וגימור כללי, אך אל תעתיק את הטקסטים שלהן ולא את הצילומים שלהן."
- If only photos: keep the current "השתמש בצילומים…" line, drop the references paragraph.
- If only references: symmetric — "התמונות המצורפות הן דוגמאות סטייל בלבד…"
- Then the mandatory-text block:
  > "המודעה חייבת לכלול את הטקסטים הבאים בעברית:
  > כותרת ראשית (הגדולה, מודגשת): '{headline}'
  > תת־כותרת (קטנה יותר, תומכת): '{subheadline}'
  > כפתור CTA (מעוצב כבבירור ככפתור): '{cta}'
  > הטקסטים חייבים להופיע בדיוק אות-באות כפי שנכתבו, בעברית תקינה מימין לשמאל, ללא שגיאות כתיב וללא המצאת מילים."
- Closes with (verbatim per spec):
  > "professional advertising design, clean visual hierarchy, premium finish, no invented logos or business names, no extra text beyond what was specified."

## 5. Richer designBrief — `src/routes/api/generate-graphics.ts`

- Rewrite `buildSystemPrompt`: `designBrief` becomes a **Hebrew** art-director spec (5–8 lines each) required to cover, per concept:
  1. כיוון אמנותי כללי ומצב־רוח.
  2. קומפוזיציה מדויקת (איפה עומד הטקסט, איפה הצילום, האם יש בליד, יחסי שטח).
  3. מערכת דקורטיבית ייחודית לקונספט — divider / באדג' / חותמת / טקסטורה (זהב, גיר, קראפט, נייר, וכו'). כל קונספט חייב טקסטורה שונה מהאחרים.
  4. שורת 3–4 USPs עם אייקון + לייבל קצר כשמתאים (לא בכל קונספט חובה).
  5. עיצוב כפתור CTA — צורה, מיקום, אייקון (כשהטקסט מזמין לפנייה בוואטסאפ → אייקון WhatsApp; אחרת חץ).
  6. מיקרו־קופי תחתון בשורה אחת (למשל "מושלם לימי הולדת, אירועים פרטיים וחגיגות") — כשמתאים.
- The N concepts must use **clearly different** art directions (state this constraint explicitly and give examples: "chalkboard rustic", "gold-foil luxury editorial", "kraft-paper deli", "modern minimal editorial", "vibrant collage", etc.).
- Update JSON-shape example in the prompt + user message to reflect the richer `designBrief`. Parsing already accepts a string, so no code change to `safeParseItems`.
- Bump `temperature` to `1.0` for wider stylistic variance across concepts.

## 6. Types / small touches

- `src/integrations/supabase/types.ts` is auto-generated — leave untouched; the new `kind` column will regenerate on next sync. Access it via `(row as any).kind` OR just re-select on the `client_assets` query where the return columns still match after `select("id,storage_path,kind")` (extra column is fine).
- No changes to `GraphicCard` or `SuccessGrid` (they render whatever image the server returns).

## Non-goals

- No new dependencies. No auth/RLS changes. No storage-bucket changes (references reuse the existing `client-assets` bucket + `user_id/client_id/uuid.ext` path convention).
- Cost warning copy in `CreateScreen` stays as-is ("עד דקה לתמונה").
