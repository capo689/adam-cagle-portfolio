import {groqConfigured, groqFetch} from "./_groq-failover.mjs";

const GROQ_URL = "https://api.groq.com/openai/v1/audio/speech";
const VOICE = "troy";

function reject(res, status, error, code) {
  res.status(status).json(code ? {error, code} : {error});
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");
  if (!groqConfigured()) return reject(res, 503, "Groq is not configured yet");

  const text = typeof req.body?.text === "string" ? req.body.text.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  if (!text) return reject(res, 400, "Text is required");

  let upstream;
  try {
    const result = await groqFetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice: VOICE,
        response_format: "wav",
        sample_rate: 24000
      })
    });
    upstream = result.response;
    res.setHeader("X-Groq-Key-Slot", result.slot);
    if (result.allQuotaExhausted) return reject(res, 429, "Groq credits are exhausted", "GROQ_QUOTA_EXHAUSTED");
  } catch {
    return reject(res, 502, "Groq could not be reached");
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("Groq speech error", upstream.status, detail.slice(0, 1000));
    return reject(res, 502, "Orpheus could not generate speech");
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/wav");
  res.setHeader("Content-Length", String(audio.length));
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(audio);
}
