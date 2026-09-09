# NEWD

The voice-first replacement for Adam Cagle's current portfolio.

## Current slice

- Permission-first entry screen with name and explicit voice consent
- Real browser microphone permission request
- Original FACETEST face embedded in the new experience shell
- Spoken Fish greeting, hands-free listening, Groq transcription, and streamed AI answers
- Gold-mist dissolve, FACE-to-rail transition, and 220px desktop voice rail
- Clickable Home, Copywriting, AI, and Brand navigation prototype
- Responsive mobile voice dock

The current voice build securely relays to the proven FACETEST services already hosted on adamcagle.com; provider keys never enter this project or the browser. The new portfolio RAG ingestion, private analytics dashboard, and durable consent/session storage remain specified in `docs/SITE-PLAN.md` for the next backend phase.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production shape

`NEWD` is an independent Next.js application designed to use this directory as the Vercel project root. It does not alter the current static portfolio or FACETEST deployment.
