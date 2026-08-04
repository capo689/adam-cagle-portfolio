# FACE

An unlinked, non-indexed WebGL facial interface: a gold particle membrane on black.

- The entire viewport is an uninterrupted, shimmering, pointer-reactive particle field.
- A locally bundled MediaPipe canonical 468-landmark face is sampled into tens of thousands of particles; the source mesh is never rendered.
- A generated tension skirt joins the moving face perimeter back into the flat field, creating the stretched-latex effect.
- Semantic landmark groups drive gaze, blinks, brows, jaw, lips, smiles, head pose, and a “hello world” phoneme sequence.
- `window.FACE` exposes `setState`, `setExpression`, `clearExpression`, and `reset` hooks for a future AI-agent controller.
- `prefers-reduced-motion` holds the portrait in its final pose.

## Free local Codex mirror

The local bridge uses the Mac's installed speech synthesizer, then feeds the generated audio through the browser's Web Audio analyser so the particle lips follow the actual sound. It binds only to `127.0.0.1`, stores temporary audio in the system temp directory, and does not use an API key or paid API.

```sh
node FACE/local-bridge.mjs
```

Open `http://127.0.0.1:4173/FACE/` and click once to wake audio. Send text to the face with:

```sh
curl -sS -X POST http://127.0.0.1:4173/__face/speak \
  -H 'content-type: application/json' \
  --data '{"text":"Hello. I am speaking through the particle interface."}'
```

The voice layer activates only on `localhost` or `127.0.0.1`; the deployed `/FACE/` remains a clean, silent particle canvas.

The canonical face topology is from Google MediaPipe and is distributed under Apache License 2.0. See `assets/MEDIAPIPE-LICENSE.txt`.

Serve the repository root and open `/FACE/`.
