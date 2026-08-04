const SAMPLE_RATE = 24000;
const GREETING = "I'm awake. Choose a voice, then tap talk.";
const ORPHEUS_VOICES = new Set(["autumn", "diana", "hannah", "austin", "daniel", "troy"]);

type ProgressMessage = {type: "progress"; modelKey: string; fraction: number; phase: "downloading" | "compiling"};
type PreloadedMessage = {type: "preloaded"; id: string; modelKey: string};
type ResultMessage = {type: "result"; id: string; samples: Float32Array; sampleRate: number; synthMs: number};
type ErrorMessage = {type: "error"; id: string; message: string};
type WorkerMessage = ProgressMessage | PreloadedMessage | ResultMessage | ErrorMessage;

type FaceController = {
  setState(state: string): void;
  setExpression(values: Record<string, number>): void;
  clearExpression(): void;
};

declare global {
  interface Window {
    FACE?: FaceController;
    FACE3?: {preload(): Promise<void>; speak(text: string): Promise<void>; stop(): void; ask?(text: string): Promise<void>};
  }
}

const wake = document.querySelector<HTMLButtonElement>("#wake")!;
const wakeLabel = wake.querySelector<HTMLSpanElement>("span")!;
const status = document.querySelector<HTMLOutputElement>("#status")!;
const replay = document.querySelector<HTMLButtonElement>("#replay")!;
const preview = document.querySelector<HTMLButtonElement>("#preview")!;
const voiceSelect = document.querySelector<HTMLSelectElement>("#voice")!;
const mic = document.querySelector<HTMLButtonElement>("#mic")!;
const worker = new Worker(new URL("./worker.ts", import.meta.url), {type: "module"});
const pending = new Map<string, {resolve(value: WorkerMessage): void; reject(error: Error): void}>();

let audioContext: AudioContext | undefined;
let analyser: AnalyserNode | undefined;
let preloadPromise: Promise<void> | undefined;
let activeSources: AudioBufferSourceNode[] = [];
let animationFrame = 0;

function id() {
  return crypto.randomUUID();
}

function face() {
  return window.FACE;
}

function voiceName() {
  return voiceSelect.options[voiceSelect.selectedIndex]?.text || "Voice";
}

function request(message: Record<string, unknown>) {
  return new Promise<WorkerMessage>((resolve, reject) => {
    const requestId = String(message.id);
    pending.set(requestId, {resolve, reject});
    worker.postMessage(message);
  });
}

worker.addEventListener("message", (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === "progress") {
    const percent = Math.round(message.fraction * 100);
    wake.style.setProperty("--progress", String(.08 + message.fraction * .92));
    wakeLabel.textContent = message.phase === "compiling" ? "Preparing Inflect" : `Loading Inflect · ${percent}%`;
    status.value = message.phase === "compiling" ? "Inflect · preparing" : `Inflect · loading ${percent}%`;
    return;
  }
  const requestId = "id" in message ? message.id : "";
  const handler = pending.get(requestId);
  if (!handler) return;
  pending.delete(requestId);
  if (message.type === "error") handler.reject(new Error(message.message));
  else handler.resolve(message);
});

async function waitForFace() {
  while (!face()) await new Promise((resolve) => setTimeout(resolve, 25));
}

async function preload() {
  preloadPromise ||= (async () => {
    face()?.setState("thinking");
    const message = await request({type: "preload", id: id(), modelKey: "micro"});
    if (message.type !== "preloaded") throw new Error("Voice preload did not complete");
    status.value = "Inflect · ready";
  })();
  return preloadPromise;
}

function stop() {
  cancelAnimationFrame(animationFrame);
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources = [];
  face()?.clearExpression();
}

function animateMouth(endTime: number) {
  if (!analyser || !audioContext) return;
  const waveform = new Uint8Array(analyser.fftSize);
  const spectrum = new Uint8Array(analyser.frequencyBinCount);
  let envelope = 0;
  let envelopeMax = 0;

  function frame() {
    if (!analyser || !audioContext || audioContext.currentTime >= endTime) {
      face()?.clearExpression();
      face()?.setState("listening");
      status.value = mic.hidden ? `${voiceName()} · ready` : "Groq · ready";
      return;
    }
    analyser.getByteTimeDomainData(waveform);
    analyser.getByteFrequencyData(spectrum);
    let energy = 0;
    for (const sample of waveform) {
      const value = (sample - 128) / 128;
      energy += value * value;
    }
    const target = Math.min(1, Math.max(0, (Math.sqrt(energy / waveform.length) - .01) * 8.5));
    envelope += (target - envelope) * (target > envelope ? .5 : .2);
    envelopeMax = Math.max(envelopeMax, envelope);
    status.dataset.envelope = envelope.toFixed(3);
    status.dataset.envelopeMax = envelopeMax.toFixed(3);
    let low = 0, high = 0;
    const split = Math.floor(spectrum.length * .18);
    for (let i = 2; i < split; i++) low += spectrum[i]!;
    for (let i = split; i < spectrum.length * .56; i++) high += spectrum[i]!;
    const brightness = high / Math.max(1, low + high);
    face()?.setExpression({
      open: .025 + envelope * .74,
      wide: envelope * Math.max(-.1, Math.min(.48, (brightness - .22) * 1.9)),
      pucker: envelope * Math.max(0, Math.min(.62, (.43 - brightness) * 2.2)),
      smile: .08 + envelope * .08,
      brow: .08
    });
    animationFrame = requestAnimationFrame(frame);
  }
  frame();
}

async function play(buffer: AudioBuffer) {
  if (!audioContext) throw new Error("Audio is unavailable");
  const source = audioContext.createBufferSource();
  analyser ||= audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = .58;
  source.buffer = buffer;
  source.connect(analyser);
  analyser.connect(audioContext.destination);
  activeSources = [source];
  face()!.setState("speaking");
  status.dataset.spoken = "true";
  const endTime = audioContext.currentTime + buffer.duration;
  await new Promise<void>((resolve) => {
    source.onended = () => { activeSources = []; resolve(); };
    source.start();
    animateMouth(endTime);
  });
}

async function synthesizeInflect(text: string) {
  if (!audioContext) throw new Error("Audio is unavailable");
  await preload();
  status.value = "Inflect · synthesizing";
  const message = await request({type: "synthesize", id: id(), text: text.trim().slice(0, 700), seed: 7, modelKey: "micro"});
  if (message.type !== "result") throw new Error("Inflect did not return audio");
  status.dataset.synthMs = String(Math.round(message.synthMs));
  const buffer = audioContext.createBuffer(1, message.samples.length, message.sampleRate || SAMPLE_RATE);
  buffer.getChannelData(0).set(message.samples);
  return buffer;
}

function textChunks(text: string, limit = 190) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit && current) {
      chunks.push(current);
      current = word;
    } else current = candidate;
  }
  if (current) chunks.push(current);
  return chunks;
}

async function synthesizeOrpheus(text: string, voice: string) {
  if (!audioContext) throw new Error("Audio is unavailable");
  status.value = `Orpheus · ${voice} · generating`;
  const response = await fetch("/api/face3-speak", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({text, voice})
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Orpheus could not generate speech");
  }
  return audioContext.decodeAudioData(await response.arrayBuffer());
}

async function speak(text: string) {
  audioContext ||= new AudioContext();
  await audioContext.resume();
  await waitForFace();
  stop();
  const selected = voiceSelect.value;
  const chunks = selected === "inflect" ? [text] : textChunks(text);
  for (const chunk of chunks) {
    face()!.setState("thinking");
    const started = performance.now();
    const buffer = selected === "inflect"
      ? await synthesizeInflect(chunk)
      : await synthesizeOrpheus(chunk, ORPHEUS_VOICES.has(selected) ? selected : "daniel");
    status.dataset.synthMs = String(Math.round(performance.now() - started));
    await play(buffer);
  }
}

async function initialize() {
  wake.disabled = true;
  try {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    wake.hidden = true;
    replay.hidden = false;
    await speak(GREETING);
    window.dispatchEvent(new CustomEvent("face3:ready"));
  } catch (error) {
    console.error(error);
    wake.hidden = false;
    wake.disabled = false;
    wakeLabel.textContent = "Voice failed · retry";
    status.value = "Voice · unavailable";
    preloadPromise = undefined;
  }
}

wake.addEventListener("click", initialize);
replay.addEventListener("click", () => speak(GREETING).catch(console.error));
preview.addEventListener("click", () => speak(`Hello. This is ${voiceName()}.`).catch((error) => {
  console.error(error);
  status.value = "Preview · failed";
}));
voiceSelect.addEventListener("change", () => {
  stop();
  status.value = `${voiceName()} · selected`;
});

window.FACE3 = {preload, speak, stop};
