# FACE3

An isolated voice-interface iteration that preserves `/FACE/` and `/FACE2/`.

- The gold-particle WebGL stage is shifted right of an opaque black control cut-in.
- The panel contains status, transcript, microphone controls, and voice selection.
- Inflect-Micro-v2 remains available as the local browser voice.
- Groq Orpheus V1 adds Autumn, Diana, Hannah, Austin, Daniel, and Troy.
- Groq Whisper provides hosted transcription.
- Groq GPT-OSS 120B provides the conversational response stream.
- The permanent Groq key remains server-side in `GROQ_API_KEY`.

Orpheus is a metered Groq preview model. Inflect remains the no-TTS-charge option.

## Build

```sh
cd FACE3/source
npm install
npm run build
```

The route is intentionally unlinked and marked `noindex`.
