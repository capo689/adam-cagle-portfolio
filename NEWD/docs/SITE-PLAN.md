# NEWD — Product and Build Plan

## The product in one sentence

NEWD is a voice-first portfolio that behaves like Adam's best-informed representative: it understands the visitor's hiring need, finds evidence across every discipline, and presents the right work without asking the visitor for personal information.

## The unified story

There is no BRAIN split and no separate Agentic689 identity. The person being hired is Adam Cagle: an unusually complete creative and growth leader who can shape the brand, write the language, build the intelligent system, and lead the work into market.

The public career story ends with Agency689 as Adam's most recent role. Firstsource, DGWB Interactive, and Agency689 belong in the career chronology. Agentic work appears as a capability and body of work inside Agency689 and independent work, not as a competing identity.

## Experience flow

### 1. Single-click entry

The first screen asks for nothing. It introduces ACE, explains that the site speaks, notes that written answers are always visible, and offers one clear ENTER button. There is no name field, checkbox, account, or visitor-data consent flow because the site does not save visitor conversations or browsing history.

The browser asks for microphone permission only if the visitor chooses to hold the talk button. Typing to ACE never requires microphone access.

### 2. Arrival

After ENTER, the background collapses into gold particles. The original gold FACE resolves at the center and ACE introduces himself:

> Hi. I'm ACE, Adam's site agent. I can talk you through the work, answer questions, and open anything you want to see. Hold the talk button or type to me. Now, let's meet the best candidate for your job.

The visual transition carries the same face into the guide rail.

### 3. Guided portfolio

Desktop reserves exactly 220px on the right for the persistent ACE rail:

- FACE at the top
- listening, speaking, and paused states
- push-to-talk control
- large, legible written transcript
- typed message field
- suggested follow-up prompt when useful

The main window contains the portfolio. Voice and typing both control the same agent and the same navigation. Home, Copywriting, AI, and Brand remain fully clickable and linkable.

On mobile, FACE, push-to-talk, and the typed message field remain in a compact dock. The current exchange appears above it as a subtitle panel.

## Information architecture

- `/` — Unified introduction, proof, selected work, career snapshot, contact
- Copywriting — Copy systems, campaigns, voice, conversion, long-form and UX/content work
- AI — AI workflows and products, with a Creative Suite grouping plus fintech, migration, and platform work
- Brand — Brand strategy, identity, campaigns, leadership, client-logo field, and Agency689 feature/link
- Canonical detail views — Shared case studies opened inside the portfolio shell with ACE still present

There are no separate copies of a project under AI, Brand, or Copywriting. Each project has one canonical record and any number of facets. The page views are curated lenses over the same body of work.

## How a request becomes a page

Example: “Show me Adam's hospitality work.”

1. ACE recognizes the industry and intent.
2. Matching approved work is assembled across Copywriting, Brand, and AI.
3. The main window opens the strongest relevant view at its top.
4. ACE explains why the selected evidence matters.

ACE does not merely answer with text. It has controlled site actions for navigation, filtering, opening case studies, playing presentations, showing contact information, and stopping speech. These actions are allow-listed; the model cannot invent routes or execute arbitrary browser actions.

## The AI and voice pipeline

The current FACETEST pipeline is the baseline:

- browser audio capture initiated only by push-to-talk
- Groq speech-to-text
- OpenRouter-hosted conversational model with Adam's approved system context
- Fish S2.1 Pro voice via OpenRouter
- streaming written and spoken responses
- interruption and FACE expression cues
- typed input through the same conversation and navigation path

Case-study presentations and high-value recurring answers can use pre-recorded media. Every recorded response has a transcript and a live-answer fallback.

## Knowledge architecture

The repository is the editorial source of truth. Public knowledge includes only approved portfolio facts, case studies, interview stories selected for public use, and canonical portfolio links. Retrieval combines exact client, industry, role, and discipline tags with semantic relevance.

The conversation history exists only in browser memory for the current visit so ACE can maintain context. It is discarded on refresh or close. The application does not create visitor records, save transcripts, track pages viewed, or provide a visitor-review dashboard.

## Recommended production stack

- Next.js App Router, React, and TypeScript for the portfolio and secure provider routes
- carefully authored CSS for the custom visual system
- Motion and Three.js for the gold-mist choreography and FACE
- Zod for server-payload validation
- Vercel for deployment, previews, server functions, and streaming responses

OpenRouter and Groq remain behind server routes. Browser code receives no provider keys, and secrets never enter source control.

## Privacy and security rules

- No name, email, account, or consent form is required to enter.
- No conversation transcript, visitor timeline, or browsing history is persisted by the application.
- Microphone access is requested only after a visitor actively presses the talk control.
- Audio is sent only for the requested transcription and is not retained by the application.
- Provider credentials remain server-only.
- Model output cannot emit arbitrary HTML, URLs, SQL, or navigation actions.

## Build priorities

1. Refine the single-click entrance, FACE arrival, and persistent ACE rail.
2. Finish the canonical work-card and detail-view system across Copywriting, AI, and Brand.
3. Expand approved portfolio knowledge and controlled cross-discipline retrieval.
4. Add and refine prerecorded presentations without changing ACE's voice identity.
5. Complete mobile, keyboard, reduced-motion, browser, privacy, performance, and factuality QA.

## Definition of done

The site is ready when a recruiter can arrive cold, enter with one click, ask or type a vague hiring question, receive the right cross-disciplinary proof, navigate everything manually, and understand every response with sound on or off without surrendering personal data.
