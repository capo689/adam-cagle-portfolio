# FACE2

An isolated experiment that preserves `/FACE/` while replacing its macOS-only speech bridge with Inflect-Micro-v2 running entirely in the browser.

- The WebGL face is initially identical to FACE.
- Inflect-Micro-v2 generates 24 kHz speech with ONNX Runtime Web.
- eSpeak-ng runs as a WASM phonemization frontend.
- The generated waveform drives the existing mouth analyser.
- No API key, inference server, or VM is used.
- `window.FACE2.speak(text)` exposes the local voice to a future agent controller.

The initial voice download is approximately 38 MB, plus the ONNX WebAssembly runtime. Assets are cached by the browser after first load.

## Build

```sh
cd FACE2/source
npm install
npm run build
```

## Licensing

- Inflect-Micro-v2 code and model weights: Apache License 2.0.
- `webtts-inflect` browser implementation: Apache License 2.0; see `WEBTTS-INFLECT-LICENSE.txt`.
- Its `phonemizer` dependency is Apache-2.0 and bundles eSpeak-ng under GPL-3.0.
- Additional dependency and source notices are collected in `THIRD_PARTY_NOTICES.md`.
- The canonical face topology is Google MediaPipe under Apache License 2.0.

The route is intentionally unlinked and marked `noindex`.
