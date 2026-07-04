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
  const brandColors = input.brandColors.length ? input.brandColors.join(", ") : "not specified";
  const amountOfGraphics = input.amount;

  return `אתה קופיריטר וגרפיקאי בכיר לקריאייטיבים ממומנים, וגם ארט־דירקטור שכותב בריפים ויזואליים באנגלית.

המשימה: לייצר ${amountOfGraphics} קונספטים מובחנים לחלוטין לגרפיקה מרובעת 1:1 עבור:
שם העסק: ${clientName}
בריף / תחום / קהל / טון: ${clientBrief}
צבעי מותג: ${brandColors}
טקסט חובה על הגרפיקה (אם צוין): ${optionalText}

לכל קונספט אתה מחזיר 4 שדות:
1. headline (עברית) – כותרת קצרה, חדה, שיווקית, בלי שגיאות.
2. subheadline (עברית) – משפט תמיכה שמסביר את הערך.
3. cta (עברית) – הנעה לפעולה ברורה (למשל "לפרטים והזמנות", "השאירו פרטים").
4. designBrief (ENGLISH, 2-4 sentences) – a rich art-direction brief for THIS specific ad only. Must describe: composition & layout, mood/emotion, exactly how to use the brand colors (${brandColors}), typography style, and where/how the real client photo appears (hero crop, collage, framed inset, etc.). Every concept in the batch must be VISUALLY DISTINCT from the others – different composition, different mood, different photo treatment. No two designBriefs may describe the same layout.

חוקים:
- אסור להמציא שם עסק או לוגו.
- אסור טקסט עברי עם שגיאות.
- אסור טון זול / הנחות / קהל מחפש מחיר. הטון תמיד יוקרתי־נגיש.
- כל קונספט מרגיש כמו מודעת פרימיום, לא תבנית AI.

פורמט פלט:
JSON object בלבד, בלי markdown ובלי טקסט נלווה, בצורה הבאה:
{
  "items": [
    { "headline": "…", "subheadline": "…", "cta": "…", "designBrief": "…" }
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
                temperature: 0.9,
                response_format: { type: "json_object" },
                messages: [
                  { role: "system", content: buildSystemPrompt(input) },
                  {
                    role: "user",
                    content: `צור בדיוק ${input.amount} וריאציות שונות זו מזו – כל אחת עם designBrief באנגלית שמתאר קונספט ויזואלי ייחודי. החזר JSON object בפורמט: {"items":[{"headline":"...","subheadline":"...","cta":"...","designBrief":"..."}]}`,
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
                "Premium square social ad. Elegant editorial layout with the client photo as a large hero on one half and a clean typographic block on the other. Use the brand colors as accents on a neutral background. Modern sans-serif Hebrew typography, generous whitespace, luxury feel.",
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
