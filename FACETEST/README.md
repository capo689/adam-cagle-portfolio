# FACETEST

Production push-to-talk particle agent using the locked Groq Orpheus Troy voice.

## Pages

- `index.html` — current production entry point.
- `archive-v1.html` — frozen copy of the first production version.
- `next.html` — clean working page for the next iteration.

## FACETEST Next

- Uses `/api/facetest-next-chat` so V1 remains behaviorally isolated.
- Compiles reviewed Markdown in `knowledge/` into a free local lexical retrieval index.
- Sends only the most relevant Adam records to the chat model.
- Includes the reviewed Adam Cagle v1.0 public library (495 locally indexed chunks); review-required and private-review records are excluded.
- Gives the agent a warmly enthusiastic, encouraging, occasionally comically proud attitude toward discussing Adam while prohibiting fabricated praise, impersonation, romance, or possessiveness.
- Supports hidden conversational expression cues plus local intent-based fallback expressions.
- Adds asymmetric brows, eyelids, mouth corners, cheek lift, frown, lip press, jaw shift, pupil response, and smoothed expression transitions.
- Loads `audio/troy-intro.wav` when present; it never synthesizes the introduction on page load.

Rebuild the local knowledge index after adding or editing library files:

```sh
node scripts/build-facetest-knowledge.mjs
```

- Hold the on-screen button or Space to record.
- Release to transcribe and send.
- The agent initializes and prepares its greeting on page load.
- FACE, FACE2, and FACE3 remain separate preserved iterations.
