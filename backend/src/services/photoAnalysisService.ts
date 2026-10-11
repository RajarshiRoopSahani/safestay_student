import { z } from "zod";
import { AppError } from "../middleware/errorHandler";
import { aiConfigured, callClaude, textOf } from "./aiClient";

const resultSchema = z.object({
  observations: z.array(z.string().trim().min(3).max(200)).max(4),
  privacyConcern: z.boolean().default(false),
});

const SYSTEM_PROMPT = `You describe what is visibly shown in a photo of student accommodation (a room, bathroom, building, corridor, furniture or surroundings).

Rules:
- Describe only what is clearly visible. Use cautious wording such as "Possible ..." or "The photo appears to show ...".
- You may mention things such as possible dirt or stains, possible water damage or dampness, possible damaged or broken furniture, possible wall damage, poor lighting, or clutter.
- Never make claims about safety, crime, health risk, legal compliance, or the quality of the whole property. A photo shows one moment and one angle.
- Do not describe or identify any person. If people, faces, ID cards, documents or phone numbers are visible, set privacyConcern to true.
- If nothing notable is visible, return one observation: "No notable issues visible in this photo."
- Return ONLY JSON in exactly this shape, with no other text: {"observations": ["..."], "privacyConcern": false}
- Maximum 4 observations, each under 150 characters.`;

// Defense in depth: drop any line that makes safety, crime, health or legal claims.
const FORBIDDEN = /\b(safe|unsafe|dangerous|crime|criminal|illegal|unlawful|toxic|hazard|hazardous|disease|infection|health risk)\b/i;

export type PhotoAnalysis = { observations: string; privacyConcern: boolean };

export async function analyzePhotoUrl(url: string): Promise<PhotoAnalysis> {
  if (!aiConfigured) throw new AppError(503, "SafeStay AI is not configured yet");

  const resp = await callClaude({
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "url", url } },
          { type: "text", text: "Describe the visible condition in this photo." },
        ],
      },
    ],
    maxTokens: 400,
  });

  const raw = textOf(resp.content).replace(/```json|```/g, "").trim();

  let parsed: z.infer<typeof resultSchema>;
  try {
    parsed = resultSchema.parse(JSON.parse(raw));
  } catch {
    throw new AppError(502, "The AI response could not be read. Please try again.");
  }

  const lines = parsed.observations
    .map((o) => o.replace(/\s+/g, " ").trim())
    .filter((o) => o.length > 0 && !FORBIDDEN.test(o));

  const observations = (lines.length > 0 ? lines : ["No notable issues visible in this photo."]).join("\n").slice(0, 600);

  return { observations, privacyConcern: parsed.privacyConcern };
}
