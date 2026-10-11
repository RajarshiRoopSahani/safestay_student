
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export const aiConfigured =
  env.aiApiKey !== "" &&
  !/^(your|replace)-/i.test(env.aiApiKey);

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: unknown;
      thoughtSignature?: string;
    }
  | { type: "tool_result"; tool_use_id: string; content: string };

export type AiMessage = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

export type AiTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

type AiResponse = {
  content: ContentBlock[];
  stop_reason: string;
};

export async function callClaude(opts: {
  system: string;
  messages: AiMessage[];
  tools?: AiTool[];
  maxTokens?: number;
}): Promise<AiResponse> {
  if (!aiConfigured) {
    throw new AppError(503, "SafeStay AI is not configured yet");
  }

  const toolNames = new Map<string, string>();

  for (const message of opts.messages) {
    if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === "tool_use") {
          toolNames.set(block.id, block.name);
        }
      }
    }
  }

  const contents = opts.messages.map((message) => {
    const blocks = Array.isArray(message.content)
      ? message.content
      : [{ type: "text" as const, text: message.content }];

    const parts: Record<string, unknown>[] = [];

    for (const block of blocks) {
      if (block.type === "text") {
        parts.push({ text: block.text });
      } else if (block.type === "tool_use") {
        parts.push({
          functionCall: {
            name: block.name,
            args: block.input ?? {},
          },
          ...(block.thoughtSignature
            ? { thoughtSignature: block.thoughtSignature }
            : {}),
        });
      } else if (block.type === "tool_result") {
        const name = toolNames.get(block.tool_use_id);

        if (name) {
          let result: unknown;

          try {
            result = JSON.parse(block.content);
          } catch {
            result = { result: block.content };
          }

          parts.push({
            functionResponse: {
              name,
              response:
                result &&
                typeof result === "object" &&
                !Array.isArray(result)
                  ? result
                  : { result },
            },
          });
        } else {
          parts.push({ text: block.content });
        }
      } else if (block.type === "image") {
        parts.push({ text: `[Image URL: ${block.source.url}]` });
      }
    }

    return {
      role: message.role === "assistant" ? "model" : "user",
      parts,
    };
  });

  const tools = opts.tools?.length
    ? [
        {
          functionDeclarations: opts.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          })),
        },
      ]
    : undefined;

  let response: Response;

  try {
    const model = env.aiModel || "gemini-3.8-flash";
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent`;

    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.aiApiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: opts.system }],
        },
        contents,
        generationConfig: {
          maxOutputTokens: opts.maxTokens ?? 800,
        },
        ...(tools ? { tools } : {}),
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("Gemini request failed:", error);
    console.error("AI model:", env.aiModel);
    throw new AppError(502, "SafeStay AI is temporarily unavailable");
  }

  if (!response.ok) {
    console.error(
      "Gemini API error:",
      response.status,
      await response.text()
    );
    throw new AppError(502, "SafeStay AI is temporarily unavailable");
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      finishReason?: string;
      content?: {
        parts?: Array<{
          text?: string;
          thoughtSignature?: string;
          functionCall?: {
            name: string;
            args?: unknown;
          };
        }>;
      };
    }>;
  };

  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new AppError(502, "Gemini returned an empty response");
  }

  const content: ContentBlock[] = (
    candidate.content?.parts ?? []
  ).flatMap((part, index): ContentBlock[] => {
    const blocks: ContentBlock[] = [];

    if (part.text) {
      blocks.push({ type: "text", text: part.text });
    }

    if (part.functionCall) {
      blocks.push({
        type: "tool_use",
        id: `gemini_${Date.now()}_${index}`,
        name: part.functionCall.name,
        input: part.functionCall.args ?? {},
        ...(part.thoughtSignature
          ? { thoughtSignature: part.thoughtSignature }
          : {}),
      });
    }

    return blocks;
  });

  const hasToolCalls = content.some(
    (block) => block.type === "tool_use"
  );

  return {
    content,
    stop_reason: hasToolCalls ? "tool_use" : "end_turn",
  };
}

export function textOf(blocks: ContentBlock[]): string {
  return blocks
    .filter(
      (block): block is { type: "text"; text: string } =>
        block.type === "text"
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}
