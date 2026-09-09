import { proxyFacetest } from "@/lib/facetest-proxy";
import { guardApiRequest, readRequestText } from "@/lib/api-request-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  if (speech.length > 540) {
    return Response.json(
      {error: "Speech segment exceeds the safe narration limit"},
      {status: 413, headers: {"Cache-Control": "no-store"}},
    );
  }
  return proxyFacetest(
    request,
    "/api/facetest-fish-stream-speak",
    body,
  );
}
