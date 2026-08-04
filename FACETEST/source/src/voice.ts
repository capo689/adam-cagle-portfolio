export {};

const GREETING = "Hi, I'm a face created by Adam Cagle, push and hold the button to chat with me, let go when you're finished talking. You can also use the spacebar on a computer.";
type FaceController = {
  setState(state: string): void;
  setExpression(values: Record<string, number>): void;
  clearExpression(): void;
};

type AgentController = {
  initialize(): Promise<void>;
  unlock(): Promise<void>;
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
  face()?.clearExpression();
}

function animateMouth(endTime: number) {
  if (!analyser || !audioContext) return;
  const waveform = new Uint8Array(analyser.fftSize);
  const spectrum = new Uint8Array(analyser.frequencyBinCount);
  let envelope = 0;

  function frame() {
    if (!analyser || !audioContext || audioContext.currentTime >= endTime) {
      face()?.clearExpression();
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
  const buffer = await synthesize(text);
  await play(buffer);
}

async function initialize() {
  initializePromise ||= (async () => {
    await waitForFace();
    face()?.setState("thinking");
    status.value = "Troy · waking up";
    announce("thinking");
    try {
      greetingBuffer = await synthesize(GREETING);
      window.dispatchEvent(new CustomEvent("facetest:ready"));
      try {
        await play(greetingBuffer, true);
      } catch (error) {
        console.info("Greeting is ready for the first audio-enabled interaction", error);
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

window.FACETEST = {initialize, unlock, speak, stop};
initialize().catch(console.error);
