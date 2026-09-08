const OPENROUTER_SPEECH_URL = "https://openrouter.ai/api/v1/audio/speech";
const MODEL = "fish-audio/s2.1-pro-free:free";
const VOICE = "536d3a5e000945adb7038665781a4aca"; // Ethan · Fish Official

const DIRECTIONS = {
  neutral: "[natural and conversational]",
  attentive: "[attentive, calm, and conversational]",
  curious: "[genuinely curious]",
  thinking: "[thoughtful, with a measured pace]",
  warm: "[warm, relaxed, and conversational]",
  amused: "[subtly amused]",
  playful: "[playful, with a light touch]",
  delighted: "[delighted and energetic]",
  surprised: "[pleasantly surprised]",
  proud: "[quietly confident]",
  skeptical: "[skeptical, dry, and restrained]",
  concerned: "[serious and gently concerned]",
  empathetic: "[empathetic, soft, and sincere]",
  wry: "[wry, dry, and conversational]"
};

function reject(res, status, error, code) {
  res.status(status).json(code ? {error, code} : {error});
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");

  const apiKey = process.env.FACETEST_OPENROUTER_API_KEY?.trim();
  if (!apiKey) return reject(res, 503, "Fish Audio is not configured yet");

  const text = typeof req.body?.text === "string"
    ? req.body.text.replace(/\s+/g, " ").trim().slice(0, 560)
    : "";
  if (!text) return reject(res, 400, "Text is required");

  const expression = typeof req.body?.expression === "string"
    ? req.body.expression.toLowerCase()
    : "neutral";
  const direction = DIRECTIONS[expression] || DIRECTIONS.neutral;
  const input = `${direction} ${text}`;

  let upstream;
  try {
    upstream = await fetch(OPENROUTER_SPEECH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adamcagle.com/FACETEST/fish-lab.html",
        "X-Title": "FACETEST Fish Voice Lab"
      },
      body: JSON.stringify({
        model: MODEL,
        input,
        voice: VOICE,
        response_format: "mp3"
      })
    });
  } catch {
    return reject(res, 502, "OpenRouter could not be reached");
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("FACETEST Fish speech error", upstream.status, detail.slice(0, 1000));
    if (upstream.status === 402 || upstream.status === 429) {
      return reject(res, 429, "The Fish test route is temporarily unavailable", "OPENROUTER_SPEECH_UNAVAILABLE");
    }
    return reject(res, 502, "Fish Audio could not generate speech");
  }

  const audio = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
  res.setHeader("Content-Length", String(audio.length));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-FACETEST-Voice-Model", MODEL);
  res.setHeader("X-FACETEST-Voice", "Ethan");
  res.status(200).send(audio);
}

