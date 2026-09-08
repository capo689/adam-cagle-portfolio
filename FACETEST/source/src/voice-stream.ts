export {};

const agentName = document.body.dataset.voiceName || "Troy";
const speechEndpoint = document.body.dataset.speechEndpoint || "/api/facetest-speak";
const staticGreetingUrl = document.body.dataset.staticGreeting ?? "/FACETEST/audio/troy-intro.wav";
type ExpressionCue = {name: string; intensity: number};
type FaceController = {
  setState(state: string): void;
  setExpression(values: Record<string, number>): void;
  setSpeech(values: Record<string, number>): void;
  perform(name: string, intensity?: number, duration?: number): void;
  clearExpression(): void;
};

type AgentController = {
  initialize(): Promise<void>;
  unlock(): Promise<void>;
  introduce(): Promise<boolean>;
  speak(text: string, cue?: ExpressionCue): Promise<void>;
  stop(): void;
  ask?(text: string): Promise<void>;
};

declare global {
  interface Window {
    FACE?: FaceController;
    FACETEST?: AgentController;
  }
}

const status = document.querySelector<HTMLOutputElement>("#status")!;
let audioContext: AudioContext | undefined;
let analyser: AnalyserNode | undefined;
let activeSources: AudioBufferSourceNode[] = [];
let animationFrame = 0;
let activeRequest: AbortController | undefined;
let playbackGeneration = 0;
let mouthEndTime = 0;
let analyserConnected = false;
let initializePromise: Promise<void> | undefined;
let greetingBuffer: AudioBuffer | undefined;
let introduced = false;
let introducing = false;

function face() {
  return window.FACE;
}

function announce(state: "ready" | "thinking" | "speaking") {
  window.dispatchEvent(new CustomEvent("facetest:voice-state", {detail: {state}}));
}

async function waitForFace() {
  while (!face()) await new Promise((resolve) => setTimeout(resolve, 25));
}

function context() {
  audioContext ||= new AudioContext();
  return audioContext;
}

async function unlock(timeout = 0) {
  const audio = context();
  if (audio.state === "running") return;
  const attempt = audio.resume();
  if (timeout) await Promise.race([attempt, new Promise((resolve) => setTimeout(resolve, timeout))]);
  else await attempt;
}

function stop() {
  playbackGeneration++;
  activeRequest?.abort();
  activeRequest = undefined;
  cancelAnimationFrame(animationFrame);
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources = [];
  mouthEndTime = 0;
  face()?.setSpeech({open: 0, wide: 0, pucker: 0, energy: 0});
}

function animateMouth(generation: number) {
  if (!analyser || !audioContext) return;
  const waveform = new Uint8Array(analyser.fftSize);
  const spectrum = new Uint8Array(analyser.frequencyBinCount);
  let envelope = 0;
  let brightness = .32;

  function frame() {
    if (!analyser || !audioContext || generation !== playbackGeneration || audioContext.currentTime >= mouthEndTime) {
      face()?.setSpeech({open: 0, wide: 0, pucker: 0, energy: 0});
      return;
    }
    analyser.getByteTimeDomainData(waveform);
    analyser.getByteFrequencyData(spectrum);
    let energy = 0;
    for (const sample of waveform) {
      const value = (sample - 128) / 128;
      energy += value * value;
    }
    const rms = Math.sqrt(energy / waveform.length);
    const target = Math.min(1, Math.max(0, (rms - .018) * 7.2));
    envelope += (target - envelope) * (target > envelope ? .34 : .13);
    let low = 0;
    let high = 0;
    const split = Math.floor(spectrum.length * .18);
    for (let i = 2; i < split; i++) low += spectrum[i]!;
    for (let i = split; i < spectrum.length * .56; i++) high += spectrum[i]!;
    const brightnessTarget = high / Math.max(1, low + high);
    brightness += (brightnessTarget - brightness) * .12;
    face()?.setSpeech({
      open: envelope * .64,
      wide: envelope * Math.max(-.1, Math.min(.48, (brightness - .22) * 1.9)),
      pucker: envelope * Math.max(0, Math.min(.62, (.43 - brightness) * 2.2)),
      energy: envelope
    });
    animationFrame = requestAnimationFrame(frame);
  }
  frame();
}

function outputAnalyser(audio: AudioContext) {
  analyser ||= audio.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = .72;
  if (!analyserConnected) {
    analyser.connect(audio.destination);
    analyserConnected = true;
  }
  return analyser;
}

async function synthesize(text: string, cue?: ExpressionCue) {
  const response = await fetch(speechEndpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      text: text.replace(/\s+/g, " ").trim().slice(0, 600),
      expression: cue?.name,
      intensity: cue?.intensity
    })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || `${agentName} could not generate speech`);
    if (response.status === 429 && data.code === "GROQ_QUOTA_EXHAUSTED") error.name = "GroqQuotaError";
    throw error;
  }
  return context().decodeAudioData(await response.arrayBuffer());
}

async function openSpeechStream(text: string, signal: AbortSignal, cue?: ExpressionCue) {
  const response = await fetch(speechEndpoint, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    signal,
    body: JSON.stringify({
      text: text.replace(/\s+/g, " ").trim().slice(0, 600),
      expression: cue?.name,
      intensity: cue?.intensity
    })
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `${agentName} could not generate speech`);
  }
  if (!response.body) throw new Error(`${agentName} returned no audio stream`);
  return response;
}

function pcmSampleRate(response: Response) {
  const explicit = Number(response.headers.get("X-FACETEST-PCM-Rate"));
  if (explicit > 0) return explicit;
  const match = response.headers.get("content-type")?.match(/rate=(\d+)/i);
  return Number(match?.[1]) || 44100;
}

function pcmBuffer(audio: AudioContext, bytes: Uint8Array, sampleRate: number) {
  const samples = Math.floor(bytes.byteLength / 2);
  const buffer = audio.createBuffer(1, samples, sampleRate);
  const channel = buffer.getChannelData(0);
  const view = new DataView(bytes.buffer, bytes.byteOffset, samples * 2);
  for (let index = 0; index < samples; index++) channel[index] = view.getInt16(index * 2, true) / 32768;
  return buffer;
}

async function streamSpeech(text: string, cue?: ExpressionCue) {
  await waitForFace();
  stop();
  const generation = playbackGeneration;
  const controller = new AbortController();
  activeRequest = controller;
  face()?.setState("thinking");
  announce("thinking");

  const response = await openSpeechStream(text, controller.signal, cue);
  const audio = context();
  await unlock();
  const output = outputAnalyser(audio);
  const reader = response.body!.getReader();
  const sampleRate = pcmSampleRate(response);
  let carry = new Uint8Array();
  let nextStart = audio.currentTime + .12;
  let began = false;

  for (;;) {
    const {done, value} = await reader.read();
    if (done || generation !== playbackGeneration) break;
    if (!value?.byteLength) continue;

    const joined = new Uint8Array(carry.byteLength + value.byteLength);
    joined.set(carry);
    joined.set(value, carry.byteLength);
    const usableLength = joined.byteLength - (joined.byteLength % 2);
    carry = joined.slice(usableLength);
    if (!usableLength) continue;

    const source = audio.createBufferSource();
    source.buffer = pcmBuffer(audio, joined.subarray(0, usableLength), sampleRate);
    source.connect(output);
    const startAt = Math.max(nextStart, audio.currentTime + (began ? .025 : .12));
    nextStart = startAt + source.buffer.duration;
    mouthEndTime = nextStart;
    activeSources.push(source);
    source.onended = () => {
      activeSources = activeSources.filter((candidate) => candidate !== source);
    };
    source.start(startAt);

    if (!began) {
      began = true;
      face()?.setState("speaking");
      announce("speaking");
      animateMouth(generation);
    }
  }

  activeRequest = undefined;
  if (!began || generation !== playbackGeneration) return;
  await new Promise<void>((resolve) => {
    const wait = () => {
      if (!audioContext || generation !== playbackGeneration || audioContext.currentTime >= mouthEndTime) resolve();
      else setTimeout(wait, 24);
    };
    wait();
  });
  if (generation === playbackGeneration) {
    face()?.setSpeech({open: 0, wide: 0, pucker: 0, energy: 0});
    face()?.setState("listening");
    announce("ready");
  }
}

async function loadStaticGreeting() {
  if (!staticGreetingUrl) return undefined;
  const response = await fetch(staticGreetingUrl, {cache: "force-cache"});
  if (!response.ok) return undefined;
  return context().decodeAudioData(await response.arrayBuffer());
}

async function play(buffer: AudioBuffer, autoplay = false) {
  const audio = context();
  await unlock(autoplay ? 450 : 0);
  if (audio.state !== "running") throw new Error("Audio needs a tap to begin");
  const source = audio.createBufferSource();
  const generation = playbackGeneration;
  analyser = outputAnalyser(audio);
  source.buffer = buffer;
  source.connect(analyser);
  activeSources = [source];
  face()?.setState("speaking");
  announce("speaking");
  const endTime = audio.currentTime + buffer.duration;
  mouthEndTime = endTime;
  await new Promise<void>((resolve) => {
    source.onended = () => { activeSources = []; resolve(); };
    source.start();
    animateMouth(generation);
  });
}

async function speak(text: string, cue?: ExpressionCue) {
  try {
    await streamSpeech(text, cue);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    throw error;
  }
}

async function introduce() {
  if (introduced || introducing || !greetingBuffer) return false;
  introducing = true;
  try {
    stop();
    await play(greetingBuffer);
    introduced = true;
    return true;
  } finally {
    introducing = false;
  }
}

async function initialize() {
  initializePromise ||= (async () => {
    await waitForFace();
    face()?.setState("thinking");
    status.value = `${agentName} · waking up`;
    announce("thinking");
    try {
      greetingBuffer = await loadStaticGreeting();
      window.dispatchEvent(new CustomEvent("facetest:ready"));
      if (greetingBuffer) {
        try {
          await play(greetingBuffer, true);
          introduced = true;
        } catch (error) {
          console.info("Greeting is ready for the first audio-enabled interaction", error);
          status.value = `${agentName} · ready`;
          face()?.setState("listening");
          announce("ready");
          window.dispatchEvent(new CustomEvent("facetest:intro-pending"));
        }
      } else {
        status.value = `${agentName} · ready`;
        face()?.setState("listening");
        announce("ready");
      }
    } catch (error) {
      console.error(error);
      status.value = `${agentName} · voice unavailable`;
      window.dispatchEvent(new CustomEvent("facetest:ready"));
      announce("ready");
    }
  })();
  return initializePromise;
}

window.FACETEST = {initialize, unlock, introduce, speak, stop};
initialize().catch(console.error);
