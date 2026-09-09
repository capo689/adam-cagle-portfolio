const RETIRED_RESPONSE = Object.freeze({
  error: "This legacy AI experience has been retired.",
  code: "LEGACY_AI_RETIRED",
});

export function retiredAiEndpoint(_req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res.status(410).json(RETIRED_RESPONSE);
}
