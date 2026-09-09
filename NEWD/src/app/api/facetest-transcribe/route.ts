import { guardApiRequest, readRequestBytes } from "@/lib/api-request-guard";
import { groqConfigured, groqFetch } from "@/lib/groq-failover";

export const runtime = "nodejs";
export const maxDuration = 60;

const groqUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
const portfolioVocabulary = [
  "ACE and Adam Cagle portfolio navigation.",
  "Agency689, pronounced Agency Six Eight Nine.",
  "Sunset Marquis, Traveler Guitar, Killer Network, Hotel Figueroa, NAVIS, FileKeepers, Clink Hostels.",
  "Singularity SEO, Legacy Content Migrator, Conversion Forge, Proving Ground, Field Kit, Switchboard, Synthetic Audience Lab, CRIT, Reading Room, Canon, Backlot, Answer Field.",
  "The speaker may say open, show, load, launch, pull up, bring up, take me to, or walk me through.",
].join(" ");

export async function POST(request: Request) {
  const guarded = guardApiRequest(request, {
    limit: 24,
    windowMs: 5 * 60 * 1000,
    maxBytes: 12 * 1024 * 1024,
    contentTypes: ["audio/webm", "audio/mp4", "audio/ogg"],
  });
  if (guarded) return guarded;
  let body: Uint8Array;
  try {
    body = await readRequestBytes(request, 12 * 1024 * 1024);
  } catch {
    return Response.json({error: "Recording is too large"}, {status: 413, headers: {"Cache-Control": "no-store"}});
  }
  if (body.byteLength < 800) {
    return Response.json({error: "Recording is empty"}, {status: 400, headers: {"Cache-Control": "no-store"}});
  }
  if (!groqConfigured()) {
    return Response.json({error: "ACE transcription is not configured yet"}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }

  const mime = (request.headers.get("content-type") || "audio/webm").split(";")[0]!;
  const extension = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "m4a" : "webm";
  const payload = body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer;
  const form = new FormData();
  form.append("file", new Blob([payload], {type: mime}), `voice.${extension}`);
  form.append("model", "whisper-large-v3");
  form.append("language", "en");
  form.append("prompt", portfolioVocabulary);
  form.append("response_format", "json");
  form.append("temperature", "0");

  let result: Awaited<ReturnType<typeof groqFetch>>;
  try {
    result = await groqFetch(groqUrl, {method: "POST", body: form});
  } catch {
    return Response.json({error: "ACE transcription could not be reached"}, {status: 502, headers: {"Cache-Control": "no-store"}});
  }
  if (result.allQuotaExhausted) {
    return Response.json(
      {error: "Groq credits are exhausted", code: "GROQ_QUOTA_EXHAUSTED"},
      {status: 429, headers: {"Cache-Control": "no-store"}},
    );
  }
  const responseBody = await result.response.json().catch(() => ({})) as {text?: string};
  if (!result.response.ok) {
    return Response.json({error: "ACE could not transcribe the recording"}, {status: 502, headers: {"Cache-Control": "no-store"}});
  }
  const text = typeof responseBody.text === "string" ? responseBody.text.trim() : "";
  if (!text) {
    return Response.json({error: "I couldn't hear any words"}, {status: 422, headers: {"Cache-Control": "no-store"}});
  }
  return Response.json({text}, {
    status: 200,
    headers: {"Cache-Control": "no-store", "X-Groq-Key-Slot": result.slot},
  });
}
