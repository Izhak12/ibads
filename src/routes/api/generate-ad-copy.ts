import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  clientName: z.string().optional().default(""),
  clientBrief: z.string().optional().default(""),
  graphicHeadline: z.string().min(1),
  graphicSubheadline: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
});

type Input = z.infer<typeof InputSchema>;

function buildSystemPrompt(input: Input) {
  const clientBrief =
    [
      input.clientBrief,
      input.clientName && `שם עסק: ${input.clientName}`,
      input.clientIndustry && `תחום: ${input.clientIndustry}`,
      input.targetAudience && `קהל יעד: ${input.targetAudience}`,
      input.brandVibe && `טון וסגנון: ${input.brandVibe}`,
    ]
      .filter(Boolean)
      .join("\n") || "לא צוין";
  const graphicHeadline = input.graphicHeadline;

  return `אתה קופירייטר Direct Response מומחה, שכותב מודעות פייסבוק ארוכות ומומרות. המטרה שלך היא לכתוב קופי אותנטי, ישיר, ואנושי (5 עד 10 שורות).

הקשר: כותרת הגרפיקה היא '${graphicHeadline}'. הבריף: '${clientBrief}'.

מבנה הקופי (Primary Text):

1. הוק (Hook): משפט פתיחה ישיר שמדבר על סיטואציה או כאב אמיתי של הלקוח.

2. הגשר/הבעיה: למה הפתרונות הרגילים בשוק לא מספיקים (למשל, קייטרינג תעשייתי משעמם).

3. הפתרון: מה אנחנו מציעים ולמה זה ברמה אחרת.

4. בולטים (Bullets): 2-3 יתרונות קונקרטיים (לא סיסמאות).

5. הנעה לפעולה (CTA): ברורה וישירה בסוף הטקסט.

רשימה שחורה (איסור מוחלט על שימוש במילים אלו - סכנת פסילה):

'חוויה קולינרית', 'קסום', 'חלום', 'פינוק', 'בלתי נשכח', 'מדהים', 'מרגש', 'מסע קולינרי'.

כתוב בשפה טבעית, אותנטית, כמו מקצוען שמדבר בגובה העיניים אבל ממשדר פרימיום וניסיון עשיר. אסור להישמע כמו סוכן מכירות רובוטי.

CRITICAL FORMAT: Return ONLY a JSON object (no markdown).

{
  "primary_text": "הקופי הארוך עם ירידות שורה (\\n)",
  "link_headline": "כותרת ממומן קצרה וחזקה ליד הכפתור (עד 5 מילים)"
}`;
}

function safeParse(raw: string): { primaryText: string; linkHeadline: string } {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    const o = JSON.parse(cleaned) as Record<string, unknown>;
    return {
      primaryText: String(o.primary_text ?? o.primaryText ?? "").trim(),
      linkHeadline: String(o.link_headline ?? o.linkHeadline ?? "").trim(),
    };
  } catch {
    return { primaryText: cleaned, linkHeadline: "" };
  }
}

export const Route = createFileRoute("/api/generate-ad-copy")({
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
                    content: `כתוב קופי מודעה אחד לפי המבנה, על בסיס הכותרת '${input.graphicHeadline}'${input.graphicSubheadline ? ` והתת-כותרת '${input.graphicSubheadline}'` : ""}. החזר JSON בפורמט {"primary_text":"...","link_headline":"..."}.`,
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
          const parsed = safeParse(raw);
          if (!parsed.primaryText) {
            return Response.json(
              { error: "AI returned empty copy" },
              { status: 500 },
            );
          }
          return Response.json(parsed);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
