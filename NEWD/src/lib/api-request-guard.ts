type GuardOptions = {
  limit: number;
  windowMs: number;
  maxBytes: number;
  contentTypes: string[];
};

type Bucket = { count: number; resetAt: number };

const globalWithBuckets = globalThis as typeof globalThis & {
  __aceRequestBuckets?: Map<string, Bucket>;
};

const buckets = globalWithBuckets.__aceRequestBuckets ??= new Map<string, Bucket>();

function reject(status: number, error: string, headers: HeadersInit = {}) {
  return Response.json({ error }, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function requestKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function guardApiRequest(request: Request, options: GuardOptions) {
  const ownOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== ownOrigin) || (!origin && fetchSite !== "same-origin")) {
    return reject(403, "This endpoint only accepts requests from the portfolio.");
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!options.contentTypes.some((allowed) => contentType.startsWith(allowed))) {
    return reject(415, "Unsupported content type.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > options.maxBytes) {
    return reject(413, "Request is too large.");
  }

  const now = Date.now();
  const key = `${new URL(request.url).pathname}:${requestKey(request)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + options.windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > options.limit) {
    return reject(429, "ACE needs a brief pause before another request.", {
      "Retry-After": String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))),
    });
  }

  if (buckets.size > 2000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  return null;
}

export async function readRequestBytes(request: Request, maxBytes: number) {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value?.byteLength) continue;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new Error("too-large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readRequestText(request: Request, maxBytes: number) {
  return new TextDecoder().decode(await readRequestBytes(request, maxBytes));
}
