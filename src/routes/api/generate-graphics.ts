import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  clientName: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
  text: z.string().optional().default(""),
  brief: z.string().optional().default(""),
  amount: z.number().int().min(1).max(10),
});

type Input = z.infer<typeof InputSchema>;

export type GraphicText = {
  headline: string;
  subheadline: string;
  cta: string;
  designBrief: string;
};

function buildSystemPrompt(input: Input) {
  const clientName = input.clientName || "לא צוין";
  const clientBrief =
    [input.brief, input.clientIndustry && `תחום: ${input.clientIndustry}`, input.targetAudience && `קהל יעד: ${input.targetAudience}`, input.brandVibe && `טון וסגנון: ${input.brandVibe}`]
      .filter(Boolean)
      .join("\n") || "לא צוין";
  const optionalText = input.text || "אין";
  const brandColors = input.brandColors.length ? input.brandColors.join(", ") : "לא צוין";
  const amountOfGraphics = input.amount;

  return `אתה קופיריטר בכיר לקריאייטיבים ממומנים וגם ארט־דירקטור מנוסה שכותב בריפים ויזואליים מלאים בעברית.

המשימה: לייצר ${amountOfGraphics} קונספטים מובחנים לחלוטין לגרפיקה מרובעת 1:1 עבור:
שם העסק: ${clientName}
בריף / תחום / קהל / טון: ${clientBrief}
צבעי מותג: ${brandColors}
טקסט חובה על הגרפיקה (אם צוין): ${optionalText}

לכל קונספט החזר 4 שדות:
1. headline (עברית) – כותרת קצרה, חדה, שיווקית, בלי שגיאות.
2. subheadline (עברית) – משפט תמיכה שמסביר את הערך.
3. cta (עברית) – הנעה לפעולה ברורה (למשל "לפרטים והזמנות", "השאירו פרטים", "שלחו הודעה בוואטסאפ").
4. designBrief (עברית, 5–8 שורות) – בריף ארט־דירקטור מלא לקונספט הזה בלבד. חובה שיפרט:
   • כיוון אמנותי כללי ומצב־רוח (למשל "chalkboard rustic", "gold-foil luxury editorial", "kraft-paper deli", "modern minimal editorial", "vibrant collage", "risograph", "magazine spread", "typographic poster").
   • קומפוזיציה מדויקת – איפה עומד הטקסט (עמודה ימנית/שמאלית/עליונה/תחתונה), איפה יושב הצילום, האם יש בליד, יחסי שטח בין טקסט לצילום.
   • מערכת דקורטיבית ייחודית לקונספט – divider, באדג', חותמת, מסגרת, טקסטורה (זהב, גיר, קראפט, נייר, סריגה, ריזוגרף וכו'). כל קונספט חייב טקסטורה/דקורציה שונה מהאחרים.
   • כשמתאים – שורת 3–4 USPs עם אייקון + לייבל קצר (למשל "כשר · משלוחים · מתנה חינם · טרי יומי").
   • עיצוב כפתור CTA – צורה, מיקום, אייקון. כשהטקסט מזמין לפנייה בוואטסאפ הוסף אייקון WhatsApp; אחרת חץ או אייקון מתאים אחר.
   • מיקרו־קופי תחתון בשורה אחת כשמתאים (למשל "מושלם לימי הולדת, אירועים פרטיים וחגיגות").
   • איך משתמשים בצבעי המותג (${brandColors}) – מה הצבע הדומיננטי, מה משמש כאקסנט, על מה יושב הטקסט.

חוקים:
- כל קונספט חייב להשתמש בכיוון אמנותי שונה מהותית משאר הקונספטים באותה סדרה – שונה במצב־רוח, בטקסטורה, בקומפוזיציה ובמערכת הדקורטיבית.
- אסור להמציא שם עסק או לוגו.
- אסור טקסט עברי עם שגיאות.
- אסור טון זול / הנחות אגרסיביות / קהל מחפש מחיר. הטון תמיד יוקרתי־נגיש.
- כל קונספט מרגיש כמו מודעת פרימיום מעוצבת ביד, לא תבנית AI.

פורמט פלט:
JSON object בלבד, בלי markdown ובלי טקסט נלווה, בצורה הבאה:
{
  "items": [
    { "headline": "…", "subheadline": "…", "cta": "…", "designBrief": "כיוון אמנותי: …\\nקומפוזיציה: …\\nדקורציה: …\\nUSPs: …\\nCTA: …\\nמיקרו־קופי: …\\nצבעים: …" }
  ]
}`;
}

function safeParseItems(raw: string, amount: number): GraphicText[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  const items = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown })?.items)
      ? ((parsed as { items: unknown[] }).items)
      : [];
  return items.slice(0, amount).map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      headline: String(o.headline ?? "").trim(),
      subheadline: String(o.subheadline ?? "").trim(),
      cta: String(o.cta ?? "").trim() || "לפרטים נוספים",
      designBrief: String(o.designBrief ?? o.design_brief ?? "").trim(),
    };
  });
}


export const Route = createFileRoute("/api/generate-graphics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "OPENAI_API_KEY is not configured" },
            { status: 500 },
          );
        }
        let input: Input;
        try {
          input = InputSchema.parse(await request.json());
        } catch (err) {
          return Response.json(
            { error: "Invalid input", details: String(err) },
            { status: 400 },
          );
        }

        try {
          const res = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o",
                temperature: 1.0,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: buildSystemPrompt(input) },
                  {
                    role: "user",
                    content: `צור בדיוק ${input.amount} וריאציות שונות זו מזו מהותית – כל אחת עם designBrief מלא בעברית בסגנון ארט־דירקטור (5–8 שורות, מכסה כיוון אמנותי, קומפוזיציה, דקורציה, USPs, CTA, מיקרו־קופי, שימוש בצבעי המותג). כל וריאציה חייבת להיות בעולם אסתטי שונה לחלוטין מהאחרות. החזר JSON object בפורמט: {"items":[{"headline":"...","subheadline":"...","cta":"...","designBrief":"..."}]}`,
                  },
                ],
              }),
            },
          );
          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 402 || res.status === 429 ? res.status : 500;
            return Response.json({ error: `OpenAI ${res.status}: ${text}` }, { status });
          }
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const raw = json.choices?.[0]?.message?.content ?? "";
          const items = safeParseItems(raw, input.amount);
          while (items.length < input.amount) {
            items.push({
              headline: input.clientName || "העסק שלך",
              subheadline: input.text || input.brandVibe || "",
              cta: "לפרטים נוספים",
              designBrief:
                "כיוון אמנותי: modern minimal editorial פרימיום.\nקומפוזיציה: עמודה טיפוגרפית ימנית ובליד צילום בשמאל, יחס 40/60.\nדקורציה: divider דק ובאדג' קטן מוזהב פינת המודעה.\nUSPs: ללא.\nCTA: כפתור מלא ברוחב, פינות מעוגלות, אייקון חץ.\nמיקרו־קופי: שורה תחתונה אלגנטית.\nצבעים: רקע ניטרלי חם, טקסט כהה, אקסנט בצבע המותג הראשי.",
            });
          }
          return Response.json({ items });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
