import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(root, "..");
const failures = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const textFiles = [
  ...walk(join(root, "src")),
  ...walk(join(repositoryRoot, "FACETEST", "knowledge", "public")),
  join(repositoryRoot, "api", "_facetest-knowledge.generated.mjs"),
].filter((path) => [".ts", ".tsx", ".js", ".mjs", ".json", ".md"].includes(extname(path)));
const corpus = textFiles.map((path) => readFileSync(path, "utf8")).join("\n");

check(!/per month|monthly attributed|monthly revenue|per send|a month/i.test(corpus), "Sunset Marquis metric drifted away from per email.");
check(!/face for the internet|internet with a face/i.test(corpus), "The retired snippy ACE line returned.");
check(!/\bTroy\b/.test(readFileSync(join(root, "src", "lib", "facetest-voice-stream.ts"), "utf8")), "The retired Troy agent name returned to the voice runtime.");
check(!/Agentic\s*689/i.test(readFileSync(join(repositoryRoot, "api", "_facetest-knowledge.generated.mjs"), "utf8")), "Agentic689 leaked into the public ACE index.");

const figueroaPages = readdirSync(join(root, "public", "brand", "hotel-figueroa-book"))
  .filter((name) => /^HotelFigueroa \d+\.jpeg$/.test(name));
check(figueroaPages.length === 61, `Expected 61 Figueroa brand-book pages; found ${figueroaPages.length}.`);

const answers = JSON.parse(readFileSync(join(root, "src", "content", "ace-standard-answers.json"), "utf8"));
for (const answer of answers) {
  const audioPath = answer.audio?.split("?")[0];
  check(Boolean(answer.display?.trim()), `ACE answer ${answer.id} has no display copy.`);
  check(Boolean(audioPath) && existsSync(join(root, "public", audioPath)), `ACE answer ${answer.id} is missing audio ${audioPath}.`);
}

const sourceCorpus = walk(join(root, "src"))
  .filter((path) => [".ts", ".tsx", ".js", ".mjs", ".json"].includes(extname(path)))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
const assetReferences = new Set([...sourceCorpus.matchAll(/["']\/(?!api\/)([^"'?#]+\.(?:png|jpe?g|webp|svg|mp3|pdf|woff2?))/gi)].map((match) => decodeURI(`/${match[1]}`)));
for (const asset of assetReferences) {
  const sourceAsset = asset === "/icon.svg" ? join(root, "src", "app", "icon.svg") : join(root, "public", asset);
  check(existsSync(sourceAsset), `Missing public asset ${asset}.`);
}

for (const file of walk(join(root, "public"))) {
  check(statSync(file).size > 0, `Empty public asset ${file.slice(root.length + 1)}.`);
}

if (failures.length) {
  console.error(`Launch validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Launch validation passed: ${answers.length} ACE answers, ${figueroaPages.length} Figueroa pages, ${assetReferences.size} referenced assets.`);
