
import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export const aiConfigured =
  Boolean(env.aiApiKey) &&
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

type OllamaMessage = {
  role: string;
  content: string;
  tool_name?: string;
  tool_calls?: Array<{
    function: {
      name: string;
      arguments: unknown;
    };
  }>;
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

  const messages: OllamaMessage[] = [
    { role: "system", content: opts.system },
  ];

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

  for (const message of opts.messages) {
    const blocks = Array.isArray(message.content)
      ? message.content
      : [{ type: "text" as const, text: message.content }];

    const textParts: string[] = [];
    const toolCalls: NonNullable<OllamaMessage["tool_calls"]> = [];

    for (const block of blocks) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "image") {
        textParts.push(`[Image URL: ${block.source.url}]`);
      } else if (block.type === "tool_use") {
        toolCalls.push({
          function: {
            name: block.name,
            arguments: block.input ?? {},
          },
        });
      } else if (block.type === "tool_result") {
        const name = toolNames.get(block.tool_use_id);

        if (!name) {
          throw new AppError(
            400,
            "Could not match AI tool result to its tool call"
          );
        }

        messages.push({
          role: "tool",
          tool_name: name,
          content: block.content,
        });
      }
    }

    if (textParts.length || toolCalls.length) {
      const item: OllamaMessage = {
        role: message.role,
        content: textParts.join("\n"),
      };

      if (toolCalls.length) {
        item.tool_calls = toolCalls;
      }

      messages.push(item);
    }
  }

  const tools = opts.tools?.map((tool) => ({
    type: "function",
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  }));

  let response: Response;

  try {
    response = await fetch("https://ollama.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify({
        model: env.aiModel,
        messages,
        stream: false,
        ...(tools?.length ? { tools } : {}),
        options: {
          num_predict: opts.maxTokens ?? 800,
        },
      }),
      signal: AbortSignal.timeout(120000),
    });
  } catch (error) {
    console.error("Ollama Cloud request failed:", error);
    throw new AppError(
      502,
      "SafeStay AI is temporarily unavailable"
    );
  }

  if (!response.ok) {
    const details = await response.text();
    console.error("Ollama Cloud API error:", response.status, details);

    throw new AppError(
      502,
      "SafeStay AI is temporarily unavailable"
    );
  }

  const data = (await response.json()) as {
    message?: {
      content?: string;
      tool_calls?: Array<{
        function: {
          name: string;
          arguments: unknown;
        };
      }>;
    };
  };

  if (!data.message) {
    throw new AppError(502, "Ollama returned an empty response");
  }

  const content: ContentBlock[] = [];

  if (data.message.content) {
    content.push({
      type: "text",
      text: data.message.content,
    });
  }

  for (const [index, call] of (
    data.message.tool_calls ?? []
  ).entries()) {
    content.push({
      type: "tool_use",
      id: `ollama_${Date.now()}_${index}`,
      name: call.function.name,
      input: call.function.arguments ?? {},
    });
  }

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
