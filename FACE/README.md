# FACE

An unlinked, non-indexed WebGL facial interface: a gold particle membrane on black.

- The entire viewport is an uninterrupted, shimmering, pointer-reactive particle field.
- A locally bundled MediaPipe canonical 468-landmark face is sampled into tens of thousands of particles; the source mesh is never rendered.
- A generated tension skirt joins the moving face perimeter back into the flat field, creating the stretched-latex effect.
- Semantic landmark groups drive gaze, blinks, brows, jaw, lips, smiles, head pose, and a “hello world” phoneme sequence.
- `window.FACE` exposes `setState`, `setExpression`, `clearExpression`, and `reset` hooks for a future AI-agent controller.
- `prefers-reduced-motion` holds the portrait in its final pose.

The canonical face topology is from Google MediaPipe and is distributed under Apache License 2.0. See `assets/MEDIAPIPE-LICENSE.txt`.

Serve the repository root and open `/FACE/`.
