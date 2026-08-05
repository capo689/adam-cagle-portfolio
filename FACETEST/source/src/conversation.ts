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
let outOfCredits = false;

class GroqQuotaError extends Error {
  constructor(message = "Groq credits are exhausted") {
    super(message);
    this.name = "GroqQuotaError";
  }
}

function setStatus(value: string) {
  status.value = value;
}

function setControl(state: "idle" | "recording" | "thinking" | "speaking" | "exhausted", label: string) {
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

function upstreamError(response: Response, data: Record<string, unknown>, fallback: string) {
  const message = typeof data.error === "string" ? data.error : fallback;
  return response.status === 429 && data.code === "GROQ_QUOTA_EXHAUSTED" ? new GroqQuotaError(message) : new Error(message);
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

async function beginHold() {
  if (busy || mic.disabled || holdRequested) return;
  holdRequested = true;
  try {
    if (await window.FACETEST?.introduce()) {
      holdRequested = false;
      return;
    }
    if (holdRequested) await startRecording();
  } catch (error) {
    handleError(error);
  }
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
  if (!response.ok) throw upstreamError(response, data, "Transcription failed");
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
  const inferred = inferExpression(userText);
  window.FACE?.perform(inferred.name, inferred.intensity, 4.8);
  const response = await fetch("/api/facetest-next-chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({messages: history})
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw upstreamError(response, data, "Troy could not answer");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = "";
  let cueBuffer = "";
  let cueResolved = false;
  let sentenceBuffer = "";

  function appendVisible(token: string) {
    if (!token) return;
    reply += token;
    sentenceBuffer += token;
    agentLine.textContent = reply.trim();
    const extracted = extractSentences(sentenceBuffer);
    sentenceBuffer = extracted.rest;
    extracted.sentences.forEach(queueSpeech);
  }

  function consumeToken(token: string, done = false) {
    if (cueResolved) return appendVisible(token);
    cueBuffer += token;
    const cue = cueBuffer.match(/^\s*\[\[(?:face:)?([a-z]+):([0-9.]+)\]\]\s*/i);
    if (cue) {
      window.FACE?.perform(cue[1].toLowerCase(), Number(cue[2]), 7.5);
      cueResolved = true;
      appendVisible(cueBuffer.slice(cue[0].length));
      cueBuffer = "";
      return;
    }
    const clearlyNotCue = cueBuffer.trim().length > 5 && !cueBuffer.trimStart().startsWith("[[");
    if (done || cueBuffer.length > 96 || clearlyNotCue) {
      cueResolved = true;
      appendVisible(cueBuffer.replace(/^\s*\[\[(?:face:)?[^\]]*\]\]\s*/i, ""));
      cueBuffer = "";
    }
  }

  for (;;) {
    const {done, value} = await reader.read();
    const token = decoder.decode(value || new Uint8Array(), {stream: !done});
    consumeToken(token, done);
    if (done) break;
  }
  const extracted = extractSentences(sentenceBuffer, true);
  extracted.sentences.forEach(queueSpeech);
  const cleanReply = reply.trim();
  if (!cleanReply) throw new Error("Troy returned an empty reply");
  history.push({role: "assistant", content: cleanReply});
  await speechQueue;
}

function inferExpression(text: string) {
  const value = text.toLowerCase();
  if (/\b(wow|amazing|incredible|no way|holy)\b/.test(value)) return {name: "surprised", intensity: .72};
  if (/\b(sad|sorry|hurt|died|loss|afraid|scared|worried)\b/.test(value)) return {name: "empathetic", intensity: .74};
  if (/\b(lol|haha|funny|joke|hilarious)\b/.test(value)) return {name: "amused", intensity: .76};
  if (/\b(really|sure|seriously|prove|doubt)\b/.test(value)) return {name: "skeptical", intensity: .55};
  if (/\b(love|beautiful|wonderful|great|excellent)\b/.test(value)) return {name: "warm", intensity: .68};
  if (/\?$/.test(value.trim()) || /\b(why|how|what if|wonder)\b/.test(value)) return {name: "curious", intensity: .58};
  return {name: "attentive", intensity: .44};
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
    if (!outOfCredits) {
      mic.disabled = false;
      setControl("idle", "Push and hold to talk");
      window.FACE?.setState("listening");
    }
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
    if (!outOfCredits) {
      mic.disabled = false;
      setControl("idle", "Push and hold to talk");
      window.FACE?.setState("listening");
    }
  }
}

function handleError(error: unknown) {
  console.error(error);
  busy = false;
  recording = false;
  holdRequested = false;
  mic.setAttribute("aria-pressed", "false");
  if (error instanceof GroqQuotaError || (error instanceof Error && error.name === "GroqQuotaError")) {
    outOfCredits = true;
    mic.disabled = true;
    mic.setAttribute("aria-label", "Groq credits exhausted");
    setControl("exhausted", "Out of credits");
    setStatus("Groq credits exhausted · try again later");
    window.FACE?.perform("concerned", .68, 8);
    return;
  }
  mic.disabled = false;
  setControl("idle", "Try again");
  const message = errorMessage(error);
  setStatus(`Troy · ${message}`);
}

mic.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  activePointer = event.pointerId;
  mic.setPointerCapture(event.pointerId);
  beginHold().catch(handleError);
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
  beginHold().catch(handleError);
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
  if (outOfCredits) return;
  mic.disabled = false;
  setControl("idle", "Push and hold to talk");
  setStatus("Troy · ready");
});

window.addEventListener("facetest:intro-pending", () => {
  if (outOfCredits) return;
  mic.disabled = false;
  setControl("idle", "Tap once to hear Troy");
  setStatus("Tap to hear Troy introduce himself");
});

window.addEventListener("facetest:voice-state", (event) => {
  if (busy || recording || outOfCredits) return;
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
