#!/usr/bin/env node

import {createReadStream, existsSync} from "node:fs";
import {mkdir, readdir, unlink} from "node:fs/promises";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {extname, resolve, sep} from "node:path";
import {spawn} from "node:child_process";
import {randomUUID} from "node:crypto";

const ROOT = resolve(import.meta.dirname, "..");
const AUDIO_DIR = resolve(tmpdir(), "face-codex-mirror");
const PORT = Number(process.env.FACE_PORT || 4173);
const HOST = "127.0.0.1";
const VOICE = process.env.FACE_VOICE || "Daniel";
const clients = new Set();

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".obj": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".wav": "audio/wav"
};

function json(response, status, body) {
  response.writeHead(status, {"content-type": "application/json; charset=utf-8", "cache-control": "no-store"});
  response.end(JSON.stringify(body));
}

function broadcast(payload) {
  const line = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) client.write(line);
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 12000) throw new Error("Request is too large");
  }
  const type = request.headers["content-type"] || "";
  if (type.includes("application/json")) return JSON.parse(body || "{}");
  return {text: body};
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {stdio: "ignore"});
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited ${code}`)));
  });
}

async function synthesize(text, output) {
  const intermediate = `${output}.aiff`;
  try {
    await run("/usr/bin/say", ["-v", VOICE, "-r", "176", "-o", intermediate, text]);
    await run("/usr/bin/afconvert", ["-f", "WAVE", "-d", "LEI16@22050", intermediate, output]);
  } finally {
    await unlink(intermediate).catch(() => {});
  }
}

async function cleanOldAudio() {
  if (!existsSync(AUDIO_DIR)) return;
  const files = await readdir(AUDIO_DIR);
  await Promise.all(files.filter((file) => file.endsWith(".wav") || file.endsWith(".aiff")).map((file) => unlink(resolve(AUDIO_DIR, file)).catch(() => {})));
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

  if (request.method === "GET" && url.pathname === "/__face/health") {
    return json(response, 200, {ok: true, viewers: clients.size});
  }

  if (request.method === "GET" && url.pathname === "/__face/events") {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive"
    });
    response.write(`data: ${JSON.stringify({type: "connected"})}\n\n`);
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  if (request.method === "POST" && url.pathname === "/__face/speak") {
    try {
      const body = await readBody(request);
      const text = String(body.text || "").trim().slice(0, 4000);
      if (!text) return json(response, 400, {ok: false, error: "text is required"});
      const id = randomUUID();
      const filename = `${id}.wav`;
      const output = resolve(AUDIO_DIR, filename);
      broadcast({type: "preparing", id});
      await synthesize(text, output);
      broadcast({type: "speech", id, text, audio: `/__face/audio/${filename}`});
      return json(response, 202, {ok: true, id, viewers: clients.size});
    } catch (error) {
      console.error(error.message);
      return json(response, 500, {ok: false, error: error.message});
    }
  }

  if (request.method === "GET" && url.pathname.startsWith("/__face/audio/")) {
    const filename = url.pathname.slice("/__face/audio/".length);
    if (!/^[a-f0-9-]+\.wav$/.test(filename)) return response.writeHead(404).end();
    const path = resolve(AUDIO_DIR, filename);
    if (!existsSync(path)) return response.writeHead(404).end();
    response.writeHead(200, {"content-type": "audio/wav", "cache-control": "no-store"});
    return createReadStream(path).pipe(response);
  }

  if (request.method !== "GET" && request.method !== "HEAD") return response.writeHead(405).end();
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/FACE/";
  if (pathname.endsWith("/")) pathname += "index.html";
  const path = resolve(ROOT, `.${pathname}`);
  if (!(path === ROOT || path.startsWith(`${ROOT}${sep}`)) || !existsSync(path)) return response.writeHead(404).end();
  response.writeHead(200, {"content-type": MIME[extname(path)] || "application/octet-stream", "cache-control": "no-store"});
  if (request.method === "HEAD") return response.end();
  createReadStream(path).pipe(response);
});

await mkdir(AUDIO_DIR, {recursive: true});
await cleanOldAudio();
server.listen(PORT, HOST, () => {
  console.log(`FACE Codex mirror: http://${HOST}:${PORT}/FACE/`);
  console.log(`Voice: ${VOICE}`);
  console.log(`Send speech: curl -sS -X POST http://${HOST}:${PORT}/__face/speak -H 'content-type: application/json' --data '{"text":"Hello world"}'`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const client of clients) client.end();
    server.close(() => process.exit(0));
  });
}
