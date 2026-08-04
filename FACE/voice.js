const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

if (LOCAL_HOSTS.has(location.hostname)) {
  const wake = document.querySelector("#voice-wake");
  const status = document.querySelector("#voice-status");
  let audioContext;
  let unlocked = false;
  let queuedSpeech = null;
  let activeSource = null;
  let expressionFrame = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  function face() {
    return window.FACE;
  }

  function setStatus(message, linger = true) {
    status.value = message;
    status.dataset.visible = "true";
    clearTimeout(setStatus.timer);
    if (!linger) setStatus.timer = setTimeout(() => { status.dataset.visible = "false"; }, 1800);
  }

  function settle(state = "listening") {
    cancelAnimationFrame(expressionFrame);
    face()?.clearExpression();
    face()?.setState(state);
    setStatus(state === "listening" ? "Codex mirror · listening" : `Codex mirror · ${state}`, state !== "listening");
  }

  async function waitForFace() {
    while (!face()) await new Promise((resolve) => setTimeout(resolve, 30));
  }

  function animateFromAnalyser(analyser, source) {
    const waveform = new Uint8Array(analyser.fftSize);
    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    let envelope = 0;

    function frame() {
      if (source !== activeSource) return;
      analyser.getByteTimeDomainData(waveform);
      analyser.getByteFrequencyData(spectrum);

      let energy = 0;
      for (const sample of waveform) {
        const centered = (sample - 128) / 128;
        energy += centered * centered;
      }
      const rms = Math.sqrt(energy / waveform.length);
      const target = clamp((rms - .012) * 8.8);
      envelope += (target - envelope) * (target > envelope ? .48 : .18);
      status.dataset.envelope = envelope.toFixed(3);

      let low = 0;
      let high = 0;
      const split = Math.floor(spectrum.length * .18);
      for (let i = 2; i < split; i++) low += spectrum[i];
      for (let i = split; i < spectrum.length * .56; i++) high += spectrum[i];
      low /= Math.max(1, split - 2);
      high /= Math.max(1, Math.floor(spectrum.length * .38));
      const brightness = high / Math.max(1, low + high);

      face()?.setExpression({
        open: .025 + envelope * .72,
        wide: envelope * clamp((brightness - .22) * 1.9, -.12, .48),
        pucker: envelope * clamp((.43 - brightness) * 2.2, 0, .62),
        smile: .08 + envelope * .08,
        brow: .08
      });
      expressionFrame = requestAnimationFrame(frame);
    }
    frame();
  }

  function fallbackSpeech(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = .94;
    utterance.pitch = .9;
    let started = performance.now();
    const pulseMouth = () => {
      if (!speechSynthesis.speaking) return;
      const t = (performance.now() - started) / 1000;
      face()?.setExpression({open: .14 + Math.abs(Math.sin(t * 11.3)) * .42, wide: Math.sin(t * 4.7) * .12, pucker: .08});
      expressionFrame = requestAnimationFrame(pulseMouth);
    };
    utterance.onstart = () => { started = performance.now(); pulseMouth(); };
    utterance.onend = () => settle();
    utterance.onerror = () => settle();
    speechSynthesis.speak(utterance);
  }

  async function playSpeech(message) {
    if (!unlocked) {
      queuedSpeech = message;
      wake.dataset.visible = "true";
      wake.querySelector("span").textContent = "Click to speak";
      return;
    }

    await waitForFace();
    if (activeSource) {
      try { activeSource.stop(); } catch {}
      activeSource = null;
    }
    cancelAnimationFrame(expressionFrame);
    face().clearExpression();
    face().setState("speaking");
    setStatus("Codex mirror · speaking");

    try {
      const response = await fetch(message.audio);
      if (!response.ok) throw new Error(`Audio failed: ${response.status}`);
      const buffer = await audioContext.decodeAudioData(await response.arrayBuffer());
      const source = audioContext.createBufferSource();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = .58;
      source.buffer = buffer;
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      source.onended = () => {
        if (activeSource === source) {
          activeSource = null;
          settle();
        }
      };
      activeSource = source;
      animateFromAnalyser(analyser, source);
      source.start();
    } catch (error) {
      console.warn("FACE bridge audio fallback", error);
      fallbackSpeech(message.text);
    }
  }

  const events = new EventSource("/__face/events");
  events.addEventListener("open", async () => {
    await waitForFace();
    face().setState("listening");
    wake.dataset.visible = unlocked ? "false" : "true";
    setStatus("Codex mirror · linked", false);
  });
  events.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "preparing") {
      face()?.setState("thinking");
      setStatus("Codex mirror · thinking");
    }
    if (message.type === "speech") playSpeech(message);
  });
  events.addEventListener("error", () => setStatus("Codex mirror · reconnecting"));

  wake.addEventListener("click", async () => {
    audioContext ||= new AudioContext();
    await audioContext.resume();
    unlocked = true;
    wake.dataset.visible = "false";
    setStatus("Codex mirror · awake", false);
    if (queuedSpeech) {
      const message = queuedSpeech;
      queuedSpeech = null;
      playSpeech(message);
    }
  });

  addEventListener("beforeunload", () => events.close(), {once: true});
}
