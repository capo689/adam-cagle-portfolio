const GROQ_URL = "https://api.groq.com/openai/v1/audio/speech";
const VOICES = new Set(["autumn", "diana", "hannah", "austin", "daniel", "troy"]);

function reject(res, status, error) {
  res.status(status).json({error});
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");
  if (!process.env.GROQ_API_KEY) return reject(res, 503, "Groq is not configured yet");

  const text = typeof req.body?.text === "string" ? req.body.text.replace(/\s+/g, " ").trim().slice(0, 200) : "";
  const voice = VOICES.has(req.body?.voice) ? req.body.voice : "daniel";
  if (!text) return reject(res, 400, "Text is required");

  let upstream;
  try {
    upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice,
        response_format: "wav",
        sample_rate: 24000
      })
    });
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
