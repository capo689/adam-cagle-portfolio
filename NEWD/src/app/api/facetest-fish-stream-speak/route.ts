import { guardApiRequest, readRequestText } from "@/lib/api-request-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

const speechUrl = "https://openrouter.ai/api/v1/audio/speech";
const model = "fish-audio/s2.1-pro-free:free";
const voice = "536d3a5e000945adb7038665781a4aca";
const directions: Record<string, string> = {
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
  wry: "[wry, dry, and conversational]",
};

export async function POST(request: Request) {
  const guarded = guardApiRequest(request, {
    limit: 50,
    windowMs: 5 * 60 * 1000,
    maxBytes: 8 * 1024,
    contentTypes: ["application/json"],
  });
  if (guarded) return guarded;
  let body = "";
  try {
    body = await readRequestText(request, 8 * 1024);
  } catch {
    return Response.json({error: "Request is too large"}, {status: 413, headers: {"Cache-Control": "no-store"}});
  }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(body || "{}");
  } catch {
    return Response.json({error: "Valid JSON is required"}, {status: 400});
  }
  const speech = typeof input.text === "string" ? input.text.replace(/\s+/g, " ").trim() : "";
  if (!speech) {
    return Response.json({error: "Text is required"}, {status: 400, headers: {"Cache-Control": "no-store"}});
  }
  if (speech.length > 540) {
    return Response.json(
      {error: "Speech segment exceeds the safe narration limit"},
      {status: 413, headers: {"Cache-Control": "no-store"}},
    );
  }
  const apiKey = String(process.env.FACETEST_OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    return Response.json({error: "ACE speech is not configured yet"}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
  const expression = typeof input.expression === "string" ? input.expression.toLowerCase() : "neutral";
  let upstream: Response;
  try {
    upstream = await fetch(speechUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://adamcagle.com/",
        "X-Title": "Adam Cagle Portfolio - ACE",
      },
      body: JSON.stringify({
        model,
        input: `${directions[expression] || directions.neutral} ${speech}`,
        voice,
        response_format: "pcm",
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return Response.json({error: "ACE speech could not be reached"}, {status: 502, headers: {"Cache-Control": "no-store"}});
  }
  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel().catch(() => undefined);
    const unavailable = upstream.status === 402 || upstream.status === 429;
    return Response.json(
      unavailable
        ? {error: "ACE speech is temporarily unavailable", code: "OPENROUTER_SPEECH_UNAVAILABLE"}
        : {error: "ACE could not generate speech"},
      {status: unavailable ? 429 : 502, headers: {"Cache-Control": "no-store"}},
    );
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-transform",
      "Content-Type": upstream.headers.get("content-type") || "audio/pcm;rate=44100",
      "X-Content-Type-Options": "nosniff",
      "X-FACETEST-PCM-Rate": upstream.headers.get("x-audio-sample-rate") || "44100",
      "X-FACETEST-Voice-Model": model,
      "X-FACETEST-Voice": "Ethan",
    },
  });
}
