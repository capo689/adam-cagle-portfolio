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
let recordingStarted = 0;
let discardRecording = false;
let busy = false;
let holdRequested = false;
let activePointer: number | undefined;
let speechQueue = Promise.resolve();

function setStatus(value: string) {
  status.value = value;
}

function setControl(state: "idle" | "recording" | "thinking" | "speaking", label: string) {
  mic.dataset.state = state;
  micLabel.textContent = label;
}

function showTranscript(user: string, agent = "") {
  transcript.hidden = false;
  userLine.textContent = user;
  agentLine.textContent = agent;
  document.body.dataset.engaged = "true";
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
  const unlockPromise = window.FACETEST?.unlock();
  window.FACETEST?.stop();
  const media = await ensureMicrophone();
  await unlockPromise;
  chunks = [];
  const mimeType = preferredMimeType();
  recorder = new MediaRecorder(media, mimeType ? {mimeType} : undefined);
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.addEventListener("stop", () => {
    if (!discardRecording) processRecording().catch(handleError);
  }, {once: true});
  recorder.start(200);
  discardRecording = false;
  recordingStarted = performance.now();
  recording = true;
  mic.setAttribute("aria-pressed", "true");
  setControl("recording", "Listening · release to send");
  window.FACE?.setState("listening");
  setStatus("Troy · listening");
  if (!holdRequested) stopRecording();
}

function stopRecording() {
  if (!recording || !recorder) return;
  const heldFor = performance.now() - recordingStarted;
  recording = false;
  mic.setAttribute("aria-pressed", "false");
  setControl("thinking", heldFor < 350 ? "Hold a little longer" : "Sending…");
  if (heldFor < 350) {
    discardRecording = true;
    recorder.stop();
    setStatus("Troy · hold to talk");
    setTimeout(() => setControl("idle", "Push and hold to talk"), 700);
    return;
  }
  recorder.stop();
}

function beginHold() {
  if (busy || mic.disabled || holdRequested) return;
  holdRequested = true;
  startRecording().catch(handleError);
}

function endHold() {
  if (!holdRequested) return;
  holdRequested = false;
  stopRecording();
}

async function transcribe(blob: Blob) {
  const response = await fetch("/api/facetest-transcribe", {
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
  speechQueue = speechQueue.catch(() => {}).then(() => window.FACETEST?.speak(spoken));
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
  const response = await fetch("/api/facetest-chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({messages: history})
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Troy could not answer");
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
  if (!cleanReply) throw new Error("Troy returned an empty reply");
  history.push({role: "assistant", content: cleanReply});
  await speechQueue;
}

async function processRecording() {
  busy = true;
  mic.disabled = true;
  try {
    setControl("thinking", "Thinking…");
    setStatus("Troy · transcribing");
    window.FACE?.setState("thinking");
    const blob = new Blob(chunks, {type: recorder?.mimeType || "audio/webm"});
    const text = await transcribe(blob);
    showTranscript(text);
    setStatus("Troy · thinking");
    await askGroq(text);
    setStatus("Troy · ready");
  } finally {
    busy = false;
    mic.disabled = false;
    setControl("idle", "Push and hold to talk");
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
    setControl("thinking", "Thinking…");
    setStatus("Troy · thinking");
    window.FACE?.setState("thinking");
    await askGroq(clean);
    setStatus("Troy · ready");
  } finally {
    busy = false;
    mic.disabled = false;
    setControl("idle", "Push and hold to talk");
    window.FACE?.setState("listening");
  }
}

function handleError(error: unknown) {
  console.error(error);
  busy = false;
  recording = false;
  holdRequested = false;
  mic.disabled = false;
  mic.setAttribute("aria-pressed", "false");
  setControl("idle", "Try again");
  const message = errorMessage(error);
  setStatus(`Troy · ${message}`);
}

mic.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  activePointer = event.pointerId;
  mic.setPointerCapture(event.pointerId);
  beginHold();
});

for (const eventName of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
  mic.addEventListener(eventName, (event) => {
    if (activePointer !== undefined && event.pointerId !== activePointer) return;
    event.preventDefault();
    activePointer = undefined;
    endHold();
  });
}

mic.addEventListener("contextmenu", (event) => event.preventDefault());

function keyboardTargetIsEditable(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

window.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || keyboardTargetIsEditable(event.target) || mic.disabled) return;
  event.preventDefault();
  beginHold();
});

window.addEventListener("keyup", (event) => {
  if (event.code !== "Space" || keyboardTargetIsEditable(event.target)) return;
  event.preventDefault();
  endHold();
});

window.addEventListener("blur", endHold);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) endHold();
});

window.addEventListener("facetest:ready", () => {
  mic.disabled = false;
  setControl("idle", "Push and hold to talk");
  setStatus("Troy · ready");
});

window.addEventListener("facetest:voice-state", (event) => {
  if (busy || recording) return;
  const state = (event as CustomEvent<{state?: string}>).detail?.state;
  if (state === "speaking") {
    mic.disabled = true;
    setControl("speaking", "Troy is speaking");
    setStatus("Troy · speaking");
  } else if (state === "thinking") {
    mic.disabled = true;
    setControl("thinking", "Thinking…");
  } else if (state === "ready") {
    mic.disabled = false;
    setControl("idle", "Push and hold to talk");
    setStatus("Troy · ready");
  }
});

if (window.FACETEST) window.FACETEST.ask = ask;
