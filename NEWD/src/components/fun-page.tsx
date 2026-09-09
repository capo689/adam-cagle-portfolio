"use client";

import Image from "next/image";
import { ArrowUpRight, AudioLines, BrainCircuit, Database, Eye, Mic, ShieldCheck } from "lucide-react";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";

const aceLayers = [
  {
    icon: Mic,
    label: "Hear",
    title: "Voice or type",
    copy: "Push-to-talk records a clean turn. Groq Whisper transcribes it. Typing enters the same conversation path.",
  },
  {
    icon: Database,
    label: "Know",
    title: "Evidence before eloquence",
    copy: "A curated portfolio RAG retrieves reviewed facts, client stories, project records, claims, and answer guardrails before ACE responds.",
  },
  {
    icon: BrainCircuit,
    label: "Think",
    title: "Fast reasoning",
    copy: "DeepSeek V4 Flash runs through OpenRouter, with a Groq fallback. Fixed answers handle the questions that should never drift.",
  },
  {
    icon: AudioLines,
    label: "Speak",
    title: "Streaming voice",
    copy: "Fish Audio streams the reply as it is produced. Sentence-level performance cues shape pace and intonation instead of bolting on a generic voice at the end.",
  },
  {
    icon: Eye,
    label: "Perform",
    title: "One response, two performances",
    copy: "The audio waveform drives mouth movement while expression cues animate the eyes, brows, cheeks, and posture through the same live response.",
  },
  {
    icon: ShieldCheck,
    label: "Remember",
    title: "Context without surveillance",
    copy: "ACE knows the current page, open project, last presentation, and recent turns inside this tab. Conversation and browsing history are not stored.",
  },
];

const experiments = [
  {
    id: "donkey",
    kicker: "Physics research / technical communication",
    title: "Donkey on the Edge",
    line: "From F = ma to quantum gravity.",
    copy: "An end-to-end physics course built from first principles, spanning thirty-eight documents from classical mechanics to quantum gravity. The work culminated in a research paper with original equations exploring how computational complexity changes the observer effect in quantum physics, with AI-assisted author, editor, and adversarial-review loops testing every step.",
    image: "/fun/donkey-equations.png",
    alt: "Equation and research plate from Donkey on the Edge",
    href: "https://donkey-mauve.vercel.app/",
    action: "Enter the research site",
  },
  {
    id: "sulu",
    kicker: "Browser game / interactive experiment",
    title: "SULU Invaders",
    line: "A side quest with lasers.",
    copy: "A neon arcade shooter built into a custom retro-futurist console. Canvas rendering, keyboard, pointer and touch controls, ship upgrades, shields, enemies, sound effects, and selectable soundtracks turn a portfolio detour into an actual playable thing.",
    image: "/fun/sulu-invaders-poster.webp",
    alt: "Retro SULU Invaders poster featuring Sulu, a spacecraft, colorful invaders, and arcade gameplay",
    href: "https://adamcagle.com/space/",
    action: "Play SULU Invaders",
  },
  {
    id: "ship",
    kicker: "Comedy novel / writing sample",
    title: "Ship Happens",
    line: "A Chad Cruz Zombie Adventure.",
    copy: "Chad Cruz is thirty-four, newly fired, and living in a studio apartment with a ceiling stain named Gary. When his estranged aunt dies and leaves him cruise tickets, he boards a seniors ship as the youngest passenger by four decades. The zombies start on day two.",
    image: "/fun/ship-happens.webp",
    alt: "Ship Happens comedy novel artwork",
    href: "https://www.amazon.com/dp/B0H1J97VMM",
    action: "Find Ship Happens on Amazon",
  },
];

export function FunPage() {
  return (
    <div className="fun-page">
      <header className="fun-hero">
        <p className="kicker">Side projects, serious curiosity</p>
        <ElectricShimmerTitle lines={["FUN STUFF."]} />
        <p className="fun-intro">
          Curiosity is part of the job. These are the projects I build when an idea is worth following far enough to learn something, make something, or make myself laugh.
        </p>
      </header>

      <section className="ace-build" aria-labelledby="ace-build-title">
        <header className="fun-section-head ace-section-head">
          <div>
            <p>Live system / running on this page</p>
            <h2 id="ace-build-title">ACE MAKES THE SITE A CONVERSATION.</h2>
          </div>
          <p>
            ACE turns a static portfolio into a guided conversation without surrendering factual control. The stack joins retrieval, short-term context, streaming speech, and a custom WebGL performance system in one real-time loop.
          </p>
        </header>

        <div className="ace-signal" aria-label="ACE real-time system flow">
          <span>Visitor</span><i />
          <span>Speech + text</span><i />
          <span>RAG + guardrails</span><i />
          <span>Reasoning</span><i />
          <span>Voice + face</span>
        </div>

        <div className="ace-layer-grid">
          {aceLayers.map(({ icon: Icon, label, title, copy }) => (
            <article key={label}>
              <div><Icon size={20} aria-hidden="true" /><span>{label}</span></div>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>

        <div className="ace-stack-line">
          <strong>THE BUILD</strong>
          <span>Next.js 16</span><span>React 19</span><span>TypeScript</span><span>Three.js + WebGL</span><span>Groq Whisper</span><span>OpenRouter</span><span>DeepSeek V4 Flash</span><span>Fish Audio S2.1 Pro</span><span>Vercel</span>
        </div>
      </section>

      <section className="fun-experiments" aria-labelledby="fun-experiments-title">
        <header className="fun-section-head">
          <div>
            <p>Experiments worth finishing</p>
            <h2 id="fun-experiments-title">THE REST OF THE LAB.</h2>
          </div>
          <p>
            Physics, games, and fiction exercise different muscles, but the operating habit is the same: get curious, learn the machinery, make the idea tangible, and keep going until it works.
          </p>
        </header>

        <div className="fun-project-grid">
          {experiments.map((item) => (
            <article className="fun-project" data-project={item.id} id={item.id} key={item.id}>
              <a className="fun-project-image" href={item.href} rel="noreferrer" target="_blank" aria-label={`${item.action}: ${item.title}`}>
                <Image src={item.image} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 60vw" />
              </a>
              <div className="fun-project-copy">
                <p>{item.kicker}</p>
                <h3>{item.title}</h3>
                <strong>{item.line}</strong>
                <span>{item.copy}</span>
                <a href={item.href} rel="noreferrer" target="_blank">
                  {item.action} <ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
