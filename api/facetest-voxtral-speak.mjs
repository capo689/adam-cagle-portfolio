const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const MODEL = "mistralai/voxtral-mini-tts-2603";

const VOICES = {
  neutral: "en_paul_neutral",
  attentive: "en_paul_neutral",
  curious: "en_paul_neutral",
  thinking: "en_paul_neutral",
  warm: "en_paul_happy",
  amused: "en_paul_happy",
  playful: "en_paul_cheerful",
  delighted: "en_paul_excited",
  surprised: "en_paul_excited",
  proud: "en_paul_confident",
  skeptical: "en_paul_frustrated",
  concerned: "en_paul_sad",
  empathetic: "en_paul_sad"
};

function reject(res, status, error, code) {
  res.status(status).json(code ? {error, code} : {error});
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");

  const apiKey = process.env.FACETEST_OPENROUTER_API_KEY?.trim();
  if (!apiKey) return reject(res, 503, "Voxtral is not configured yet");

  const text = typeof req.body?.text === "string"
    ? req.body.text.replace(/\s+/g, " ").trim().slice(0, 600)
    : "";
  if (!text) return reject(res, 400, "Text is required");

  const expression = typeof req.body?.expression === "string"
    ? req.body.expression.toLowerCase()
    : "neutral";
  const voice = VOICES[expression] || VOICES.neutral;

  let upstream;
  try {
    upstream = await fetch(OPENROUTER_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adamcagle.com/FACETEST/voice-lab.html",
        "X-Title": "FACETEST Voxtral Voice Lab"
      },
      body: JSON.stringify({
        model: MODEL,
        input: text,
        voice,
        response_format: "mp3"
      })
    });
  } catch {
    return reject(res, 502, "OpenRouter could not be reached");
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("FACETEST Voxtral speech error", upstream.status, detail.slice(0, 1000));
    if (upstream.status === 402 || upstream.status === 429) {
      return reject(res, 429, "OpenRouter credits or capacity are unavailable", "OPENROUTER_SPEECH_UNAVAILABLE");
    }
    return reject(res, 502, "Voxtral could not generate speech");
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
  res.setHeader("Content-Length", String(audio.length));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-FACETEST-Voice-Model", MODEL);
  res.setHeader("X-FACETEST-Voice", voice);
  res.status(200).send(audio);
}
