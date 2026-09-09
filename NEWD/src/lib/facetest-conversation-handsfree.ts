import { resolveSiteAction, type SiteAction } from "@/lib/site-actions";

export {};

type ChatMessage = {role: "user" | "assistant"; content: string};
type ExpressionCue = {name: string; intensity: number};
type InterfaceContext = {
  section: string;
  focus?: string;
  lastPresentationLabel?: string;
  lastPresentationText?: string;
};

const EXPRESSIONS = new Set(["neutral", "attentive", "curious", "warm", "amused", "delighted", "skeptical", "surprised", "concerned", "empathetic", "thinking", "wry", "playful", "proud"]);
const EXPRESSION_ALIASES: Record<string, string> = {
  thoughtful: "thinking",
  excited: "delighted",
  happy: "warm",
  confident: "proud",
  serious: "concerned"
};

const mic = document.querySelector<HTMLButtonElement>("#mic")!;
const micLabel = mic.querySelector<HTMLSpanElement>("span")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;
const transcript = document.querySelector<HTMLElement>("#transcript")!;
const userLine = document.querySelector<HTMLElement>("#user-line")!;
const agentLine = document.querySelector<HTMLElement>("#agent-line")!;
const textForm = document.querySelector<HTMLFormElement>("#ace-text-form")!;
const textInput = document.querySelector<HTMLInputElement>("#ace-text-input")!;
const textSend = document.querySelector<HTMLButtonElement>("#ace-text-send")!;
const agentName = document.body.dataset.voiceName || "Ethan";

const history: ChatMessage[] = [];
let lastPresentation: {label: string; text: string} | undefined;
let media: MediaStream | undefined;
let recorder: MediaRecorder | undefined;
let chunks: Blob[] = [];
let recording = false;
let discardRecording = false;
let recordingStarted = 0;
let pressActive = false;
let pressGeneration = 0;
let activePointerId: number | undefined;
let sessionActive = false;
let busy = false;
let speaking = false;
let outOfCredits = false;
let speechQueue = Promise.resolve();
let turnGeneration = 0;
let activeChatRequest: AbortController | undefined;

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
  mic.setAttribute("aria-label", state === "recording" ? "Release to send to ACE" : state === "thinking" || state === "speaking" ? "Stop ACE" : "Hold to talk to ACE. Release to send.");
}

function showTranscript(user: string, agent = "") {
  transcript.hidden = false;
  transcript.dataset.mode = "conversation";
  userLine.textContent = user;
  agentLine.textContent = agent;
  document.body.dataset.engaged = "true";
  window.requestAnimationFrame(() => transcript.scrollTo({top: transcript.scrollHeight, behavior: "smooth"}));
}

function remember(message: ChatMessage) {
  history.push(message);
  if (history.length > 10) history.splice(0, history.length - 10);
}

function visibleInterfaceContext(destination?: string): InterfaceContext {
  const experience = document.querySelector<HTMLElement>(".experience");
  const section = destination && ["Home", "AI", "Brand", "Copywriting", "Fun"].includes(destination)
    ? destination
    : experience?.dataset.section || "Home";
  const guided = document.querySelector<HTMLElement>(".guided-workflow-viewer");
  const dialog = document.querySelector<HTMLElement>(
    ".ai-detail[role='dialog'], .copy-client-detail[role='dialog'], .profile-modal[role='dialog'], .brand-book-shell[role='dialog']"
  );
  const focusElement = guided || dialog;
  const focusTitle = focusElement
    ?.querySelector<HTMLElement>("h1, h2, h3, header strong")
    ?.textContent?.replace(/\s+/g, " ").trim();
  const focusLabel = focusElement?.getAttribute("aria-label")?.replace(/\s+/g, " ").trim();

  return {
    section,
    focus: focusTitle || focusLabel || (destination ? `${destination} view` : undefined),
    lastPresentationLabel: lastPresentation?.label,
    lastPresentationText: lastPresentation?.text,
  };
}

window.addEventListener("facetest:narration-transcript", (event) => {
  const detail = (event as CustomEvent<{context?: string; text?: string}>).detail;
  const text = detail?.text?.trim();
  if (!text) return;
  const label = detail.context?.trim() || "ACE presentation";
  lastPresentation = {label, text: text.slice(0, 900)};
  const memory = `[ACE PRESENTATION: ${label}] ${text}`.slice(0, 1100);
  if (history.at(-1)?.content !== memory) remember({role: "assistant", content: memory});
  transcript.hidden = false;
  transcript.dataset.mode = "narration";
  userLine.textContent = detail.context || "ACE presentation";
  agentLine.textContent = text;
  document.body.dataset.engaged = "true";
  window.requestAnimationFrame(() => {
    transcript.scrollTo({top: Math.max(0, agentLine.offsetTop - transcript.offsetTop - 14), behavior: "smooth"});
  });
});

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
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
  media ||= await navigator.mediaDevices.getUserMedia({
    audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}
  });
  return media;
}

function releaseMicrophone() {
  for (const track of media?.getTracks() || []) track.stop();
  media = undefined;
}

function cancelCurrentTurn() {
  turnGeneration++;
  activeChatRequest?.abort();
  activeChatRequest = undefined;
  window.FACETEST?.stop();
  speechQueue = Promise.resolve();
  busy = false;
  speaking = false;
}

async function beginUtterance() {
  if (!sessionActive || recording || busy || speaking || !pressActive) return;
  const generation = ++pressGeneration;
  const source = await ensureMicrophone();
  if (generation !== pressGeneration || !sessionActive || !pressActive || recording || busy || speaking) {
    releaseMicrophone();
    return;
  }

  chunks = [];
  discardRecording = false;
  const mimeType = preferredMimeType();
  const activeRecorder = new MediaRecorder(source, mimeType ? {mimeType} : undefined);
  recorder = activeRecorder;
  activeRecorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  activeRecorder.addEventListener("stop", () => {
    const discarded = discardRecording;
    const blob = new Blob(chunks, {type: activeRecorder.mimeType || "audio/webm"});
    recorder = undefined;
    releaseMicrophone();
    if (discarded || !blob.size) return;
    processUtterance(blob).catch(handleError);
  }, {once: true});
  activeRecorder.start(100);
  recording = true;
  recordingStarted = performance.now();
  mic.setAttribute("aria-pressed", "true");
  setControl("recording", "Listening · release to send");
  setStatus(`${agentName} · listening`);
  window.FACE?.setState("listening");
}

function finishUtterance(discard = false) {
  if (!recording || !recorder) return;
  recording = false;
  const duration = performance.now() - recordingStarted;
  const shouldDiscard = discard || duration < 220;
  discardRecording = shouldDiscard;
  mic.setAttribute("aria-pressed", "false");
  if (!shouldDiscard) {
    busy = true;
    setControl("thinking", "Stop ACE");
    setStatus(`${agentName} · transcribing`);
    window.FACE?.setState("thinking");
  } else if (sessionActive) {
    setControl("idle", "Hold to talk");
    setStatus(`${agentName} · ready`);
    window.FACE?.setState("idle");
  }
  if (recorder.state !== "inactive") recorder.stop();
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

function queueSpeech(text: string, cue: ExpressionCue | undefined, generation: number) {
  const spoken = text.replace(/\s+/g, " ").trim();
  if (!spoken) return;
  const performance = cue ? {...cue} : undefined;
  const duration = Math.min(9.5, Math.max(4.2, 3.3 + spoken.length / 30));
  speechQueue = speechQueue.catch(() => {}).then(async () => {
    if (generation !== turnGeneration || !sessionActive) return;
    if (performance) window.FACE?.perform(performance.name, performance.intensity, duration);
    await window.FACETEST?.speak(spoken, performance);
  });
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

function normalizeCue(name: string, intensity: number, fallback: ExpressionCue): ExpressionCue {
  const normalized = name.toLowerCase();
  const expression = EXPRESSION_ALIASES[normalized] || normalized;
  return {
    name: EXPRESSIONS.has(expression) ? expression : fallback.name,
    intensity: Math.min(1, Math.max(.2, Number(intensity) || fallback.intensity))
  };
}

function inferNextBeat(sentence: string, previous: ExpressionCue): ExpressionCue {
  const value = sentence.toLowerCase();
  if (/\b(proof|result|built|created|shipped|led|grew|won|adopted|working)\b/.test(value)) return {name: "proud", intensity: .72};
  if (/\b(but|however|not|never|can't|cannot|risk|hard|rare)\b/.test(value)) return {name: "skeptical", intensity: .58};
  if (/\b(love|great|beautiful|human|together|trust)\b/.test(value)) return {name: "warm", intensity: .66};
  if (/\b(funny|joke|ridiculous|absurd|honestly)\b/.test(value)) return {name: "wry", intensity: .62};
  if (/\b(why|how|idea|possibility|imagine|wonder)\b/.test(value)) return {name: "curious", intensity: .61};
  const contrast: Record<string, ExpressionCue> = {
    thinking: {name: "proud", intensity: .68},
    curious: {name: "proud", intensity: .68},
    proud: {name: "wry", intensity: .58},
    skeptical: {name: "warm", intensity: .60},
    concerned: {name: "empathetic", intensity: .62},
    empathetic: {name: "warm", intensity: .62},
    warm: {name: "proud", intensity: .64},
    delighted: {name: "playful", intensity: .62}
  };
  return contrast[previous.name] || {name: "warm", intensity: .58};
}

async function askGroq(userText: string, generation: number, destination?: string) {
  remember({role: "user", content: userText});
  const inferred = inferExpression(userText);
  window.FACE?.perform(inferred.name, inferred.intensity, 4.8);
  activeChatRequest = new AbortController();
  const response = await fetch("/api/facetest-next-chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    signal: activeChatRequest.signal,
    body: JSON.stringify({
      messages: history,
      context: visibleInterfaceContext(destination),
    })
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw upstreamError(response, data, `${agentName} could not answer`);
  }
  const prerecordedAudio = response.headers.get("x-facetest-audio");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let reply = "";
  let streamBuffer = "";
  let sentenceBuffer = "";
  let activeCue: ExpressionCue = inferred;
  let cueVersion = 0;
  let lastQueuedCue: ExpressionCue | undefined;
  let lastQueuedCueVersion = -1;

  function queueSentence(sentence: string) {
    let cue = activeCue;
    if (lastQueuedCue && (cueVersion === lastQueuedCueVersion || cue.name === lastQueuedCue.name)) cue = inferNextBeat(sentence, lastQueuedCue);
    if (!prerecordedAudio) queueSpeech(sentence, cue, generation);
    lastQueuedCue = cue;
    lastQueuedCueVersion = cueVersion;
  }

  function appendVisible(token: string) {
    if (!token || generation !== turnGeneration) return;
    reply += token;
    sentenceBuffer += token;
    agentLine.textContent = reply.trim();
    const extracted = extractSentences(sentenceBuffer);
    sentenceBuffer = extracted.rest;
    extracted.sentences.forEach(queueSentence);
  }

  function consumeToken(token: string, done = false) {
    streamBuffer += token;
    for (;;) {
      const cueStart = streamBuffer.indexOf("[[");
      if (cueStart < 0) {
        const keep = done ? 0 : streamBuffer.endsWith("[[") ? 2 : streamBuffer.endsWith("[") ? 1 : 0;
        const safeLength = streamBuffer.length - keep;
        appendVisible(streamBuffer.slice(0, safeLength));
        streamBuffer = streamBuffer.slice(safeLength);
        return;
      }
      if (cueStart > 0) {
        appendVisible(streamBuffer.slice(0, cueStart));
        streamBuffer = streamBuffer.slice(cueStart);
        continue;
      }
      const cueEnd = streamBuffer.indexOf("]]", 2);
      if (cueEnd < 0) {
        if (done || streamBuffer.length > 96) streamBuffer = "";
        return;
      }
      const marker = streamBuffer.slice(0, cueEnd + 2);
      const cue = marker.match(/^\[\[(?:face:)?([a-z]+):([0-9.]+)\]\]$/i);
      if (cue) {
        activeCue = normalizeCue(cue[1], Number(cue[2]), activeCue);
        cueVersion++;
      }
      streamBuffer = streamBuffer.slice(cueEnd + 2);
    }
  }

  for (;;) {
    const {done, value} = await reader.read();
    consumeToken(decoder.decode(value || new Uint8Array(), {stream: !done}), done);
    if (done) break;
  }
  consumeToken("", true);
  extractSentences(sentenceBuffer, true).sentences.forEach(queueSentence);
  const cleanReply = reply.trim();
  if (!cleanReply) throw new Error(`${agentName} returned an empty reply`);
  if (generation === turnGeneration) remember({role: "assistant", content: cleanReply});
  if (prerecordedAudio && generation === turnGeneration) {
    await window.FACETEST?.playAudio(prerecordedAudio, lastQueuedCue || inferred);
  } else {
    await speechQueue;
  }
  activeChatRequest = undefined;
}

function inferExpression(text: string): ExpressionCue {
  const value = text.toLowerCase();
  if (/\b(wow|amazing|incredible|no way|holy)\b/.test(value)) return {name: "surprised", intensity: .72};
  if (/\b(sad|sorry|hurt|died|loss|afraid|scared|worried)\b/.test(value)) return {name: "empathetic", intensity: .74};
  if (/\b(lol|haha|funny|joke|hilarious)\b/.test(value)) return {name: "amused", intensity: .76};
  if (/\b(really|sure|seriously|prove|doubt)\b/.test(value)) return {name: "skeptical", intensity: .55};
  if (/\b(love|beautiful|wonderful|great|excellent)\b/.test(value)) return {name: "warm", intensity: .68};
  if (/\?$/.test(value.trim()) || /\b(why|how|what if|wonder)\b/.test(value)) return {name: "curious", intensity: .58};
  return {name: "attentive", intensity: .44};
}

const sectionRoots: Record<SiteAction["section"], string> = {
  Home: ".hero-copy",
  AI: ".ai-page",
  Brand: ".brand-page",
  Copywriting: ".copy-editorial",
  Fun: ".fun-page",
};

function waitForElement(selector: string, generation: number, timeout = 1800) {
  return new Promise<boolean>((resolve) => {
    const started = performance.now();
    const check = () => {
      if (generation !== turnGeneration) return resolve(false);
      if (document.querySelector(selector)) return resolve(true);
      if (performance.now() - started >= timeout) return resolve(false);
      window.requestAnimationFrame(check);
    };
    check();
  });
}

async function performSiteAction(userText: string, action: SiteAction, generation: number) {
  remember({role: "user", content: userText});
  remember({role: "assistant", content: action.confirmation});
  showTranscript(userText, action.confirmation);
  window.FACE?.perform("warm", .68, 5.5);
  const confirmationSpeech = window.FACETEST?.speak(action.confirmation, {name: "warm", intensity: .68});

  if (action.kind === "section") {
    await confirmationSpeech?.catch(() => {});
    if (generation !== turnGeneration) return;
    window.dispatchEvent(new CustomEvent("newd:navigate", {detail: {section: action.section, suppressIntro: false}}));
    return;
  }

  window.dispatchEvent(new CustomEvent("newd:navigate", {detail: {section: action.section, suppressIntro: true}}));
  const mounted = await waitForElement(sectionRoots[action.section], generation);
  if (!mounted || generation !== turnGeneration) return;
  await confirmationSpeech?.catch(() => {});
  if (generation !== turnGeneration) return;
  await new Promise((resolve) => window.setTimeout(resolve, 80));
  if (generation !== turnGeneration) return;

  if (action.kind === "profile") {
    window.dispatchEvent(new CustomEvent("newd:open-profile", {detail: {profile: action.target}}));
  } else if (action.kind === "copy-case") {
    window.dispatchEvent(new CustomEvent("newd:open-copy-case", {detail: {id: action.target}}));
  } else if (action.kind === "copy-filter") {
    window.dispatchEvent(new CustomEvent("newd:filter-copy", {detail: {filter: action.target}}));
  } else if (action.kind === "ai-item") {
    window.dispatchEvent(new CustomEvent("newd:open-ai-item", {detail: {id: action.target}}));
  } else if (action.kind === "ai-workflow") {
    window.dispatchEvent(new CustomEvent("newd:open-ai-workflow", {detail: {id: action.target}}));
  } else if (action.kind === "brand-feature") {
    window.dispatchEvent(new CustomEvent("newd:open-brand-feature", {detail: {id: action.target}}));
  } else if (action.kind === "brand-client") {
    window.dispatchEvent(new CustomEvent("newd:open-brand-client", {detail: {name: action.target}}));
  }
}

function isStopCommand(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^ace\s+/, "")
    .replace(/\s+please$/, "")
    .replace(/\s+now$/, "");
  return /^(stop|stop talking|stop speaking|stop listening|pause|pause conversation|be quiet|quiet|shut up|that's enough|that is enough|enough|cancel)$/.test(normalized);
}

async function answerText(text: string, generation: number) {
  if (!text || generation !== turnGeneration || !sessionActive) return;
  showTranscript(text, "");
  if (isStopCommand(text)) {
    hardStop();
    return;
  }
  const action = resolveSiteAction(text);
  setControl("thinking", "Stop ACE");
  setStatus(`${agentName} · thinking`);
  window.FACE?.setState("thinking");
  if (action) {
    await performSiteAction(text, action, generation);
    return;
  }
  await askGroq(text, generation);
}

function settleTurn(generation: number) {
  if (generation !== turnGeneration) return;
  busy = false;
  speaking = false;
  if (sessionActive && !outOfCredits) {
    setControl("idle", "Hold to talk");
    setStatus(`${agentName} · ready`);
    window.FACE?.setState("idle");
  }
}

async function processUtterance(blob: Blob) {
  const generation = ++turnGeneration;
  try {
    const text = await transcribe(blob);
    await answerText(text, generation);
  } catch (error) {
    if (!isAbort(error) && generation === turnGeneration) throw error;
  } finally {
    settleTurn(generation);
  }
}

async function processTypedMessage(value: string) {
  const text = value.trim();
  if (!text || outOfCredits || !siteIsReady()) return;
  if (busy || speaking || recording) hardStop();
  if (!sessionActive) await startConversation();
  const generation = ++turnGeneration;
  busy = true;
  try {
    await answerText(text, generation);
  } catch (error) {
    if (!isAbort(error) && generation === turnGeneration) throw error;
  } finally {
    settleTurn(generation);
  }
}

async function startConversation() {
  if (sessionActive || outOfCredits) return;
  sessionActive = true;
  try {
    await window.FACETEST?.unlock();
  } catch (error) {
    sessionActive = false;
    throw error;
  }
  mic.setAttribute("aria-pressed", "false");
  setControl("idle", "Hold to talk");
  setStatus(`${agentName} · ready`);
  window.FACE?.setState("idle");
  window.dispatchEvent(new CustomEvent("facetest:conversation-state", {detail: {active: true}}));
}

function hardStop() {
  pressActive = false;
  pressGeneration++;
  if (recording) finishUtterance(true);
  cancelCurrentTurn();
  releaseMicrophone();
  if (!sessionActive || outOfCredits) return;
  mic.setAttribute("aria-pressed", "false");
  setControl("idle", "Hold to talk");
  setStatus(`${agentName} · ready`);
  window.FACE?.setState("idle");
  window.dispatchEvent(new CustomEvent("facetest:speech-stopped"));
}

function stopConversation() {
  if (!sessionActive) return;
  sessionActive = false;
  pressActive = false;
  pressGeneration++;
  if (recording) finishUtterance(true);
  cancelCurrentTurn();
  releaseMicrophone();
  mic.setAttribute("aria-pressed", "false");
  setControl("idle", "Hold to talk");
  setStatus(`${agentName} · voice off`);
  window.FACE?.setState("idle");
  window.dispatchEvent(new CustomEvent("facetest:conversation-state", {detail: {active: false}}));
}

function handleError(error: unknown) {
  console.error(error);
  busy = false;
  speaking = false;
  recording = false;
  pressActive = false;
  releaseMicrophone();
  if (error instanceof GroqQuotaError || (error instanceof Error && error.name === "GroqQuotaError")) {
    outOfCredits = true;
    stopConversation();
    mic.disabled = true;
    textInput.disabled = true;
    textSend.disabled = true;
    setControl("exhausted", "Out of credits");
    setStatus("Groq credits exhausted · try again later");
    window.FACE?.perform("concerned", .68, 8);
    return;
  }
  if (sessionActive) {
    setControl("idle", "Hold to talk");
    setStatus(`${agentName} · ${errorMessage(error)}`);
  } else {
    setControl("idle", "Hold to talk");
    setStatus(`${agentName} · ${errorMessage(error)}`);
  }
}

function isEditableTarget(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

function siteIsReady() {
  return document.querySelector<HTMLElement>(".experience")?.dataset.phase === "site";
}

async function startPress() {
  if (outOfCredits || !siteIsReady()) return;
  if (busy || speaking || mic.dataset.state === "thinking" || mic.dataset.state === "speaking") {
    hardStop();
    return;
  }
  pressActive = true;
  if (!sessionActive) await startConversation();
  await beginUtterance();
}

function endPress(discard = false) {
  if (!pressActive && !recording) return;
  pressActive = false;
  pressGeneration++;
  if (recording) finishUtterance(discard);
}

textForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;
  textInput.value = "";
  processTypedMessage(text).catch(handleError);
});

mic.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  event.preventDefault();
  if (activePointerId !== undefined) return;
  activePointerId = event.pointerId;
  mic.setPointerCapture?.(event.pointerId);
  startPress().catch(handleError);
});

function releasePointer(event: PointerEvent, discard = false) {
  if (activePointerId !== event.pointerId) return;
  event.preventDefault();
  const pointerId = activePointerId;
  activePointerId = undefined;
  if (mic.hasPointerCapture?.(pointerId)) mic.releasePointerCapture?.(pointerId);
  endPress(discard);
}

window.addEventListener("pointerup", (event) => releasePointer(event), true);
window.addEventListener("pointercancel", (event) => releasePointer(event, true), true);

mic.addEventListener("lostpointercapture", (event) => {
  if (activePointerId !== event.pointerId) return;
  activePointerId = undefined;
  endPress(true);
});

window.addEventListener("blur", () => {
  activePointerId = undefined;
  endPress(true);
});

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  activePointerId = undefined;
  endPress(true);
});

document.addEventListener("keydown", (event) => {
  if (event.code !== "Space" || event.repeat || isEditableTarget(event.target)) return;
  event.preventDefault();
  startPress().catch(handleError);
});

document.addEventListener("keyup", (event) => {
  if (event.code !== "Space" || isEditableTarget(event.target)) return;
  event.preventDefault();
  endPress();
});

window.addEventListener("facetest:enable-conversation", () => {
  startConversation().catch(handleError);
});

window.addEventListener("facetest:ready", () => {
  if (outOfCredits) return;
  mic.disabled = false;
  setControl("idle", "Hold to talk");
  setStatus(`${agentName} · ready`);
});

window.addEventListener("facetest:voice-state", (event) => {
  if (outOfCredits) return;
  const state = (event as CustomEvent<{state?: string}>).detail?.state;
  if (state === "speaking") {
    speaking = true;
    setControl("speaking", "Stop ACE");
    setStatus(`${agentName} · speaking`);
  } else if (state === "thinking") {
    speaking = true;
    setControl("thinking", "Stop ACE");
    setStatus(`${agentName} · thinking`);
  } else if (state === "paused") {
    speaking = true;
    setControl("speaking", "Stop ACE");
  } else if (state === "ready") {
    speaking = false;
    if (siteIsReady()) {
      setControl("idle", "Hold to talk");
      setStatus(`${agentName} · ready`);
      window.FACE?.setState("idle");
    }
  }
});

window.addEventListener("pagehide", stopConversation);
