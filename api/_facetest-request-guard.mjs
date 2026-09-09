import { timingSafeEqual } from "node:crypto";

const buckets = globalThis.__facetestRequestBuckets ||= new Map();
const LEGACY_ORIGINS = new Set([
  "https://adamcagle.com",
  "https://www.adamcagle.com",
]);

function secureEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  return leftBuffer.length > 0 && leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function guardFacetestRequest(req, res, { limit = 30, windowMs = 300000 } = {}) {
  const origin = String(req.headers.origin || "");
  const expectedProxyToken = process.env.FACETEST_PROXY_SECRET;
  const proxyAuthorized = Boolean(expectedProxyToken) && secureEqual(req.headers["x-facetest-proxy-token"], expectedProxyToken);
  const legacySameSite = LEGACY_ORIGINS.has(origin);
  if (!proxyAuthorized && !legacySameSite) {
    res.setHeader("Cache-Control", "no-store");
    res.status(403).json({ error: "This endpoint only accepts requests from Adam Cagle's portfolio." });
    return false;
  }

  const client = String((proxyAuthorized && req.headers["x-facetest-client-id"]) || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim()
    .slice(0, 120);
  const key = `${req.url}:${client}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
    res.status(429).json({ error: "ACE needs a brief pause before another request." });
    return false;
  }

  if (buckets.size > 2000) {
    for (const [bucketKey, value] of buckets) if (value.resetAt <= now) buckets.delete(bucketKey);
  }
  return true;
}
