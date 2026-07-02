import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const InputSchema = z.object({
  clientName: z.string().optional().default(""),
  clientIndustry: z.string().optional().default(""),
  targetAudience: z.string().optional().default(""),
  brandColors: z.array(z.string()).optional().default([]),
  text: z.string().optional().default(""),
  brief: z.string().optional().default(""),
  amount: z.number().int().min(1).max(10),
});

function buildPrompt(input: z.infer<typeof InputSchema>, variant: number) {
  const parts: string[] = [];
  parts.push(
    "Premium, modern marketing graphic. Clean, Apple-inspired minimal aesthetic, high production value, sharp typography if any text is present. Square 1:1 composition."
  );
  if (input.clientName) parts.push(`Brand: ${input.clientName}.`);
  if (input.clientIndustry) parts.push(`Industry: ${input.clientIndustry}.`);
  if (input.targetAudience) parts.push(`Target audience: ${input.targetAudience}.`);
  if (input.brandColors.length)
    parts.push(`Brand color palette: ${input.brandColors.join(", ")}.`);
  if (input.brief) parts.push(`Creative brief: ${input.brief}.`);
  if (input.text) parts.push(`Include this exact Hebrew text prominently: "${input.text}".`);
  parts.push(`Design variation ${variant} — unique composition, colors and layout from other variants.`);
  return parts.join(" ");
}

async function generateOne(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text}`);
  }
  const json = (await res.json()) as { data: Array<{ url: string }> };
  return json.data[0].url;
}

export const Route = createFileRoute("/api/generate-graphics")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return Response.json(
            { error: "OPENAI_API_KEY is not configured" },
            { status: 500 }
          );
        }
        let input: z.infer<typeof InputSchema>;
        try {
          input = InputSchema.parse(await request.json());
        } catch (err) {
          return Response.json(
            { error: "Invalid input", details: String(err) },
            { status: 400 }
          );
        }

        try {
          const prompts = Array.from({ length: input.amount }, (_, i) =>
            buildPrompt(input, i + 1)
          );
          const images = await Promise.all(
            prompts.map((p) => generateOne(p, apiKey))
          );
          return Response.json({ images });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          const status = /401/.test(message)
            ? 401
            : /429/.test(message)
              ? 429
              : 500;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
