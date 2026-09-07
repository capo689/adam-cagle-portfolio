import {groqConfigured, groqFetch} from "./_groq-failover.mjs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "deepseek/deepseek-v4-flash-0731:nitro";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_FALLBACK_MODEL = "openai/gpt-oss-20b";

function openRouterKey() {
  return String(process.env.FACETEST_OPENROUTER_API_KEY || "").trim();
}

export function facetestModelConfigured() {
  return Boolean(openRouterKey()) || groqConfigured();
}

export async function facetestModelFetch(messages, {temperature = 0.7, maxTokens = 160} = {}) {
  const key = openRouterKey();

  if (key) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://adamcagle.com/FACETEST/",
          "X-Title": "Adam Cagle Portfolio - FACETEST"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages,
          stream: true,
          temperature,
          max_tokens: maxTokens,
          reasoning: {enabled: false, exclude: true}
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok && response.body) {
        return {response, provider: "openrouter", model: OPENROUTER_MODEL};
      }

      const detail = await response.text().catch(() => "");
      console.warn("OpenRouter FACETEST request failed; trying Groq", response.status, detail.slice(0, 500));
    } catch (error) {
      console.warn("OpenRouter FACETEST request failed; trying Groq", error instanceof Error ? error.name : "network-error");
    }
  }

  if (!groqConfigured()) throw new Error(key ? "facetest-model-unavailable" : "facetest-model-not-configured");

  const result = await groqFetch(GROQ_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      model: GROQ_FALLBACK_MODEL,
      messages,
      stream: true,
      temperature,
      max_completion_tokens: maxTokens
    })
  });

  if (result.allQuotaExhausted) {
    const error = new Error("groq-quota-exhausted");
    error.code = "GROQ_QUOTA_EXHAUSTED";
    throw error;
  }

  return {
    response: result.response,
    provider: "groq",
    model: GROQ_FALLBACK_MODEL,
    groqSlot: result.slot
  };
}
