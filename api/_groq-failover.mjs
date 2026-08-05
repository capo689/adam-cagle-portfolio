const RETRYABLE_STATUS = new Set([402, 408, 409, 425, 429, 500, 502, 503, 504]);

function configuredKeys() {
  return [...new Set([
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_BACKUP
  ].map((key) => String(key || "").trim()).filter(Boolean))];
}

export function groqConfigured() {
  return configuredKeys().length > 0;
}

export async function groqFetch(url, init, {timeoutMs = 30000} = {}) {
  const keys = configuredKeys();
  if (!keys.length) throw new Error("groq-not-configured");
  let lastError;

  for (let index = 0; index < keys.length; index++) {
    const headers = new Headers(init?.headers || {});
    headers.set("Authorization", `Bearer ${keys[index]}`);
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: init?.signal || AbortSignal.timeout(timeoutMs)
      });
      const retryable = RETRYABLE_STATUS.has(response.status);
      if (!retryable || index === keys.length - 1) {
        return {response, slot: index === 0 ? "primary" : "backup"};
      }
      console.warn("Groq primary unavailable; trying backup", response.status);
      await response.body?.cancel().catch(() => {});
    } catch (error) {
      lastError = error;
      if (index === keys.length - 1) throw error;
      console.warn("Groq primary request failed; trying backup", error instanceof Error ? error.name : "network-error");
    }
  }

  throw lastError || new Error("groq-unavailable");
}
