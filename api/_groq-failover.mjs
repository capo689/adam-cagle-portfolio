const QUOTA_STATUS = new Set([402, 429]);
const RETRYABLE_STATUS = new Set([402, 408, 409, 425, 429, 500, 502, 503, 504]);

function configuredKeys() {
  const primary = String(process.env.GROQ_API_KEY || "").trim();
  const backup = String(process.env.GROQ_API_KEY_BACKUP || "").trim();
  const keys = [];
  if (primary) keys.push({value: primary, slot: "primary"});
  if (backup && backup !== primary) keys.push({value: backup, slot: "backup"});
  return keys;
}

export function groqConfigured() {
  return configuredKeys().length > 0;
}

export async function groqFetch(url, init, {timeoutMs = 30000} = {}) {
  const keys = configuredKeys();
  if (!keys.length) throw new Error("groq-not-configured");
  let lastError;
  const attempts = [];

  for (let index = 0; index < keys.length; index++) {
    const headers = new Headers(init?.headers || {});
    headers.set("Authorization", `Bearer ${keys[index].value}`);
    try {
      const response = await fetch(url, {
        ...init,
        headers,
        signal: init?.signal || AbortSignal.timeout(timeoutMs)
      });
      attempts.push({slot: keys[index].slot, status: response.status});
      const retryable = RETRYABLE_STATUS.has(response.status);
      if (!retryable || index === keys.length - 1) {
        return {
          response,
          slot: keys[index].slot,
          attempts,
          allQuotaExhausted: attempts.length === keys.length && attempts.every(({status}) => QUOTA_STATUS.has(status))
        };
      }
      console.warn(`Groq ${keys[index].slot} unavailable; trying next key`, response.status);
      await response.body?.cancel().catch(() => {});
    } catch (error) {
      lastError = error;
      if (index === keys.length - 1) throw error;
      console.warn(`Groq ${keys[index].slot} request failed; trying next key`, error instanceof Error ? error.name : "network-error");
    }
  }

  throw lastError || new Error("groq-unavailable");
}
