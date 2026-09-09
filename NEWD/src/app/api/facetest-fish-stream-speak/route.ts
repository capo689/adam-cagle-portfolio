import { proxyFacetest } from "@/lib/facetest-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.text();
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
