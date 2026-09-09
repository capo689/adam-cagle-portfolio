import {spawn} from "node:child_process";
import {mkdir, rename, stat, writeFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {ACE_STANDARD_ANSWERS} from "../api/_ace-copy-system.mjs";

const root = resolve(import.meta.dirname, "..");
const endpoint = process.env.ACE_SPEECH_ENDPOINT || "https://newd-adam-cagle.vercel.app/api/facetest-fish-stream-speak";
const outputRoot = resolve(root, "NEWD/public/ace-answers");
const concurrency = Number(process.env.ACE_AUDIO_CONCURRENCY || 2);

async function generate(item) {
  const destination = resolve(outputRoot, `${item.id}.mp3`);
  const existing = await stat(destination).catch(() => null);
  if (existing?.size > 8000 && process.env.ACE_AUDIO_FORCE !== "1") return {id: item.id, reused: true, bytes: existing.size};

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({text: item.spoken, expression: item.expression, intensity: .68}),
  });
  if (!response.ok) throw new Error(`${item.id}: ${response.status} ${(await response.text()).slice(0, 220)}`);
  const pcm = Buffer.from(await response.arrayBuffer());
  if (pcm.length < 8000) throw new Error(`${item.id}: only ${pcm.length} PCM bytes`);
  const sampleRate = Number(response.headers.get("x-facetest-pcm-rate")) || 44100;
  await mkdir(dirname(destination), {recursive: true});
  const temporary = `${destination}.partial.mp3`;
  await new Promise((resolvePromise, reject) => {
    const child = spawn("/opt/homebrew/bin/ffmpeg", [
      "-hide_banner", "-loglevel", "error", "-y",
      "-f", "s16le", "-ar", String(sampleRate), "-ac", "1", "-i", "pipe:0",
      "-codec:a", "libmp3lame", "-b:a", "96k", "-ar", "24000", "-ac", "1", temporary,
    ], {stdio: ["pipe", "ignore", "pipe"]});
    let errorText = "";
    child.stderr.on("data", (chunk) => { errorText += chunk.toString(); });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolvePromise() : reject(new Error(`${item.id}: ffmpeg ${code} ${errorText.slice(0, 300)}`)));
    child.stdin.on("error", reject);
    child.stdin.end(pcm);
  });
  await rename(temporary, destination);
  return {id: item.id, reused: false, bytes: (await stat(destination)).size};
}

const requestedIds = new Set(String(process.env.ACE_AUDIO_IDS || "").split(",").map((item) => item.trim()).filter(Boolean));
const queue = ACE_STANDARD_ANSWERS.filter((item) => item.audio && (!requestedIds.size || requestedIds.has(item.id)));
let cursor = 0;
const results = [];
async function worker(workerId) {
  while (cursor < queue.length) {
    const item = queue[cursor++];
    process.stderr.write(`[${workerId}] ACE ${item.id}\n`);
    results.push(await generate(item));
  }
}

await Promise.all(Array.from({length: concurrency}, (_, index) => worker(index + 1)));
const allRecordedAnswers = ACE_STANDARD_ANSWERS.filter((item) => item.audio);
await writeFile(resolve(root, "NEWD/src/content/ace-standard-answers.json"), `${JSON.stringify(allRecordedAnswers.map((item) => ({
  id: item.id,
  expression: item.expression,
  patterns: item.patterns.map((pattern) => ({source: pattern.source, flags: pattern.flags})),
  display: item.display,
  audio: `/ace-answers/${item.id}.mp3${item.audioVersion ? `?v=${item.audioVersion}` : ""}`,
})), null, 2)}\n`);
console.log(`Prepared ${results.length} ACE standard recordings. ${results.filter((item) => item.reused).length} reused.`);
