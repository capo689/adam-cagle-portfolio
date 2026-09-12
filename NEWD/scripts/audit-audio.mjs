import {existsSync, readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
import vm from "node:vm";

const root = join(import.meta.dirname, "..");
const publicRoot = join(root, "public");
const failures = [];
const warnings = [];
let checked = 0;

function loadGlobal(file, key) {
  const context = {window: {}};
  vm.runInNewContext(readFileSync(file, "utf8"), context, {filename: file});
  return context.window[key];
}

function mediaDuration(file) {
  const result = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file], {encoding: "utf8"});
  if (result.status !== 0) return Number.NaN;
  return Number(result.stdout.trim());
}

function auditClip(label, file, text, declaredDuration) {
  checked += 1;
  if (!existsSync(file)) {
    failures.push(`${label}: missing ${file.replace(`${publicRoot}/`, "")}`);
    return;
  }
  const duration = mediaDuration(file);
  if (!Number.isFinite(duration) || duration <= .25) {
    failures.push(`${label}: audio is not decodable`);
    return;
  }
  if (Number.isFinite(declaredDuration) && Math.abs(duration - declaredDuration) > .18) {
    failures.push(`${label}: manifest says ${declaredDuration.toFixed(3)}s but file is ${duration.toFixed(3)}s`);
  }
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) failures.push(`${label}: intended narration is empty`);
  const wordsPerSecond = words / duration;
  if (wordsPerSecond > 4.25) failures.push(`${label}: ${wordsPerSecond.toFixed(2)} words/second suggests clipped or mismatched audio`);
  else if (wordsPerSecond < 1.0) warnings.push(`${label}: unusually slow at ${wordsPerSecond.toFixed(2)} words/second`);
}

const answers = JSON.parse(readFileSync(join(root, "src", "content", "ace-standard-answers.json"), "utf8"));
for (const answer of answers) {
  const source = answer.audio?.split("?")[0];
  if (!source) {
    failures.push(`ACE answer ${answer.id}: missing audio mapping`);
    continue;
  }
  auditClip(`ACE answer ${answer.id}`, join(publicRoot, source), answer.display);
}

const workflows = [
  "proving-ground", "field-kit", "conversion-forge", "answer-field", "switchboard",
  "synthetic-audience-lab", "crit", "reading-room", "canon", "backlot",
];
for (const workflow of workflows) {
  const directory = join(publicRoot, workflow);
  const config = loadGlobal(join(directory, "config.js"), "WORKFLOW_CONFIG");
  const narration = loadGlobal(join(directory, "narration", "manifest.js"), "WORKFLOW_NARRATION");
  const nodes = new Map((config.nodes || []).map((node) => [node.id, node]));
  const segments = new Map((narration.segments || []).map((segment) => [segment.id, segment]));
  for (const id of config.route || []) {
    const node = nodes.get(id);
    const segment = segments.get(id);
    if (!node) failures.push(`${workflow}: route node ${id} has no configuration`);
    if (!segment) failures.push(`${workflow}: route node ${id} has no narration audio`);
    if (!node || !segment) continue;
    auditClip(`${workflow}/${id}`, join(publicRoot, segment.src.split("?")[0]), node.narration, Number(segment.duration));
  }
}

const migration = loadGlobal(join(publicRoot, "migration_new", "narration", "manifest.js"), "CIVIC_NARRATION");
for (const [scenario, data] of Object.entries(migration.scenarios || {})) {
  for (const segment of data.segments || []) {
    auditClip(`migration_new/${scenario}/${segment.id}`, join(publicRoot, "migration_new", "narration", "audio", scenario, `${segment.id}.mp3`), segment.text);
  }
}

const allMp3 = [];
function collect(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collect(path);
    else if (entry.name.endsWith(".mp3")) allMp3.push(path);
  }
}
collect(publicRoot);
for (const file of allMp3) {
  const duration = mediaDuration(file);
  if (!Number.isFinite(duration) || duration <= .25) failures.push(`Unusable MP3: ${file.replace(`${publicRoot}/`, "")}`);
}

console.log(`Checked ${checked} intended narration clips and decoded ${allMp3.length} MP3 files.`);
for (const warning of warnings) console.warn(`WARN ${warning}`);
if (failures.length) {
  console.error(`Audio audit failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("Audio audit passed.");
