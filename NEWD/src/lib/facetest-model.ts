import { groqConfigured, groqFetch } from "@/lib/groq-failover";

const openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
const openRouterModel = "deepseek/deepseek-v4-flash-0731:nitro";
const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
const groqModel = "openai/gpt-oss-20b";

type Message = { role: "system" | "user" | "assistant"; content: string };

export function facetestModelConfigured() {
  return Boolean(String(process.env.FACETEST_OPENROUTER_API_KEY || "").trim()) || groqConfigured();
}

export async function facetestModelFetch(messages: Message[], temperature = 0.58, maxTokens = 140) {
  const key = String(process.env.FACETEST_OPENROUTER_API_KEY || "").trim();
  if (key) {
    try {
      const response = await fetch(openRouterUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://adamcagle.com/",
          "X-Title": "Adam Cagle Portfolio - ACE",
        },
        body: JSON.stringify({
          model: openRouterModel,
          messages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          reasoning: { enabled: false, exclude: true },
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.ok && response.body) {
        return { response, provider: "openrouter", model: openRouterModel };
      }
      await response.body?.cancel().catch(() => undefined);
    } catch {
      // The configured Groq model is the deliberate failover path.
    }
  }

  if (!groqConfigured()) throw new Error("facetest-model-not-configured");
  const result = await groqFetch(groqUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: groqModel,
      messages,
      stream: true,
      temperature,
      max_completion_tokens: maxTokens,
    }),
  });
  if (result.allQuotaExhausted) throw new Error("groq-quota-exhausted");
  return { response: result.response, provider: "groq", model: groqModel, groqSlot: result.slot };
}

export async function readModelText(response: Response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    const payload = await response.json().catch(() => ({})) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content || "";
  }

  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    pending += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") continue;
      try {
        const event = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
        text += event.choices?.[0]?.delta?.content || "";
      } catch {
        // Ignore non-content stream events.
      }
    }
    if (done) break;
  }
  return text;
}
