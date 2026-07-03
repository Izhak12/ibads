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

  return `תפקיד ופרסונה (Role):

אתה גרפיקאי בכיר עם 10 שנות ניסיון ביצירת גרפיקות לממומן, ברזולוציה מרובעת, תוך שמירה על כללי ui, היררכיית טקסט, בחירת קופי (טקסט שיווקי) מדויק לקהל היעד וברמה גבוהה במיוחד, ומומחה ביצירת גרפיקות בכל מיני סגנונות שונים.

המשימה וההקשר (Task & Context):

המשימה שלך היא ליצור את הקופי לגרפיקות שונות עבור העסק.

העסק שלי הוא: ${clientName}

בריף מפורט וקהל יעד: ${clientBrief}

טקסט חובה לשילוב (אם קיים): ${optionalText}

סגנון וטון דיבור (Tone & Style):

תשלב את סגנון הדיבור וטון הדיבור בהתאם לקהל היעד, ואתה יכול לנסות כל מיני סגנונות בהתאם לצורך.

גבולות גזרה (Constraints / Rules)

אסור לך לכתוב טקסט עם שגיאות כתיב, אסור לך לשכוח לשים הנעה לפעולה בכל גרפיקה, ואסור לך לעשות היררכיית טקסט לא נכונה שנראית לא מקצועית. אל תשתמש במילים מסובכות עבור קהל יעד סטנדרטי.

אסור לך בשום פנים ואופן להמציא לוגו או שם עסק שלא נתתי לך.

מבנה הפלט (Format):

CRITICAL: You must return ONLY a JSON array containing exactly ${amountOfGraphics} objects. Do not wrap it in markdown blockquotes.

Each object must have these exact keys to construct the graphic:

[
  {
    "headline": "הטקסט המרכזי והבולט",
    "subheadline": "טקסט המשנה",
    "cta": "טקסט קצר לכפתור ההנעה לפעולה"
  }
]`;
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
                  { role: "system", content: SYSTEM_PROMPT },
                  { role: "user", content: buildUserPrompt(input) },
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
