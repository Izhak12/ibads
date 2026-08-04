import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  clientName: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
  brief: z.string().optional().default(""),
});

type Input = z.infer<typeof InputSchema>;

export type DesignSystem = {
  colors: string[];
  headlineFont: string;
  ctaStyle: string;
};

function buildPrompt(input: Input) {
  const details = [
    input.clientName && `שם עסק: ${input.clientName}`,
    input.clientIndustry && `תחום: ${input.clientIndustry}`,
    input.targetAudience && `קהל יעד: ${input.targetAudience}`,
    input.brandVibe && `טון וסגנון מותג: ${input.brandVibe}`,
    input.brandColors.length && `צבעי מותג קיימים: ${input.brandColors.join(", ")}`,
    input.brief && `בריף: ${input.brief}`,
  ]
    .filter(Boolean)
    .join("\n") || "לא צוין";

  return `אתה מעצב מותג בכיר. עליך לקבוע מערכת עיצוב אחת קבועה (system_design) שתשמש את כל הגרפיקות של העסק הזה מעכשיו והלאה, כדי לשמור זהות ויזואלית עקבית.

פרטי העסק:
${details}

כללים:
- "colors": 2-3 צבעים מדויקים בקוד הקס בלבד (למשל "#0B192C"). לא תיאורים כלליים כמו "זהב" או "כחול כהה". אם יש צבעי מותג קיימים — הישאר קרוב אליהם.
- "headlineFont": שם סגנון פונט אחד לכותרת (למשל "סריפי-אלגנטי" או "סאנס-בולד-מודרני").
- "ctaStyle": תיאור קצר של סגנון כפתור ה-CTA — צורה, מילוי מלא או קונטור, וקונטרסט גבוה מובטח מול הרקע.

החזר JSON object בלבד בפורמט:
{"colors":["#XXXXXX","#XXXXXX"],"headlineFont":"...","ctaStyle":"..."}`;
}

export const Route = createFileRoute("/api/generate-design-system")({
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
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o",
              temperature: 0.5,
              response_format: { type: "json_object" },
              messages: [{ role: "user", content: buildPrompt(input) }],
            }),
          });
          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 402 || res.status === 429 ? res.status : 500;
            return Response.json({ error: `OpenAI ${res.status}: ${text}` }, { status });
          }
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const raw = json.choices?.[0]?.message?.content ?? "{}";
          const parsed = JSON.parse(raw) as Record<string, unknown>;
          const colorsRaw = Array.isArray(parsed.colors) ? parsed.colors : [];
          const colors = colorsRaw
            .map((c) => String(c).trim())
            .filter((c) => /^#[0-9a-fA-F]{6}$/.test(c))
            .slice(0, 3);
          const designSystem: DesignSystem = {
            colors: colors.length
              ? colors
              : input.brandColors.slice(0, 3).length
                ? input.brandColors.slice(0, 3)
                : ["#0B192C", "#1E67FF"],
            headlineFont: String(parsed.headlineFont ?? "").trim() || "סאנס-בולד-מודרני",
            ctaStyle:
              String(parsed.ctaStyle ?? "").trim() ||
              "כפתור מלבני עם פינות מעוגלות, מילוי מלא בצבע האקסנט, טקסט בקונטרסט גבוה מול הרקע",
          };
          return Response.json({ designSystem });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
