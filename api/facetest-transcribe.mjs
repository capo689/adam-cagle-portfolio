import {groqConfigured, groqFetch} from "./_groq-failover.mjs";

export const config = {api: {bodyParser: false}};

const GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function reject(res, status, error) {
  res.status(status).json({error});
}

async function readAudio(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_AUDIO_BYTES) throw new Error("too-large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return reject(res, 405, "POST required");
  if (!groqConfigured()) return reject(res, 503, "Groq is not configured yet");

  let audio;
  try {
    audio = await readAudio(req);
  } catch {
    return reject(res, 413, "Recording is too large");
  }
  if (audio.length < 800) return reject(res, 400, "Recording is empty");

  const mime = String(req.headers["content-type"] || "audio/webm").split(";")[0];
  const extension = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
  const form = new FormData();
  form.append("file", new Blob([audio], {type: mime}), `voice.${extension}`);
  form.append("model", "whisper-large-v3-turbo");
  form.append("language", "en");
  form.append("response_format", "json");
  form.append("temperature", "0");

  let upstream;
  try {
    const result = await groqFetch(GROQ_URL, {
      method: "POST",
      headers: {Authorization: `Bearer ${process.env.GROQ_API_KEY}`},
      body: form
    });
    upstream = result.response;
    res.setHeader("X-Groq-Key-Slot", result.slot);
  } catch {
    return reject(res, 502, "Groq could not be reached");
  }

  const result = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error("Groq transcription error", upstream.status, JSON.stringify(result).slice(0, 1000));
    return reject(res, 502, "Groq could not transcribe the recording");
  }

  const text = typeof result.text === "string" ? result.text.trim() : "";
  if (!text) return reject(res, 422, "I couldn't hear any words");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({text});
}
