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
});

type Input = z.infer<typeof InputSchema>;

function buildPrompt(input: Input, hasPhotos: boolean) {
  const clientName = input.clientName || "unspecified";
  const industry = input.clientIndustry || "unspecified";
  const audience = input.targetAudience || "general";
  const vibe = input.brandVibe || "premium and modern";
  const colors = input.brandColors.length ? input.brandColors.join(", ") : "elegant neutral palette";
  const brief =
    input.designBrief ||
    "Premium editorial square ad with a clear hero photo area and a clean typographic block. Generous whitespace, luxury feel.";
  const photoLine = hasPhotos
    ? "Use the attached real photos of the business as the visual foundation of the design (crop, frame or collage them elegantly — do not distort faces or food)."
    : "Compose a premium editorial layout appropriate to the business (no invented logos or photos of real people).";

  return `Design a premium, high-converting square (1:1) Facebook/Instagram ad for the following business.

Business: ${clientName} — ${industry}. Target audience: ${audience}. Brand vibe: ${vibe}. Brand colors to use: ${colors}.

Visual concept: ${brief}

${photoLine}

The ad MUST include the following Hebrew text, rendered EXACTLY letter-for-letter with correct right-to-left Hebrew spelling, no typos, no invented words:

- Main headline (largest, bold): '${input.headline}'

- Subheadline (smaller, supporting): '${input.subheadline}'

- CTA button (clearly styled as a button): '${input.cta}'

Design rules: clean visual hierarchy, generous margins, professional typography, luxury feel — NOT cheap or generic. Do not invent a logo or a business name. Do not add any other text. Text must be perfectly legible against the background.`;
}

async function fetchAsBlob(url: string): Promise<{ blob: Blob; filename: string } | null> {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "image/png";
    const buf = await r.arrayBuffer();
    const ext = ct.includes("jpeg") || ct.includes("jpg") ? "jpg" : ct.includes("webp") ? "webp" : "png";
    return { blob: new Blob([buf], { type: ct }), filename: `photo.${ext}` };
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
      model: "gpt-image-1",
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
        const prompt = buildPrompt(input, assetUrls.length > 0);

        try {
          let res: Response;
          if (assetUrls.length > 0) {
            const photos = (await Promise.all(assetUrls.map(fetchAsBlob))).filter(
              (p): p is { blob: Blob; filename: string } => p !== null,
            );
            if (photos.length === 0) {
              res = await callGenerations(apiKey, prompt);
            } else {
              const fd = new FormData();
              fd.append("model", "gpt-image-1");
              fd.append("prompt", prompt);
              fd.append("size", "1024x1024");
              fd.append("quality", "high");
              fd.append("n", "1");
              for (const p of photos) {
                fd.append("image[]", p.blob, p.filename);
              }
              res = await fetch("https://api.openai.com/v1/images/edits", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}` },
                body: fd,
              });
              // Fallback if edits fails (e.g. org not verified for gpt-image-1 edits)
              if (!res.ok) {
                console.warn(
                  `[generate-ad-image] images/edits failed (${res.status}); falling back to generations`,
                );
                res = await callGenerations(apiKey, prompt);
              }
            }
          } else {
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
