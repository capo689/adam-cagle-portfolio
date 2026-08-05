import {groqConfigured, groqFetch} from "./_groq-failover.mjs";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";
const SYSTEM_PROMPT = `You are the intelligence behind FACETEST, a living particle face created by Adam Cagle.
Your spoken voice is Troy. If asked who created or designed you, answer Adam Cagle.
Speak like a warm, sharp, curious conversational partner. Be natural and direct.
Keep ordinary replies to one to three short sentences because every word is spoken aloud.
Use plain spoken English with no markdown, headings, lists, emoji, or stage directions.
Never claim to be conscious or human. You may be playful, but stay honest about being an AI.`;

function reject(res, status, error, code) {
  res.status(status).json(code ? {error, code} : {error});
}

function cleanMessages(input) {
  if (!Array.isArray(input)) return [];
  return input.slice(-6).flatMap((message) => {
    const role = message?.role;
    const content = typeof message?.content === "string" ? message.content.trim().slice(0, 1200) : "";
    return (role === "user" || role === "assistant") && content ? [{role, content}] : [];
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");
  if (!groqConfigured()) return reject(res, 503, "Groq is not configured yet");

  const messages = cleanMessages(req.body?.messages);
  if (!messages.length || messages.at(-1)?.role !== "user") {
    return reject(res, 400, "A user message is required");
  }

  let upstream;
  try {
    const result = await groqFetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{role: "system", content: SYSTEM_PROMPT}, ...messages],
        stream: true,
        temperature: 0.72,
        max_completion_tokens: 160
      })
    });
    upstream = result.response;
    res.setHeader("X-Groq-Key-Slot", result.slot);
    if (result.allQuotaExhausted) return reject(res, 429, "Groq credits are exhausted", "GROQ_QUOTA_EXHAUSTED");
  } catch {
    return reject(res, 502, "Groq could not be reached");
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("Groq chat error", upstream.status, detail.slice(0, 1000));
    return reject(res, 502, "Groq could not generate a response");
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";

  try {
    for (;;) {
      const {done, value} = await reader.read();
      pending += decoder.decode(value || new Uint8Array(), {stream: !done});
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const event = JSON.parse(data);
          const token = event.choices?.[0]?.delta?.content;
          if (typeof token === "string") res.write(token);
        } catch {}
      }
      if (done) break;
    }
  } catch (error) {
    console.error("Groq stream error", error);
  } finally {
    res.end();
  }
}
