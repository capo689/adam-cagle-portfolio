"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Pause,
  Play,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import { aiSkills, aiWork, supportingAiCards, type AiWorkItem } from "@/content/ai-content";
import { GuidedWorkflowViewer } from "@/components/guided-workflow-viewer";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";
import { AiSystemPortrait } from "@/components/ai-system-portrait";
import { GoldPixelWord } from "@/components/gold-pixel-word";
import { showAceNarration } from "@/lib/ace-transcript";

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "complete";

function WorkCard({ item, onOpen }: { item: AiWorkItem; onOpen: (item: AiWorkItem) => void }) {
  return (
    <article className="ai-card" data-kind={item.kind}>
      <button className="ai-card-open" onClick={() => onOpen(item)} type="button" aria-label={`Open ${item.title}`}>
        <AiSystemPortrait item={item} />
        <span className="ai-card-kicker">{item.kicker}</span>
        <strong>{item.title}</strong>
        <span className="ai-card-headline">{item.headline}</span>
        <span className="ai-card-summary">{item.summary}</span>
        <span className="ai-card-footer">
          <span>{item.tags.slice(0, 3).join(" / ")}</span>
          <ArrowUpRight size={21} aria-hidden="true" />
        </span>
      </button>
    </article>
  );
}

function WorkGroup({
  name,
  description,
  items,
  onOpen,
}: {
  name: string;
  description: string;
  items: AiWorkItem[];
  onOpen: (item: AiWorkItem) => void;
}) {
  return (
    <section className="ai-group">
      <header className="ai-group-head">
        <h2>{name}</h2>
        <p>{description}</p>
      </header>
      <div className="ai-card-grid">
        {items.map((item) => <WorkCard item={item} key={item.id} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

export function AiPage({ voiceEnabled }: { voiceEnabled: boolean }) {
  const [selected, setSelected] = useState<AiWorkItem | null>(null);
  const [guidedItem, setGuidedItem] = useState<AiWorkItem | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const playId = useRef(0);

  useEffect(() => {
    const onVoiceState = (event: Event) => {
      const state = (event as CustomEvent<{ state?: string }>).detail?.state;
      if (!selected) return;
      if (state === "thinking") setPlayback("loading");
      if (state === "speaking") setPlayback("playing");
      if (state === "paused") setPlayback("paused");
    };
    window.addEventListener("facetest:voice-state", onVoiceState);
    return () => window.removeEventListener("facetest:voice-state", onVoiceState);
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(".ai-detail")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const singularity = aiWork.find((item) => item.id === "singularity-seo");
  const migrator = aiWork.find((item) => item.id === "legacy-content-migrator");
  const creativeSuite = aiWork.filter((item) => item.group === "Creative Suite");
  const enterpriseSystems = aiWork.filter((item) => item.group === "Fintech and Enterprise");

  async function narrate(item: AiWorkItem) {
    const currentId = ++playId.current;
    setPlayback("loading");
    try {
      await window.FACETEST?.unlock();
      window.FACE?.perform("proud", 0.64, 8);
      showAceNarration(`${item.title} · presentation`, item.presentation);
      await window.FACETEST?.speak(item.presentation, { name: "proud", intensity: 0.64 });
      if (currentId === playId.current) setPlayback("complete");
    } catch {
      if (currentId === playId.current) setPlayback("idle");
    }
  }

  function openItem(item: AiWorkItem) {
    playId.current += 1;
    window.FACETEST?.stop();
    setSelected(item);
    setPlayback("idle");
    if (voiceEnabled) window.setTimeout(() => narrate(item), 80);
  }

  function closeItem() {
    playId.current += 1;
    window.FACETEST?.stop();
    setSelected(null);
    setPlayback("idle");
  }

  async function togglePlayback() {
    if (!selected) return;
    if (playback === "playing") {
      await window.FACETEST?.pauseSpeech();
      setPlayback("paused");
      return;
    }
    if (playback === "paused") {
      await window.FACETEST?.resumeSpeech();
      setPlayback("playing");
      return;
    }
    narrate(selected);
  }

  function stopPlayback() {
    playId.current += 1;
    window.FACETEST?.stop();
    setPlayback("idle");
  }

  async function openGuidedWorkflow(item: AiWorkItem) {
    playId.current += 1;
    window.FACETEST?.stop();
    try {
      await window.FACETEST?.unlock();
    } catch {
      // The workflow still opens visually if audio is unavailable.
    }
    setSelected(null);
    setPlayback("idle");
    setGuidedItem(item);
  }

  useEffect(() => {
    const openRequestedItem = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const item = aiWork.find((candidate) => candidate.id === id);
      if (item) openItem(item);
    };
    const openRequestedWorkflow = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const item = aiWork.find((candidate) => candidate.id === id && candidate.kind === "workflow");
      if (item) void openGuidedWorkflow(item);
    };
    window.addEventListener("newd:open-ai-item", openRequestedItem);
    window.addEventListener("newd:open-ai-workflow", openRequestedWorkflow);
    return () => {
      window.removeEventListener("newd:open-ai-item", openRequestedItem);
      window.removeEventListener("newd:open-ai-workflow", openRequestedWorkflow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  return (
    <div className="ai-page">
      <header className="ai-hero">
        <p className="kicker">How I build useful AI</p>
        <ElectricShimmerTitle lines={["UNDERSTAND THE WORK.", "BUILD THE PROOF."]} />
        <div className="ai-hero-bottom">
          <p>
            AI earns a place in the process by making the work measurably better. Research the real system, prototype the smallest credible fix, test it against real use cases and failure modes, then put only proven, secure, human-accountable solutions into production.
          </p>
        </div>
        <div className="ai-method" aria-label="Adam Cagle's AI development method">
          <article>
            <span>Understand</span>
            <p>Research the process, talk to the people doing it, and map what actually happens before deciding what AI should do.</p>
          </article>
          <article>
            <span>Find the friction</span>
            <p>Locate the costly handoff, repeated task, missing insight, or decision that better evidence and automation could improve.</p>
          </article>
          <article>
            <span>Prove the answer</span>
            <p>Prototype fast. If the idea earns a second week, test it against real cases, failure modes, and a measurable definition of better.</p>
          </article>
          <article>
            <span>Earn production</span>
            <p>Harden what works with security, privacy, ethics, evaluation, monitoring, and clear human authority over consequential decisions.</p>
          </article>
        </div>
        <p className="ai-fluency-note"><strong>AI fluency is part of the system.</strong> People should understand what the tool can do, where it can fail, how it is governed, and when the decision remains theirs.</p>
      </header>

      <WorkGroup
        description="These systems work together around a governed brand core. Agencies and client teams can research an audience, protect the claims and voice, develop strategically different ideas, evaluate the creative, test what performs, and carry the learning into the next assignment."
        items={creativeSuite}
        name="CREATIVE SUITE."
        onOpen={openItem}
      />

      {singularity && (
        <section className="ai-visual-proof">
          <header className="ai-group-head">
            <h2>SINGULARITY<br />SEO.</h2>
            <p>Singularity turns ChatGPT into the control room for a connected WordPress site. It audits technical health, studies the competitive field, proposes SEO and answer-engine improvements, and measures the result. Public changes still require approval, and every applied change keeps a rollback record.</p>
          </header>
          <div className="ai-proof-grid single">
            <article>
              <button onClick={() => openItem(singularity)} type="button" aria-label={`Open ${singularity.title}`}>
                <AiSystemPortrait item={singularity} />
                <span className="ai-proof-copy">
                  <span>{singularity.kicker}</span>
                  <strong>{singularity.headline}</strong>
                  <small>{singularity.summary}</small>
                </span>
              </button>
            </article>
          </div>
        </section>
      )}

      <WorkGroup
        description="I started by building narrow agents for financial intelligence and decision support. Once those systems proved useful, the requests changed. Teams wanted the same evidence discipline, model control, verification, and human authority turned into repeatable workflows for the work around them."
        items={enterpriseSystems}
        name="FINTECH & ENTERPRISE."
        onOpen={openItem}
      />

      {migrator && (
        <section className="ai-group ai-migrator-feature">
          <header className="ai-group-head">
            <h2>LEGACY CONTENT<br />MIGRATOR.</h2>
            <p>Migration is where content strategy, extraction, governance, and operational risk collide. This system takes mixed pages, documents, scans, duplicates, and conflicting evidence through a controlled transformation while people retain authority over what survives, what changes, and what publishes.</p>
          </header>
          <div className="ai-card-grid single"><WorkCard item={migrator} onOpen={openItem} /></div>
        </section>
      )}

      <section className="ai-skills-section">
        <header className="ai-group-head">
          <h2>SKILLS<br />&amp; MD.</h2>
          <p>Not every problem needs a workflow or an application. Sometimes the right answer is a carefully built skill or Markdown file that gives a strong model the process, evidence standard, voice, exceptions, and review gates it was missing. These are portable pieces of working expertise.</p>
        </header>
        <div className="ai-skills-grid">
          {aiSkills.map((skill) => (
            <article key={skill.title}>
              <div className="skill-pixel-frame"><GoldPixelWord word={skill.word} /></div>
              <div className="ai-skill-body">
                <span>{skill.kicker}</span>
                <h3>{skill.title}</h3>
                <p>{skill.description}</p>
                <div>
                  <a href={skill.viewUrl} target="_blank" rel="noreferrer">View the system <ArrowUpRight size={14} /></a>
                  <a href={skill.downloadUrl} download>{skill.downloadLabel}</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="ai-reserve">
        <header className="ai-group-head">
          <h2>AGENTS, ANALYSIS<br />&amp; AUTOMATION.</h2>
          <p>Before the current workflow suite, I built focused agents, research instruments, and production automation for specific problems. They established the patterns that carry through the newer work: evidence before confidence, visible rules, bounded authority, and a person responsible for the decision.</p>
        </header>
        <div className="reserve-grid">
          {supportingAiCards.map((card) => (
            <article key={card.title}>
              <span>{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <small>{card.tech.join(" · ")}</small>
            </article>
          ))}
        </div>
      </section>

      {selected && createPortal(
        <div className="ai-detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeItem()}>
          <article className="ai-detail" role="dialog" aria-modal="true" aria-labelledby="ai-detail-title">
            <button className="ai-detail-close" onClick={closeItem} type="button" aria-label="Close system detail"><X size={22} /></button>
            <div className="ai-detail-marker">{selected.group} / {selected.kicker}</div>
            <h2 id="ai-detail-title">{selected.title}</h2>
            {selected.url && selected.kind === "workflow" && (
              <button className="ai-detail-link ai-detail-link-top" onClick={() => void openGuidedWorkflow(selected)} type="button">
                Open the guided workflow <ArrowUpRight size={17} />
              </button>
            )}
            <AiSystemPortrait item={selected} />
            <p className="ai-detail-headline">{selected.headline}</p>
            <div className="ai-detail-copy">
              <p>{selected.summary}</p>
              {selected.caseStudy && <p><strong>Representative case</strong>{selected.caseStudy}</p>}
            </div>

            <div className="ace-player" data-state={playback}>
              <div className="ace-player-status">
                <span className="ace-player-pulse" />
                <div><strong>ACE PRESENTS</strong><span>{playback === "loading" ? "Preparing voice" : playback === "playing" ? "Speaking" : playback === "paused" ? "Paused" : playback === "complete" ? "Presentation complete" : voiceEnabled ? "Ready" : "Audio optional"}</span></div>
              </div>
              <div className="ace-player-controls">
                <button onClick={togglePlayback} type="button" aria-label={playback === "playing" ? "Pause presentation" : "Play presentation"}>
                  {playback === "playing" ? <Pause size={17} /> : <Play size={17} />}
                </button>
                <button onClick={() => narrate(selected)} type="button" aria-label="Restart presentation"><RotateCcw size={16} /></button>
                <button onClick={stopPlayback} type="button" aria-label="Stop presentation"><Square size={15} /></button>
              </div>
            </div>

            <div className="ai-detail-meta">
              <div><span>Business tags</span><p>{selected.tags.join(" · ")}</p></div>
              <div><span>Languages</span><p>{selected.languages.join(" · ")}</p></div>
              <div><span>Technology and controls</span><p>{selected.technology.join(" · ")}</p></div>
            </div>

            {selected.url && selected.kind === "workflow" && (
              <button className="ai-detail-link" onClick={() => void openGuidedWorkflow(selected)} type="button">
                Open the guided workflow <ArrowUpRight size={17} />
              </button>
            )}
            {selected.url && selected.kind !== "workflow" && (
              <a className="ai-detail-link" href={selected.url} target="_blank" rel="noreferrer">
                Open the live product <ArrowUpRight size={17} />
              </a>
            )}
          </article>
        </div>,
        document.body,
      )}

      {guidedItem && (
        <GuidedWorkflowViewer item={guidedItem} voiceEnabled={voiceEnabled} onClose={() => setGuidedItem(null)} />
      )}
    </div>
  );
}
