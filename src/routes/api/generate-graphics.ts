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
  const clientBrief =
    [
      input.brief,
      input.clientName && `שם עסק: ${input.clientName}`,
      input.clientIndustry && `תחום: ${input.clientIndustry}`,
      input.targetAudience && `קהל יעד: ${input.targetAudience}`,
      input.brandVibe && `טון וסגנון: ${input.brandVibe}`,
      input.brandColors.length && `צבעי מותג: ${input.brandColors.join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n") || "לא צוין";
  const optionalText = input.text || "אין";
  const amountOfGraphics = input.amount;

  return `אתה קופירייטר Direct Response בכיר ואסטרטג ויזואלי לקמפיינים ממומנים (Meta Ads). המשימה שלך: לייצר קונספטים לגרפיקות מודעה — טקסט קצר על הגרפיקה + בריף אמנותי מלא לביצוע.

צור וריאציות עבור העסק הבא:

בריף וקהל יעד: ${clientBrief}

טקסט חובה לשילוב (אם יש): ${optionalText}

לכל וריאציה קונספט ייחודי (זווית מסר שונה מהאחרות).

חוקי ברזל:

1. Headline (על הגרפיקה): הוק חד וקצר, מקסימום 6 מילים. פונה לתוצאה או לכאב. בלי סיסמאות ריקות ובלי שאלות קיטשיות.

2. Subheadline (על הגרפיקה): מקסימום 12 מילים. סיבה מוחשית וספציפית — לא כלליות שיווקית.

3. CTA (על הגרפיקה): אקטיבי, ברור, קצר. למשל "בדקו זמינות תאריך", "לקבלת תפריט מחירים", "דברו איתנו בוואטסאפ".

4. designBrief: כיוון אמנותי, קומפוזיציה, דקורציה, שימוש בצבעי המותג ו-CTA — 5-8 שורות בעברית.

רשימה שחורה — אסור בכל השדות:
'חלומית', 'קסם', 'בלתי נשכח', 'הפתעה קולינרית', 'פתרון אלגנטי', 'מגע אישי', 'הכי טעים שיש'.

במקום מילים ריקות — דבר בתוצאות, מספרים, תועלות אמיתיות, ובשפה טבעית פרימיום בגובה העיניים.

CRITICAL FORMATTING REQUIREMENT:

You MUST output ONLY a JSON object with an "items" array containing exactly ${amountOfGraphics} objects. No markdown, no conversational text.

Format:

{
  "items": [
    {
      "headline": "כותרת עוצרת גלילה",
      "subheadline": "תת כותרת מוחשית שמגבה את הכותרת",
      "cta": "הנעה לפעולה אקטיבית",
      "designBrief": "כיוון אמנותי, קומפוזיציה, דקורציה, שימוש בצבעי המותג ו-CTA — 5-8 שורות בעברית"
    }
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
                    content: `צור בדיוק ${input.amount} קונספטים לגרפיקות מודעה שונים זה מזה מהותית — כל אחד עם זווית מסר שונה: headline/subheadline/cta לגרפיקה ו-designBrief מלא בעברית. החזר JSON object בפורמט: {"items":[{"headline":"...","subheadline":"...","cta":"...","designBrief":"..."}]}`,
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
