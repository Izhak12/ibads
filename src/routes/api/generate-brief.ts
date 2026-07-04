import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  name: z.string().min(1),
  industry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
  coreOffers: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
});

const SYSTEM_PROMPT = `אתה סטרטג שיווקי בכיר. תפקידך לכתוב בריף שיווקי קומפקטי בעברית (150–250 מילים בלבד) שישמש כמקור עובדות ומסרים ליצירת מודעות ממומנות.

הפלט חייב להיות טקסט חופשי בעברית (ללא JSON, ללא code fences, ללא הקדמות או סיכומים), מובנה עם כותרות בפורמט **כותרת** בסדר הזה בדיוק:

1. **מהות העסק והבידול** — 2–3 משפטים: מה העסק עושה בפועל ולמה הוא שונה.
2. **מה העסק מוכר** — רשימת מוצרים/שירותים קונקרטית, אך ורק מתוך המידע שסופק ב-coreOffers. אל תמציא מנות, שירותים או מחירים.
3. **קהל היעד** — מי הם + 2–3 כאבים/רצונות מרכזיים.
4. **USPs** — 3–5 ביטויים קצרים וחדים (2–4 מילים כל אחד) שמתאימים כלייבלים לאייקונים במודעה. דוגמאות בסגנון: "שפית מקצועית באירוע", "תפריט עשיר ומגוון". פורמט: רשימה עם מקפים.
5. **זוויות מסר** — 3–5 hooks מובחנים למודעות (רגשי, FOMO, social proof, פרימיום, פרקטי וכד'). כל זווית בשורה אחת קצרה עם מקף.
6. **טון דיבור** — 1–2 משפטים.
7. **ממה להימנע** — מילים, טענות או וייבים אסורים למותג הזה.

חוקי גראונדינג קריטיים:
- השתמש אך ורק בעובדות שסופקו. אסור להמציא מנות, שירותים, מחירים, ביקורות או נתונים. אם מידע חסר — פשוט השמט את השורה.
- אל תכתוב שום הנחיות ויזואליות — לא פונטים, לא תאורה, לא קומפוזיציה, לא צבעים ולא מוטיבים. אלה נקבעים בשלב אחר.
- אל תוסיף הקדמות, סיכומים, הערות מטא או המלצות עיצוב — רק את שבע הכותרות לעיל.`;

function buildUserPrompt(input: z.infer<typeof InputSchema>) {
  return [
    `להלן פרטי הלקוח. כתוב בריף שיווקי קומפקטי על סמך המידע הזה בלבד:`,
    ``,
    `**שם עסק:** ${input.name}`,
    `**תחום / נישה:** ${input.industry || "לא צוין"}`,
    `**קהל יעד:** ${input.targetAudience || "לא צוין"}`,
    `**ווייב מותג / טון:** ${input.brandVibe || "לא צוין"}`,
    `**מוצרים / הצעות ליבה:** ${input.coreOffers || "לא צוין"}`,
    `**צבעי מותג:** ${input.brandColors.length ? input.brandColors.join(", ") : "לא צוינו"}`,
  ].join("\n");
}

export const Route = createFileRoute("/api/generate-brief")({
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

        let input: z.infer<typeof InputSchema>;
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
              }),
            },
          );

          if (!res.ok) {
            const text = await res.text();
            if (res.status === 429) {
              return Response.json(
                { error: "יותר מדי בקשות. נסה שוב בעוד רגע." },
                { status: 429 },
              );
            }
            if (res.status === 402) {
              return Response.json(
                { error: "אזלו הקרדיטים ליצירת אפיון." },
                { status: 402 },
              );
            }
            return Response.json(
              { error: `AI Gateway ${res.status}: ${text}` },
              { status: 500 },
            );
          }

          const json = (await res.json()) as {
            choices: Array<{ message: { content: string } }>;
          };
          const brief = json.choices?.[0]?.message?.content?.trim() ?? "";
          return Response.json({ brief });
        } catch (err) {
          return Response.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
          );
        }
      },
    },
  },
});
