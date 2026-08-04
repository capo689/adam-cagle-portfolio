# FACE2

An isolated conversational face that preserves `/FACE/`, runs Inflect-Micro-v2 speech in the browser, and uses Groq-hosted Whisper and GPT-OSS for its ears and intelligence.

- The WebGL face is initially identical to FACE.
- Inflect-Micro-v2 generates 24 kHz speech with ONNX Runtime Web.
- eSpeak-ng runs as a WASM phonemization frontend.
- The generated waveform drives the existing mouth analyser.
- No local model installation or VM is used.
- Groq Whisper transcribes microphone recordings through a protected Vercel function.
- Groq GPT-OSS 120B streams concise conversational replies through a protected Vercel function.
- The permanent Groq key remains server-side in `GROQ_API_KEY` and is never included in browser assets.
- `window.FACE2.speak(text)` exposes the local voice to a future agent controller.

The initial voice download is approximately 38 MB, plus the ONNX WebAssembly runtime. Assets are cached by the browser after first load.

## Groq configuration

Set `GROQ_API_KEY` in the Vercel project's Development, Preview, and Production environments. The two serverless endpoints are `/api/face2-transcribe` and `/api/face2-chat`.

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
