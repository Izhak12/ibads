# Fix brief/design conflict — brief becomes marketing facts only

## Problem

`/api/generate-brief` currently produces a 9-section **visual** creative brief (typography, lighting, camera, composition, motifs, color palette). That brief flows into `/api/generate-graphics`, whose per-concept `designBrief` ALSO defines art direction, alongside style-reference images. Three competing art directions → generic compromises from gpt-image-2.

Fix: brief = marketing facts (what/who/why). Visual direction stays owned by `designBrief` + reference images only.

## 1. Rewrite `/api/generate-brief` (`src/routes/api/generate-brief.ts`)

Replace `SYSTEM_PROMPT` with a Hebrew marketing-brief spec, 150–250 words, sections in this exact order:

1. **מהות העסק והבידול** — 2–3 משפטים.
2. **מה העסק מוכר** — רק מתוך `coreOffers`. אין להמציא מנות/שירותים/מחירים.
3. **קהל היעד** — מי הם + 2–3 כאבים/רצונות מרכזיים.
4. **USPs** — 3–5 ביטויים קצרים (2–4 מילים) שמתאימים כלייבלים לאייקונים במודעה. דוגמה: "שפית מקצועית באירוע", "תפריט עשיר ומגוון".
5. **זוויות מסר** — 3–5 hooks מובחנים למודעות (רגשי, FOMO, social proof, פרימיום, פרקטי).
6. **טון דיבור** — 1–2 משפטים.
7. **ממה להימנע** — מילים/טענות/וייבים אסורים למותג הזה.

Grounding rules appended verbatim to the system prompt:

> "השתמש אך ורק בעובדות שסופקו. אסור להמציא מנות, שירותים, מחירים, ביקורות או נתונים. אם מידע חסר — פשוט השמט את השורה."
>
> "אל תכתוב שום הנחיות ויזואליות — לא פונטים, לא תאורה, לא קומפוזיציה, לא צבעים ולא מוטיבים. אלה נקבעים בשלב אחר."

Output format: Hebrew Markdown-light with `**כותרת**` headers, no JSON, no code fences, no intros/outros — matches existing parsing (free text stored in `clients.brief`).

`buildUserPrompt`, input schema, endpoint path, model (`google/gemini-2.5-flash` via Lovable AI Gateway), and error handling stay unchanged.

## 2. Update `/api/generate-graphics` system prompt (`src/routes/api/generate-graphics.ts`)

In `buildSystemPrompt`, add an explicit input-usage clause near the top:

> "בריף הלקוח הוא מקור העובדות והמסרים — שאב ממנו את הקופי, ה-USPs וזוויות המסר. את ההחלטות הוויזואליות קבע בעצמך ב-designBrief, בהתאם לצבעי המותג ולסגנון הרפרנסים."

Add two rules to the existing rules list:

- כל קונספט חייב לבחור **זווית מסר שונה** מרשימת "זוויות מסר" שבבריף (רגשי / FOMO / social proof / פרימיום / פרקטי וכו').
- שורת ה-USPs בתוך `designBrief` חייבת להשתמש בלייבלים שמופיעים ברשימת ה-USPs של הבריף (לא להמציא חדשים).

No change to `InputSchema`, response shape, temperature, or the JSON example — `brief` field already carries the full text through.

## 3. Untouched

- `ClientDialog` brief textarea: unchanged (already editable free text, generation button already calls `/api/generate-brief`).
- `/api/generate-ad-image` prompt: unchanged.
- DB, hooks, `CreateScreen`, `GraphicCard`, `SuccessGrid`: unchanged.
- No new deps, no migrations.

## Files touched

- `src/routes/api/generate-brief.ts` — rewrite `SYSTEM_PROMPT`.
- `src/routes/api/generate-graphics.ts` — extend `buildSystemPrompt` with input-usage clause + 2 rules.
