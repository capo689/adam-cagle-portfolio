import { proxyFacetest } from "@/lib/facetest-proxy";
import { guardApiRequest, readRequestBytes } from "@/lib/api-request-guard";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  return proxyFacetest(
    request,
    "/api/facetest-transcribe",
    body.slice().buffer as ArrayBuffer,
  );
}
