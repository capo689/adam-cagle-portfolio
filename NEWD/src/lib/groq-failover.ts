const quotaStatuses = new Set([402, 429]);
const retryableStatuses = new Set([402, 408, 409, 425, 429, 500, 502, 503, 504]);

function configuredKeys() {
  const primary = String(process.env.GROQ_API_KEY || "").trim();
  const backup = String(process.env.GROQ_API_KEY_BACKUP || "").trim();
  const keys: Array<{ value: string; slot: "primary" | "backup" }> = [];
  if (primary) keys.push({ value: primary, slot: "primary" });
  if (backup && backup !== primary) keys.push({ value: backup, slot: "backup" });
  return keys;
}

export function groqConfigured() {
  return configuredKeys().length > 0;
}

export async function groqFetch(url: string, init: RequestInit, timeoutMs = 30_000) {
  const keys = configuredKeys();
  if (!keys.length) throw new Error("groq-not-configured");
  const attempts: Array<{ slot: string; status: number }> = [];
  let lastError: unknown;

  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index]!;
    const headers = new Headers(init.headers || {});
    headers.set("Authorization", `Bearer ${key.value}`);
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: init.signal || AbortSignal.timeout(timeoutMs),
      });
      attempts.push({ slot: key.slot, status: response.status });
      if (!retryableStatuses.has(response.status) || index === keys.length - 1) {
        return {
          response,
          slot: key.slot,
          allQuotaExhausted:
            attempts.length === keys.length && attempts.every(({ status }) => quotaStatuses.has(status)),
        };
      }
      await response.body?.cancel().catch(() => undefined);
    } catch (error) {
      lastError = error;
      if (index === keys.length - 1) throw error;
    }
  }
  throw lastError || new Error("groq-unavailable");
}
