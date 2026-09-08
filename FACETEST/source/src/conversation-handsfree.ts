export {};

type ChatMessage = {role: "user" | "assistant"; content: string};
type ExpressionCue = {name: string; intensity: number};

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
const agentName = document.body.dataset.voiceName || "Ethan";

const history: ChatMessage[] = [];
let media: MediaStream | undefined;
let vadContext: AudioContext | undefined;
let vadAnalyser: AnalyserNode | undefined;
let vadFrame = 0;
let recorder: MediaRecorder | undefined;
let chunks: Blob[] = [];
let recording = false;
let discardRecording = false;
let recordingStarted = 0;
let lastVoiceAt = 0;
let noiseFloor = .009;
let onsetFrames = 0;
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

function cancelCurrentTurn() {
  turnGeneration++;
  activeChatRequest?.abort();
  activeChatRequest = undefined;
  window.FACETEST?.stop();
  speechQueue = Promise.resolve();
  busy = false;
  speaking = false;
}

function beginUtterance() {
  if (!sessionActive || recording || (busy && !speaking)) return;
  if (speaking) cancelCurrentTurn();
  const source = media;
  if (!source) return;

  chunks = [];
  discardRecording = false;
  const mimeType = preferredMimeType();
  recorder = new MediaRecorder(source, mimeType ? {mimeType} : undefined);
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size) chunks.push(event.data);
  });
  recorder.addEventListener("stop", () => {
    if (discardRecording) return;
    const blob = new Blob(chunks, {type: recorder?.mimeType || "audio/webm"});
    processUtterance(blob).catch(handleError);
  }, {once: true});
  recorder.start(100);
  recording = true;
  recordingStarted = performance.now();
  lastVoiceAt = recordingStarted;
  mic.setAttribute("aria-pressed", "true");
  setControl("recording", "Listening · pause when finished");
  setStatus(`${agentName} · listening`);
  window.FACE?.setState("listening");
}

function finishUtterance(discard = false) {
  if (!recording || !recorder) return;
  recording = false;
  discardRecording = discard;
  mic.setAttribute("aria-pressed", sessionActive ? "true" : "false");
  if (!discard) {
    busy = true;
    setControl("thinking", "Thinking…");
    setStatus(`${agentName} · transcribing`);
    window.FACE?.setState("thinking");
  }
  if (recorder.state !== "inactive") recorder.stop();
}

function monitorVoice() {
  if (!vadAnalyser || !sessionActive) return;
  const waveform = new Uint8Array(vadAnalyser.fftSize);

  const frame = () => {
    if (!vadAnalyser || !sessionActive) return;
    vadAnalyser.getByteTimeDomainData(waveform);
    let energy = 0;
    for (const sample of waveform) {
      const value = (sample - 128) / 128;
      energy += value * value;
    }
    const rms = Math.sqrt(energy / waveform.length);
    const now = performance.now();

    if (recording) {
      const speechThreshold = Math.max(.013, noiseFloor * 2.15);
      if (rms > speechThreshold) lastVoiceAt = now;
      const hasEnoughAudio = now - recordingStarted > 420;
      if ((hasEnoughAudio && now - lastVoiceAt > 720) || now - recordingStarted > 18000) finishUtterance();
    } else {
      if (!busy && rms < Math.max(.025, noiseFloor * 2.5)) noiseFloor += (rms - noiseFloor) * .025;
      const threshold = speaking ? Math.max(.052, noiseFloor * 5.5) : Math.max(.017, noiseFloor * 3.05);
      const mayListen = !busy || speaking;
      onsetFrames = mayListen && rms > threshold ? onsetFrames + 1 : 0;
      const requiredFrames = speaking ? 8 : 4;
      if (onsetFrames >= requiredFrames) {
        onsetFrames = 0;
        beginUtterance();
      }
    }
    vadFrame = requestAnimationFrame(frame);
  };
  frame();
}

async function startVoiceDetection() {
  const source = await ensureMicrophone();
  vadContext = new AudioContext();
  await vadContext.resume();
  const input = vadContext.createMediaStreamSource(source);
  const highPass = vadContext.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 90;
  vadAnalyser = vadContext.createAnalyser();
  vadAnalyser.fftSize = 1024;
  vadAnalyser.smoothingTimeConstant = .35;
  input.connect(highPass).connect(vadAnalyser);
  monitorVoice();
}

function stopVoiceDetection() {
  cancelAnimationFrame(vadFrame);
  vadFrame = 0;
  vadAnalyser = undefined;
  vadContext?.close().catch(() => {});
  vadContext = undefined;
  for (const track of media?.getTracks() || []) track.stop();
  media = undefined;
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

async function askGroq(userText: string, generation: number) {
  history.push({role: "user", content: userText});
  const inferred = inferExpression(userText);
  window.FACE?.perform(inferred.name, inferred.intensity, 4.8);
  activeChatRequest = new AbortController();
  const response = await fetch("/api/facetest-next-chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    signal: activeChatRequest.signal,
    body: JSON.stringify({messages: history})
  });
  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => ({}));
    throw upstreamError(response, data, `${agentName} could not answer`);
  }
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
    queueSpeech(sentence, cue, generation);
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
  if (generation === turnGeneration) history.push({role: "assistant", content: cleanReply});
  await speechQueue;
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

async function processUtterance(blob: Blob) {
  const generation = ++turnGeneration;
  try {
    const text = await transcribe(blob);
    if (!text || generation !== turnGeneration || !sessionActive) return;
    showTranscript(text);
    setStatus(`${agentName} · thinking`);
    await askGroq(text, generation);
  } catch (error) {
    if (!isAbort(error) && generation === turnGeneration) throw error;
  } finally {
    if (generation === turnGeneration) {
      busy = false;
      speaking = false;
      if (sessionActive && !outOfCredits) {
        setControl("idle", "Listening · tap to end");
        setStatus(`${agentName} · listening`);
        window.FACE?.setState("listening");
      }
    }
  }
}

async function startConversation() {
  if (sessionActive || outOfCredits) return;
  sessionActive = true;
  try {
    await window.FACETEST?.unlock();
    await startVoiceDetection();
  } catch (error) {
    sessionActive = false;
    stopVoiceDetection();
    throw error;
  }
  mic.setAttribute("aria-pressed", "true");
  setControl("idle", "Listening · tap to end");
  setStatus(`${agentName} · listening`);
  window.FACE?.setState("listening");
}

function stopConversation() {
  if (!sessionActive) return;
  sessionActive = false;
  if (recording) finishUtterance(true);
  cancelCurrentTurn();
  stopVoiceDetection();
  mic.setAttribute("aria-pressed", "false");
  setControl("idle", "Start conversation");
  setStatus(`${agentName} · paused`);
  window.FACE?.setState("listening");
}

function handleError(error: unknown) {
  console.error(error);
  busy = false;
  speaking = false;
  recording = false;
  if (error instanceof GroqQuotaError || (error instanceof Error && error.name === "GroqQuotaError")) {
    outOfCredits = true;
    stopConversation();
    mic.disabled = true;
    setControl("exhausted", "Out of credits");
    setStatus("Groq credits exhausted · try again later");
    window.FACE?.perform("concerned", .68, 8);
    return;
  }
  if (sessionActive) {
    setControl("idle", "Listening · tap to end");
    setStatus(`${agentName} · ${errorMessage(error)}`);
  } else {
    setControl("idle", "Try again");
    setStatus(`${agentName} · ${errorMessage(error)}`);
  }
}

mic.addEventListener("click", () => {
  if (sessionActive) stopConversation();
  else startConversation().catch(handleError);
});

window.addEventListener("facetest:ready", () => {
  if (outOfCredits) return;
  mic.disabled = false;
  setControl("idle", "Start conversation");
  setStatus(`${agentName} · ready`);
});

window.addEventListener("facetest:voice-state", (event) => {
  if (!sessionActive || outOfCredits) return;
  const state = (event as CustomEvent<{state?: string}>).detail?.state;
  if (state === "speaking") {
    speaking = true;
    setControl("speaking", "Speaking · talk to interrupt");
    setStatus(`${agentName} · speaking`);
  } else if (state === "thinking") {
    speaking = false;
    setControl("thinking", "Thinking…");
  } else if (state === "ready") {
    speaking = false;
  }
});

window.addEventListener("pagehide", stopConversation);
