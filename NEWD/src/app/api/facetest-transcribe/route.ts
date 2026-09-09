import { proxyFacetest } from "@/lib/facetest-proxy";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  return proxyFacetest(
    request,
    "/api/facetest-transcribe",
    await request.arrayBuffer(),
  );
}
