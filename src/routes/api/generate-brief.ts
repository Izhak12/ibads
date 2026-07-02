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

const SYSTEM_PROMPT = `אתה סטרטג שיווקי בכיר ומנהל קריאייטיב בסוכנות פרימיום. תפקידך לכתוב אפיון קריאייטיבי (Creative Brief) עשיר, מפורט ומדויק, בעברית, שישמש כקלט למודל יצירת תמונות (DALL·E / GPT-Image).

הפלט חייב להיות:
- טקסט חופשי בעברית (ללא JSON, ללא code fences).
- מובנה עם כותרות ברורות המסומנות ב-** ** (Markdown light).
- קונקרטי ויזואלית: תיאורי סצנה, קומפוזיציה, תאורה, טיפוגרפיה, מרקמים, מצלמה/פרספקטיבה, פלטת צבע מדויקת.
- כולל את הסעיפים הבאים בסדר הזה:
  1. **תמצית המותג** — מהות, ערך, בידול.
  2. **קהל היעד וההבנה שלו** — דמוגרפיה, פסיכוגרפיה, כאבים ורצונות.
  3. **שפה ויזואלית** — סגנון, השראה (movements/references), מצב רוח.
  4. **פלטת צבעים** — צבעים ספציפיים (HEX אם קיים) עם תפקיד לכל אחד.
  5. **טיפוגרפיה וטון קופי** — משפחות פונטים מומלצות ודוגמאות טון.
  6. **קומפוזיציה ופורמט** — layout, מרווחים, ריכוז המבט, ריק חיובי.
  7. **תאורה, מרקם ומצלמה** — mood lighting, textures, camera angle.
  8. **מוטיבים ויזואליים מומלצים** — 3-4 רעיונות קונקרטיים לתמונה בודדת.
  9. **Do's & Don'ts** — מה כן ומה לא, קצר וממוקד.

אל תוסיף הקדמות, סיכומים או הערות מטא — רק את האפיון עצמו.`;

function buildUserPrompt(input: z.infer<typeof InputSchema>) {
  return [
    `להלן פרטי הלקוח. כתוב אפיון קריאייטיבי מקיף על סמך המידע הזה:`,
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
                model: "google/gemini-2.5-pro",
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
