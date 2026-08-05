export {};

const STATIC_GREETING_URL = "/FACETEST/audio/troy-intro.wav";
type FaceController = {
  setState(state: string): void;
  setExpression(values: Record<string, number>): void;
  perform(name: string, intensity?: number, duration?: number): void;
  clearExpression(): void;
};

type AgentController = {
  initialize(): Promise<void>;
  unlock(): Promise<void>;
  introduce(): Promise<boolean>;
  speak(text: string): Promise<void>;
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
  cancelAnimationFrame(animationFrame);
  for (const source of activeSources) {
    try { source.stop(); } catch {}
  }
  activeSources = [];
  face()?.setExpression({open: 0, wide: 0, pucker: 0});
}

function animateMouth(endTime: number) {
  if (!analyser || !audioContext) return;
  const waveform = new Uint8Array(analyser.fftSize);
  const spectrum = new Uint8Array(analyser.frequencyBinCount);
  let envelope = 0;

  function frame() {
    if (!analyser || !audioContext || audioContext.currentTime >= endTime) {
      face()?.setExpression({open: 0, wide: 0, pucker: 0});
      face()?.setState("listening");
      announce("ready");
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
    let low = 0;
    let high = 0;
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

async function synthesize(text: string) {
  const response = await fetch("/api/facetest-speak", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({text: text.replace(/\s+/g, " ").trim().slice(0, 200)})
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Troy could not generate speech");
  }
  return context().decodeAudioData(await response.arrayBuffer());
}

function fallbackVoice() {
  const voices = speechSynthesis.getVoices();
  const preferred = ["Daniel", "Reed", "Aaron", "Samantha", "Google US English"];
  return preferred.map((name) => voices.find((voice) => voice.name.includes(name))).find(Boolean)
    || voices.find((voice) => voice.lang.startsWith("en-US"))
    || voices.find((voice) => voice.lang.startsWith("en"));
}

async function speakWithBrowser(text: string) {
  if (!("speechSynthesis" in window)) throw new Error("Voice is temporarily unavailable");
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = fallbackVoice() || null;
  utterance.rate = .96;
  utterance.pitch = .94;
  face()?.setState("speaking");
  announce("speaking");
  let talking = true;
  const started = performance.now();
  function animateFallback() {
    if (!talking) return;
    const t = (performance.now() - started) / 1000;
    const envelope = .22 + Math.abs(Math.sin(t * 8.7) * .42) + Math.abs(Math.sin(t * 13.1) * .14);
    face()?.setExpression({open: Math.min(.68, envelope), wide: Math.sin(t * 4.1) * .12, pucker: Math.max(0, Math.sin(t * 5.3)) * .16});
    animationFrame = requestAnimationFrame(animateFallback);
  }
  animateFallback();
  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => event.error === "canceled" ? resolve() : reject(new Error("Browser voice failed"));
    speechSynthesis.speak(utterance);
  }).finally(() => {
    talking = false;
    cancelAnimationFrame(animationFrame);
    face()?.setExpression({open: 0, wide: 0, pucker: 0});
    face()?.setState("listening");
    announce("ready");
  });
}

async function loadStaticGreeting() {
  const response = await fetch(STATIC_GREETING_URL, {cache: "force-cache"});
  if (!response.ok) return undefined;
  return context().decodeAudioData(await response.arrayBuffer());
}

async function play(buffer: AudioBuffer, autoplay = false) {
  const audio = context();
  await unlock(autoplay ? 450 : 0);
  if (audio.state !== "running") throw new Error("Audio needs a tap to begin");
  const source = audio.createBufferSource();
  analyser ||= audio.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = .58;
  source.buffer = buffer;
  source.connect(analyser);
  analyser.connect(audio.destination);
  activeSources = [source];
  face()?.setState("speaking");
  announce("speaking");
  const endTime = audio.currentTime + buffer.duration;
  await new Promise<void>((resolve) => {
    source.onended = () => { activeSources = []; resolve(); };
    source.start();
    animateMouth(endTime);
  });
}

async function speak(text: string) {
  await waitForFace();
  stop();
  face()?.setState("thinking");
  announce("thinking");
  try {
    const buffer = await synthesize(text);
    await play(buffer);
  } catch (error) {
    console.warn("Troy unavailable; using browser voice fallback", error);
    await speakWithBrowser(text);
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
    status.value = "Troy · waking up";
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
          status.value = "Troy · ready";
          face()?.setState("listening");
          announce("ready");
          window.dispatchEvent(new CustomEvent("facetest:intro-pending"));
        }
      } else {
        status.value = "Troy · ready";
        face()?.setState("listening");
        announce("ready");
      }
    } catch (error) {
      console.error(error);
      status.value = "Troy · voice unavailable";
      window.dispatchEvent(new CustomEvent("facetest:ready"));
      announce("ready");
    }
  })();
  return initializePromise;
}

window.FACETEST = {initialize, unlock, introduce, speak, stop};
initialize().catch(console.error);
