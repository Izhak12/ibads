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
};

function buildSystemPrompt(input: Input) {
  const clientName = input.clientName || "לא צוין";
  const clientBrief =
    [input.brief, input.clientIndustry && `תחום: ${input.clientIndustry}`, input.targetAudience && `קהל יעד: ${input.targetAudience}`, input.brandVibe && `טון וסגנון: ${input.brandVibe}`]
      .filter(Boolean)
      .join("\n") || "לא צוין";
  const optionalText = input.text || "אין";
  const amountOfGraphics = input.amount;

  return `אתה קופיריטר וגרפיקאי בכיר ומומחה לקריאייטיבים לממומן, עם ניסיון של 10 שנים בעיצוב מודעות שמביאות תוצאות.

אתה מתמחה ביצירת קונספטים למודעות בפייסבוק/אינסטגרם, תוך שמירה על היררכיית טקסט נכונה, UI נקי, וקופי שיווקי חד.

המשימה:

אני רוצה שתיצור עבורי קונספט וטקסטים לגרפיקה שיווקית ברזולוציה מרובעת 1:1, עבור העסק הבא:

שם העסק: ${clientName}

בריף העסק, תיאור השירות וקהל היעד: ${clientBrief}

טקסט חובה לשילוב על הגרפיקה (אם צוין): ${optionalText}

סגנון וטון דיבור:

הקופי צריך להיות ברור, חד, שיווקי ולא מתאמץ. לדבר בשפה פשוטה אבל יוקרתית, לא עממית מדי ולא מתנשאת.

המסר צריך לגרום ללקוח להבין את הערך מיד. אפשר להשתמש בסגנונות שונים בכל פעם: יוקרתי, אלגנטי, אותנטי, רגשי, מודרני, או כל קונספט שמתאים למודעה.

מבנה הטקסט על הגרפיקה:

בכל גרפיקה חייבים להיות:

1. כותרת חזקה וברורה: משפט קצר שתופס את העין ומדבר ישירות לקהל.

2. תת־כותרת / חיזוק המסר: משפט שמסביר בקצרה את הערך של השירות.

3. הנעה לפעולה (CTA) ברורה: למשל: 'לפרטים והזמנות לחצו כאן', 'השאירו פרטים ונחזור אליכם'.

גבולות גזרה חשובים:

אסור להמציא שם עסק.

אסור להמציא לוגו.

אסור לשים טקסט עם שגיאות כתיב.

אסור להשתמש במילים גבוהות מדי או מסובכות.

אסור לשכוח הנעה לפעולה.

אסור שהטקסט ייראה כמו תבנית גנרית או AI זול.

אסור שהמודעה תרגיש כאילו היא פונה לקהל שמחפש מחיר זול, אלא לקהל שיודע להעריך איכות.

CRITICAL FORMATTING REQUIREMENT (DO NOT IGNORE):

The application UI will overlay your text onto real client photos. You MUST output strictly as a JSON object with an "items" array containing exactly ${amountOfGraphics} objects. Do not wrap the JSON in markdown blocks (no \`\`\`json) and do not add any conversational text.

Format exactly like this:

{
  "items": [
    {
      "headline": "הכותרת הראשית כאן",
      "subheadline": "תת הכותרת כאן",
      "cta": "טקסט הנעה לפעולה כאן"
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
  // Model may return either {items:[...]} or a bare array [...]
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
                temperature: 0.7,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: buildSystemPrompt(input) },
                  {
                    role: "user",
                    content: `צור בדיוק ${input.amount} וריאציות שונות זו מזו בזווית ובניסוח. החזר JSON object בפורמט: {"items":[{"headline":"...","subheadline":"...","cta":"..."}]}`,
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
          let items = safeParseItems(raw, input.amount);
          // Pad with defaults if AI returned fewer items than requested
          while (items.length < input.amount) {
            items.push({
              headline: input.clientName || "העסק שלך",
              subheadline: input.text || input.brandVibe || "",
              cta: "לפרטים נוספים",
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
