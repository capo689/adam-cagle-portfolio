const FACETEST_ORIGIN = "https://adamcagle.com";

const PASSTHROUGH_HEADERS = [
  "cache-control",
  "content-type",
  "x-content-type-options",
  "x-facetest-answer",
  "x-facetest-answer-id",
  "x-facetest-audio",
  "x-facetest-knowledge",
  "x-facetest-model",
  "x-facetest-pcm-rate",
  "x-facetest-provider",
  "x-facetest-voice",
  "x-facetest-voice-model",
  "x-groq-key-slot",
];

export async function proxyFacetest(request: Request, path: string, body: BodyInit) {
  const upstream = await fetch(`${FACETEST_ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/octet-stream",
      "User-Agent": "Adam-Cagle-NEWD/0.1",
    },
    body,
    cache: "no-store",
  });

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("Cache-Control", "no-store, no-transform");

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
}
