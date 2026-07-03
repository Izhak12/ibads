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

function buildPrompt(input: Input) {
  const ctx: string[] = [];
  if (input.clientName) ctx.push(`שם העסק: ${input.clientName}`);
  if (input.clientIndustry) ctx.push(`תחום: ${input.clientIndustry}`);
  if (input.targetAudience) ctx.push(`קהל יעד: ${input.targetAudience}`);
  if (input.brandVibe) ctx.push(`טון וסגנון: ${input.brandVibe}`);
  if (input.brief) ctx.push(`בריף:\n${input.brief}`);
  if (input.text) ctx.push(`רעיון/טקסט מנחה מהמשתמש: ${input.text}`);

  return `אתה קופירייטר בכיר לפרסומות ברשתות חברתיות בעברית.
המשימה: לייצר ${input.amount} וריאציות טקסט שונות לגרפיקה של מודעה בפורמט מרובע (1080x1080) המיועד ל-Meta Ads.
כל וריאציה צריכה להכיל שלושה שדות:
- headline: כותרת ראשית קצרה, חדה, מושכת עין (2-6 מילים).
- subheadline: משפט תמיכה אחד, מוסיף ערך/הבטחה/פרט (עד 12 מילים).
- cta: כפתור קריאה לפעולה קצר מאוד (1-3 מילים, לדוגמה: "לפרטים נוספים", "הזמינו עכשיו", "דברו איתנו").

חובה: כל הטקסטים בעברית תקנית, ללא אימוג'ים, ללא סימני פיסוק מיותרים, ללא #hashtags, ללא גרשיים בתוך הטקסטים.
כל וריאציה חייבת להיות שונה בזווית ובניסוח מהאחרות (הצעת ערך שונה / כאב שונה / רגש שונה).

הקשר הלקוח:
${ctx.join("\n")}

החזר JSON בלבד בפורמט הבא, ללא טקסט נוסף:
{"items":[{"headline":"...","subheadline":"...","cta":"..."}]}
עם בדיוק ${input.amount} פריטים במערך items.`;
}

function safeParseItems(raw: string, amount: number): GraphicText[] {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as { items?: unknown };
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const norm: GraphicText[] = items.slice(0, amount).map((it) => {
    const o = (it ?? {}) as Record<string, unknown>;
    return {
      headline: String(o.headline ?? "").trim(),
      subheadline: String(o.subheadline ?? "").trim(),
      cta: String(o.cta ?? "").trim() || "לפרטים נוספים",
    };
  });
  return norm;
}

export const Route = createFileRoute("/api/generate-graphics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "LOVABLE_API_KEY is not configured" },
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
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "system",
                    content:
                      "You are a senior Hebrew copywriter. Reply with valid JSON only. Never wrap in code fences.",
                  },
                  { role: "user", content: buildPrompt(input) },
                ],
                temperature: 0.9,
              }),
            },
          );
          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 402 || res.status === 429 ? res.status : 500;
            return Response.json({ error: `AI Gateway ${res.status}: ${text}` }, { status });
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
