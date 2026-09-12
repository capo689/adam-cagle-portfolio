const origin = (process.env.SITE_URL || "https://adamcagle.com").replace(/\/$/, "");
const failures = [];
const warnings = [];
const checked = new Map();

const workflows = [
  "proving-ground", "field-kit", "conversion-forge", "answer-field", "switchboard",
  "synthetic-audience-lab", "crit", "reading-room", "canon", "backlot", "migration_new",
];

function fail(message) { failures.push(message); }
function absolute(value, base = origin) {
  try { return new URL(value, base).href; } catch { return ""; }
}

async function fetchChecked(url, options = {}) {
  const key = `${options.method || "GET"} ${url}`;
  if (checked.has(key)) return checked.get(key);
  const promise = fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000), ...options })
    .catch((error) => ({ error }));
  checked.set(key, promise);
  return promise;
}

async function requireResponse(url, label, options = {}) {
  const response = await fetchChecked(url, options);
  if (response?.error) {
    fail(`${label}: request failed (${response.error.message})`);
    return null;
  }
  if (!response.ok) {
    fail(`${label}: HTTP ${response.status}`);
    await response.body?.cancel().catch(() => undefined);
    return null;
  }
  return response;
}

const sitemapResponse = await requireResponse(`${origin}/sitemap.xml`, "sitemap");
const sitemapXml = sitemapResponse ? await sitemapResponse.text() : "";
const routes = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!routes.length) fail("sitemap: no routes found");

const internalReferences = new Set();
const externalReferences = new Set();
for (const route of routes) {
  const response = await requireResponse(route, `page ${route}`);
  if (!response) continue;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) fail(`page ${route}: unexpected content type ${type}`);
  const html = await response.text();
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`page ${route}: missing title`);
  if (/refused to connect|application error|internal server error/i.test(html)) fail(`page ${route}: error text rendered`);
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1].replaceAll("&amp;", "&");
    if (!value || value.startsWith("#") || value.startsWith("data:") || value.startsWith("blob:")) continue;
    if (value.startsWith("mailto:")) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+$/i.test(value)) fail(`invalid email link: ${value}`);
      continue;
    }
    const url = absolute(value, route);
    if (!url) continue;
    if (new URL(url).origin === origin) internalReferences.add(url);
    else externalReferences.add(url);
  }
}

for (const workflow of workflows) {
  const pageUrl = `${origin}/workflows/${workflow}?audit=1`;
  const response = await requireResponse(pageUrl, `workflow ${workflow}`);
  if (!response) continue;
  const html = await response.text();
  if (!/WORKFLOW|migration/i.test(html)) fail(`workflow ${workflow}: unexpected HTML`);
  for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
    const value = match[1];
    if (value.startsWith("/")) internalReferences.add(absolute(value));
  }
}

for (const variant of ["main", "ai", "brand", "copy", "fun", "resume"]) {
  internalReferences.add(`${origin}/og/${variant}.png`);
}

for (const url of internalReferences) {
  const response = await requireResponse(url, `internal resource ${url}`, { headers: { Range: "bytes=0-1023" } });
  if (!response) continue;
  const type = response.headers.get("content-type") || "";
  if (/\.(?:png|jpe?g|webp|svg)(?:\?|$)/i.test(url) && !type.startsWith("image/")) fail(`graphic ${url}: unexpected content type ${type}`);
  await response.body?.cancel().catch(() => undefined);
}

for (const variant of ["main", "ai", "brand", "copy", "fun", "resume"]) {
  const response = await requireResponse(`${origin}/og/${variant}.png?audit=dimensions`, `OG card ${variant}`);
  if (!response) continue;
  const bytes = new Uint8Array(await response.arrayBuffer());
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const png = bytes.length > 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!png) fail(`OG card ${variant}: invalid PNG data`);
  else if (view.getUint32(16) !== 1200 || view.getUint32(20) !== 630) fail(`OG card ${variant}: expected 1200 by 630`);
}

for (const url of externalReferences) {
  const response = await fetchChecked(url, { method: "HEAD" });
  if (response?.error) warnings.push(`external link ${url}: ${response.error.message}`);
  else if (response.status >= 400 && ![403, 405, 429, 999].includes(response.status)) warnings.push(`external link ${url}: HTTP ${response.status}`);
  await response?.body?.cancel?.().catch(() => undefined);
}

const homeResponse = await requireResponse(`${origin}/`, "home security headers");
if (homeResponse) {
  if (homeResponse.headers.get("x-frame-options") !== "DENY") fail("home security: X-Frame-Options is not DENY");
  if (!/frame-ancestors 'none'/.test(homeResponse.headers.get("content-security-policy") || "")) fail("home security: frame-ancestors is not none");
  await homeResponse.body?.cancel().catch(() => undefined);
}

const blockedApi = await fetchChecked(`${origin}/api/facetest-next-chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: "https://example.com" },
  body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
});
if (blockedApi?.error || blockedApi.status !== 403) fail(`API origin guard: expected 403, received ${blockedApi?.status || "network error"}`);
await blockedApi?.body?.cancel?.().catch(() => undefined);

console.log(`Checked ${routes.length} pages, ${internalReferences.size} live internal resources, ${externalReferences.size} external links, ${workflows.length} workflows, and the API origin boundary.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (failures.length) {
  console.error(`Live audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Live audit passed.");
