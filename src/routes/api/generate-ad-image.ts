import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  headline: z.string(),
  subheadline: z.string().optional().default(""),
  cta: z.string(),
  designBrief: z.string().optional().default(""),
  clientName: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandVibe: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
  assetUrls: z.array(z.string()).optional().default([]),
  referenceUrls: z.array(z.string()).optional().default([]),
});

type Input = z.infer<typeof InputSchema>;

function buildPrompt(input: Input, hasPhotos: boolean, hasRefs: boolean) {
  const clientName = input.clientName || "לא צוין";
  const industry = input.clientIndustry || "לא צוין";
  const audience = input.targetAudience || "קהל רחב";
  const vibe = input.brandVibe || "פרימיום ומודרני";
  const colors = input.brandColors.length
    ? input.brandColors.join(", ")
    : "פלטת ניטרלים אלגנטית";
  const brief =
    input.designBrief ||
    "מודעה מרובעת פרימיום עם היררכיה טיפוגרפית ברורה, שטחים לבנים נדיבים ותחושת יוקרה.";

  let imagesLine = "";
  if (hasPhotos && hasRefs) {
    imagesLine =
      "התמונות הראשונות המצורפות הן צילומים אמיתיים של העסק — השתמש בהן כתוכן הצילומי של המודעה (חתוך, מסגר או שלב אותן באלגנטיות, בלי לעוות פנים או מזון). התמונות האחרונות המצורפות הן דוגמאות סטייל של מודעות מוגמרות — העתק מהן את שפת העיצוב, צפיפות הלייאאוט, סגנון הטיפוגרפיה, באדג'ים, אלמנטים דקורטיביים וגימור כללי, אך אל תעתיק את הטקסטים שלהן ולא את הצילומים שלהן.";
  } else if (hasPhotos) {
    imagesLine =
      "התמונות המצורפות הן צילומים אמיתיים של העסק — השתמש בהן כתוכן הצילומי של המודעה (חתוך, מסגר או שלב אותן באלגנטיות, בלי לעוות פנים או מזון).";
  } else if (hasRefs) {
    imagesLine =
      "התמונות המצורפות הן דוגמאות סטייל של מודעות מוגמרות בלבד — העתק מהן את שפת העיצוב, צפיפות הלייאאוט, סגנון הטיפוגרפיה, באדג'ים, אלמנטים דקורטיביים וגימור כללי, אך אל תעתיק את הטקסטים שלהן ולא את הצילומים שלהן. הרכב לייאאוט מקורי מתאים לעסק, בלי להמציא לוגו או שם עסק.";
  } else {
    imagesLine =
      "הרכב לייאאוט אדיטוריאלי פרימיום שמתאים לעסק (בלי להמציא לוגואים או צילומים של אנשים אמיתיים).";
  }

  return `עצב מודעה מרובעת 1:1 באיכות גבוהה במיוחד לפייסבוק/אינסטגרם עבור העסק הבא.

עסק: ${clientName} — ${industry}. קהל יעד: ${audience}. טון וסגנון: ${vibe}. צבעי מותג לשילוב: ${colors}.

קונספט ויזואלי (בריף ארט־דירקטור): ${brief}

${imagesLine}

המודעה חייבת לכלול את הטקסטים הבאים בעברית:
כותרת ראשית (הגדולה, מודגשת): '${input.headline}'
תת־כותרת (קטנה יותר, תומכת): '${input.subheadline}'
כפתור CTA (מעוצב בבירור ככפתור): '${input.cta}'
הטקסטים חייבים להופיע בדיוק אות-באות כפי שנכתבו, בעברית תקינה מימין לשמאל, ללא שגיאות כתיב וללא המצאת מילים.

professional advertising design, clean visual hierarchy, premium finish, no invented logos or business names, no extra text beyond what was specified.`;
}

async function fetchAsBlob(url: string): Promise<{ blob: Blob; filename: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const buf = await r.arrayBuffer();
    const ext = ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : ct.includes("webp") ? "webp" : "png";
    return { blob: new Blob([buf], { type: ct }), filename: `image.${ext}` };
  } catch {
    return null;
  }
}

async function callGenerations(apiKey: string, prompt: string) {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: "1024x1024",
      quality: "high",
      n: 1,
    }),
  });
}

export const Route = createFileRoute("/api/generate-ad-image")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
        }
        let input: Input;
        try {
          input = InputSchema.parse(await request.json());
        } catch (err) {
          return Response.json({ error: "Invalid input", details: String(err) }, { status: 400 });
        }

        const assetUrls = input.assetUrls.slice(0, 3);
        const referenceUrls = input.referenceUrls.slice(0, 3);
        const hasAny = assetUrls.length > 0 || referenceUrls.length > 0;

        try {
          let res: Response;
          if (hasAny) {
            // Order matters: photos first, references last (prompt refers to them as "first" / "last").
            const photos = (await Promise.all(assetUrls.map(fetchAsBlob))).filter(
              (p): p is { blob: Blob; filename: string } => p !== null,
            );
            const refs = (await Promise.all(referenceUrls.map(fetchAsBlob))).filter(
              (p): p is { blob: Blob; filename: string } => p !== null,
            );
            const prompt = buildPrompt(input, photos.length > 0, refs.length > 0);

            if (photos.length === 0 && refs.length === 0) {
              res = await callGenerations(apiKey, prompt);
            } else {
              const fd = new FormData();
              fd.append("model", "gpt-image-2");
              fd.append("prompt", prompt);
              fd.append("size", "1024x1024");
              fd.append("quality", "high");
              fd.append("n", "1");
              for (const p of photos) {
                fd.append("image[]", p.blob, `photo-${p.filename}`);
              }
              for (const r of refs) {
                fd.append("image[]", r.blob, `reference-${r.filename}`);
              }
              res = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}` },
                body: fd,
              });
              // Fallback if edits fails (e.g. org verification required for edits).
              if (!res.ok) {
                console.warn(
                  `[generate-ad-image] images/edits failed (${res.status}); falling back to generations`,
                );
                res = await callGenerations(apiKey, prompt);
              }
            }
          } else {
            const prompt = buildPrompt(input, false, false);
            res = await callGenerations(apiKey, prompt);
          }

          if (!res.ok) {
            const text = await res.text();
            const status = res.status === 402 || res.status === 429 ? res.status : 500;
            return Response.json({ error: `OpenAI ${res.status}: ${text}` }, { status });
          }
          const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
          const b64 = json.data?.[0]?.b64_json;
          if (!b64) {
            return Response.json({ error: "No image returned" }, { status: 500 });
          }
          return Response.json({ b64 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
