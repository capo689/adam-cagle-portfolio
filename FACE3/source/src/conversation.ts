export {};

type ChatMessage = {role: "user" | "assistant"; content: string};

const mic = document.querySelector<HTMLButtonElement>("#mic")!;
const micLabel = mic.querySelector<HTMLSpanElement>("span")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;
const transcript = document.querySelector<HTMLElement>("#transcript")!;
const userLine = document.querySelector<HTMLElement>("#user-line")!;
const agentLine = document.querySelector<HTMLElement>("#agent-line")!;

const history: ChatMessage[] = [];
let stream: MediaStream | undefined;
let recorder: MediaRecorder | undefined;
let chunks: Blob[] = [];
let recording = false;
let busy = false;
let speechQueue = Promise.resolve();

function setStatus(value: string) {
  status.value = value;
}

function showTranscript(user: string, agent = "") {
  transcript.hidden = false;
  userLine.textContent = user;
  agentLine.textContent = agent;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function preferredMimeType() {
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
    .find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

async function ensureMicrophone() {
  stream ||= await navigator.mediaDevices.getUserMedia({
    audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}
  });
  return stream;
}

async function startRecording() {
  if (busy || recording) return;
  window.FACE3?.stop();
  const media = await ensureMicrophone();
  chunks = [];
  const mimeType = preferredMimeType();
  recorder = new MediaRecorder(media, mimeType ? {mimeType} : undefined);
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.addEventListener("stop", () => processRecording().catch(handleError), {once: true});
  recorder.start(250);
  recording = true;
  mic.dataset.active = "true";
  micLabel.textContent = "Listening";
  window.FACE?.setState("listening");
  setStatus("Groq · listening · tap to send");
}

function stopRecording() {
  if (!recording || !recorder) return;
  recording = false;
  mic.dataset.active = "false";
  micLabel.textContent = "Talk";
  recorder.stop();
}

async function transcribe(blob: Blob) {
  const response = await fetch("/api/face3-transcribe", {
    method: "POST",
    headers: {"Content-Type": blob.type || "audio/webm"},
    body: blob
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Transcription failed");
  return String(data.text || "").trim();
}

function queueSpeech(text: string) {
  const spoken = text.replace(/\s+/g, " ").trim();
  if (!spoken) return;
  speechQueue = speechQueue.then(() => window.FACE3?.speak(spoken));
}

function extractSentences(buffer: string, flush = false) {
  const sentences: string[] = [];
  let rest = buffer;
  const pattern = /^([\s\S]*?[.!?])(?:\s+|$)/;
  for (;;) {
    const match = rest.match(pattern);
    if (!match || match[1].trim().length < 12) break;
    sentences.push(match[1].trim());
    rest = rest.slice(match[0].length);
  }
  if (flush && rest.trim()) {
    sentences.push(rest.trim());
    rest = "";
  }
  return {sentences, rest};
}

async function askGroq(userText: string) {
  history.push({role: "user", content: userText});
  const response = await fetch("/api/face3-chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({messages: history})
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Groq could not answer");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = "";
  let sentenceBuffer = "";
  for (;;) {
    const {done, value} = await reader.read();
    const token = decoder.decode(value || new Uint8Array(), {stream: !done});
    reply += token;
    sentenceBuffer += token;
    agentLine.textContent = reply.trim();
    const extracted = extractSentences(sentenceBuffer, done);
    sentenceBuffer = extracted.rest;
    extracted.sentences.forEach(queueSpeech);
    if (done) break;
  }
  const cleanReply = reply.trim();
  if (!cleanReply) throw new Error("Groq returned an empty reply");
  history.push({role: "assistant", content: cleanReply});
  await speechQueue;
}

async function processRecording() {
  busy = true;
  mic.disabled = true;
  try {
    setStatus("Groq · transcribing");
    window.FACE?.setState("thinking");
    const blob = new Blob(chunks, {type: recorder?.mimeType || "audio/webm"});
    const text = await transcribe(blob);
    showTranscript(text);
    setStatus("Groq · thinking");
    await askGroq(text);
    setStatus("Groq · ready");
  } finally {
    busy = false;
    mic.disabled = false;
    micLabel.textContent = "Talk";
    window.FACE?.setState("listening");
  }
}

async function ask(text: string) {
  const clean = text.trim();
  if (!clean || busy) return;
  busy = true;
  mic.disabled = true;
  try {
    showTranscript(clean);
    setStatus("Groq · thinking");
    window.FACE?.setState("thinking");
    await askGroq(clean);
    setStatus("Groq · ready");
  } finally {
    busy = false;
    mic.disabled = false;
    window.FACE?.setState("listening");
  }
}

function handleError(error: unknown) {
  console.error(error);
  busy = false;
  recording = false;
  mic.disabled = false;
  mic.dataset.active = "false";
  micLabel.textContent = "Retry";
  const message = errorMessage(error);
  setStatus(`Groq · ${message}`);
  agentLine.textContent = message;
  transcript.hidden = false;
}

mic.addEventListener("click", () => {
  if (recording) stopRecording();
  else startRecording().catch(handleError);
});

window.addEventListener("face3:ready", () => {
  mic.hidden = false;
  setStatus("Groq · ready");
});

if (window.FACE3) window.FACE3.ask = ask;
