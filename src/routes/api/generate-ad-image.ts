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

const artDirectorSuffix = `
Style: High-end commercial photography, ultra-realistic, 8k resolution.
Camera & Lighting: Cinematic lighting, volumetric light, dramatic side-lighting. Shot on 85mm lens or macro lens, shallow depth of field, sharp focus on the main subject with a beautiful bokeh background.
Composition: Clean, uncluttered, minimalist composition. Square 1:1 framing. Must include clear negative space (blank areas) in the top or bottom third to allow for text overlay later.
Negative Constraints: ABSOLUTELY NO TEXT, no fonts, no letters, no words, no numbers, no captions, no watermarks, no logos, no badges, no UI elements, no graphic overlays. No plastic look, no cheap 3D render feel, no overly busy backgrounds.
`;

function buildPrompt(input: Input, hasPhotos: boolean, hasRefs: boolean) {
  const industry = input.clientIndustry || "לא צוין";
  const audience = input.targetAudience || "קהל רחב";
  const vibe = input.brandVibe || "פרימיום ומודרני";
  const colors = input.brandColors.length
    ? input.brandColors.join(", ")
    : "פלטת ניטרלים אלגנטית";
  const brief =
    input.designBrief ||
    "צילום פרימיום נקי של הסובייקט המרכזי, אור רך ודרמטי, שטח ריק נדיב בשליש התחתון.";

  const businessBlock = `תחום העסק: ${industry}
קהל יעד: ${audience}
אטמוספירה וטון ויזואלי: ${vibe}
פלטת צבעים להישען עליה (כצבעי אור, חומרים ורקע — לא כטקסט או גרפיקה): ${colors}
בריף צילומי לתמונה הזו בלבד:
${brief}`;

  let imagesBlock = "";
  if (hasPhotos && hasRefs) {
    imagesBlock = `שימוש בתמונות:
התמונות הראשונות המצורפות הן צילומים אמיתיים של העסק — אפשר להשתמש באחת, בכמה או בכולן כבסיס לסובייקט. אל תעוות פנים, מזון או מוצרים.
התמונות האחרונות המצורפות הן רפרנסים ויזואליים בלבד — קח מהן את איכות האור, פלטת הצבעים, החומרים והקומפוזיציה. התעלם לחלוטין מכל טקסט, כותרת, באדג' או אלמנט גרפי שמופיע בהן ואל תשחזר אותם.`;
  } else if (hasPhotos) {
    imagesBlock = `שימוש בתמונות:
התמונות המצורפות הן צילומים אמיתיים של העסק — אפשר להשתמש באחת, בכמה או בכולן כבסיס לסובייקט. אל תעוות פנים, מזון או מוצרים.`;
  } else if (hasRefs) {
    imagesBlock = `שימוש בתמונות:
התמונות המצורפות הן רפרנסים ויזואליים בלבד — קח מהן את איכות האור, פלטת הצבעים, החומרים והקומפוזיציה. התעלם לחלוטין מכל טקסט, כותרת, באדג' או אלמנט גרפי שמופיע בהן ואל תשחזר אותם.`;
  } else {
    imagesBlock = `שימוש בתמונות:
אין צילומים מצורפים — הרכב צילום מקורי, אמיתי ופרימיום שמתאים לתחום העסק, בלי לוגואים ובלי אלמנטים גרפיים.`;
  }

  const baseUserDescription = `צלם תמונה מרובעת 1:1 אחת בלבד, ללא שום טקסט, שתשמש כרקע למודעה ממומנת.
זו תמונה בלבד — הטקסט השיווקי יולבש עליה מאוחר יותר בממשק, ולכן אסור לך לצייר או לרנדר אף מילה.

${businessBlock}

${imagesBlock}`;

  return `${baseUserDescription}. ${artDirectorSuffix}`;
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
