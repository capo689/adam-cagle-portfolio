"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Square,
  X,
} from "lucide-react";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";
import { copyCases, type CopyCase } from "@/content/copywriting-content";
import { showAceNarration } from "@/lib/ace-transcript";
import { useModalAccessibility } from "@/lib/modal-accessibility";

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "complete";
type LightboxState = { item: CopyCase; index: number };

function nextIndex(current: number, direction: number, length: number) {
  return (current + direction + length) % length;
}

function CopyLogic({ item, compact = false }: { item: CopyCase; compact?: boolean }) {
  return (
    <div className={`copy-logic-flow${compact ? " compact" : ""}`}>
      <div>
        <span>Problem</span>
        <p>{item.problem}</p>
      </div>
      <ChevronRight aria-hidden="true" />
      <div>
        <span>Insight</span>
        <p>{item.insight}</p>
      </div>
      <ChevronRight aria-hidden="true" />
      <div className="idea">
        <span>Line / Idea</span>
        <strong>{item.headline}</strong>
      </div>
    </div>
  );
}

function CopyGallery({
  item,
  index,
  onChange,
  onOpen,
  detailed = false,
}: {
  item: CopyCase;
  index: number;
  onChange: (index: number) => void;
  onOpen: (index: number) => void;
  detailed?: boolean;
}) {
  const image = item.images[index] ?? item.images[0];
  const multiple = item.images.length > 1;
  const showThumbnails = multiple && item.images.length <= 12;

  return (
    <div className={`copy-client-gallery${detailed ? " detailed" : ""}`}>
      <div className="copy-gallery-stage">
        <button className="copy-gallery-image" onClick={() => onOpen(index)} type="button" aria-label={`Enlarge ${image.caption}`}>
          <Image src={image.src} alt={image.alt} fill sizes={detailed ? "(max-width: 760px) 100vw, 78vw" : "(max-width: 760px) 100vw, 70vw"} />
          <span>Click to enlarge</span>
        </button>
        {multiple && (
          <div className="copy-gallery-arrows" aria-label={`${item.client} work gallery controls`}>
            <button onClick={() => onChange(nextIndex(index, -1, item.images.length))} type="button" aria-label="Previous piece"><ChevronLeft size={24} /></button>
            <button onClick={() => onChange(nextIndex(index, 1, item.images.length))} type="button" aria-label="Next piece"><ChevronRight size={24} /></button>
          </div>
        )}
      </div>
      <div className="copy-gallery-meta">
        <div>
          <strong>{image.caption}</strong>
          {detailed && image.description && <p>{image.description}</p>}
        </div>
        {multiple && <span>{index + 1} / {item.images.length}</span>}
      </div>
      {showThumbnails && (
        <div className="copy-gallery-thumbs" aria-label={`${item.client} work thumbnails`}>
          {item.images.map((candidate, candidateIndex) => (
            <button
              className={candidateIndex === index ? "active" : ""}
              key={candidate.src}
              onClick={() => onChange(candidateIndex)}
              type="button"
              aria-label={`Show ${candidate.caption}`}
              aria-pressed={candidateIndex === index}
            >
              <Image src={candidate.src} alt="" fill sizes="100px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CopywritingPage({ voiceEnabled }: { voiceEnabled: boolean }) {
  const [selected, setSelected] = useState<CopyCase | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [activeImages, setActiveImages] = useState<Record<string, number>>({});
  const [playback, setPlayback] = useState<PlaybackState>("idle");
  const playId = useRef(0);
  const detailDialogRef = useModalAccessibility<HTMLElement>(Boolean(selected), closeDetail);
  const lightboxDialogRef = useModalAccessibility<HTMLElement>(Boolean(lightbox), () => setLightbox(null));

  useEffect(() => {
    const onVoiceState = (event: Event) => {
      if (!selected) return;
      const state = (event as CustomEvent<{ state?: string }>).detail?.state;
      if (state === "thinking") setPlayback("loading");
      if (state === "speaking") setPlayback("playing");
      if (state === "paused") setPlayback("paused");
    };
    window.addEventListener("facetest:voice-state", onVoiceState);
    return () => window.removeEventListener("facetest:voice-state", onVoiceState);
  }, [selected]);

  useEffect(() => {
    const onGlobalStop = () => {
      playId.current += 1;
      setPlayback("idle");
    };
    window.addEventListener("facetest:speech-stopped", onGlobalStop);
    return () => window.removeEventListener("facetest:speech-stopped", onGlobalStop);
  }, []);

  useEffect(() => {
    if (!selected && !lightbox) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (selected && !lightbox) {
      window.requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(".copy-client-detail")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
      });
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected, lightbox]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (lightbox) {
        if (event.key === "Escape") setLightbox(null);
        if (event.key === "ArrowLeft") setLightbox((current) => current && ({ ...current, index: nextIndex(current.index, -1, current.item.images.length) }));
        if (event.key === "ArrowRight") setLightbox((current) => current && ({ ...current, index: nextIndex(current.index, 1, current.item.images.length) }));
        return;
      }
      if (selected && event.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function activeIndex(item: CopyCase) {
    return activeImages[item.id] ?? 0;
  }

  function setActiveIndex(item: CopyCase, index: number) {
    setActiveImages((current) => ({ ...current, [item.id]: index }));
  }

  async function narrate(item: CopyCase) {
    const currentId = ++playId.current;
    setPlayback("loading");
    try {
      await window.FACETEST?.unlock();
      window.FACE?.perform("proud", 0.62, 8);
      showAceNarration(`${item.client} · case study`, item.presentation);
      await window.FACETEST?.speak(item.presentation, { name: "proud", intensity: 0.62 });
      if (currentId === playId.current) setPlayback("complete");
    } catch {
      if (currentId === playId.current) setPlayback("idle");
    }
  }

  function openDetail(item: CopyCase) {
    playId.current += 1;
    window.FACETEST?.stop();
    setSelected(item);
    setPlayback("idle");
    const path = `/copy/${item.id}`;
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    if (voiceEnabled) window.setTimeout(() => void narrate(item), 80);
  }

  function closeDetail() {
    playId.current += 1;
    window.FACETEST?.stop();
    setSelected(null);
    setPlayback("idle");
    if (window.location.pathname.startsWith("/copy/")) window.history.replaceState({}, "", "/copy");
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
    void narrate(selected);
  }

  function stopPlayback() {
    playId.current += 1;
    window.FACETEST?.stop();
    setPlayback("idle");
  }

  useEffect(() => {
    const openRequestedClient = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      const item = copyCases.find((candidate) => candidate.id === id);
      if (item) openDetail(item);
    };
    window.addEventListener("newd:open-copy-case", openRequestedClient);
    return () => window.removeEventListener("newd:open-copy-case", openRequestedClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  useEffect(() => {
    const showRequestedWork = (event: Event) => {
      const filter = (event as CustomEvent<{ filter?: string }>).detail?.filter;
      const item = copyCases.find((candidate) => candidate.industries.includes(filter || "") || candidate.tags.includes(filter || ""));
      if (!item) return;
      document.getElementById(item.id)?.scrollIntoView({ block: "start", behavior: "smooth" });
    };
    window.addEventListener("newd:filter-copy", showRequestedWork);
    return () => window.removeEventListener("newd:filter-copy", showRequestedWork);
  }, []);

  return (
    <div className="copy-editorial">
      <header className="ai-hero copy-editorial-hero">
        <p className="kicker">How I build copy that works</p>
        <ElectricShimmerTitle lines={["KNOW THE MARKET.", "MOVE THE NUMBER."]} />
        <div className="ai-hero-bottom">
          <p>
            The line is never the starting point. Learn the client, category, customer, competition, and channel until the brief exposes the real problem. Then write, test, and keep iterating until the language does its job in the market.
          </p>
        </div>
        <div className="ai-method copy-method" aria-label="Adam Cagle's copywriting process">
          <article>
            <span>Research</span>
            <p>Learn every detail that can change the answer: business model, category, competition, customer, culture, channel, and evidence.</p>
          </article>
          <article>
            <span>Write</span>
            <p>Turn the brief into creative territories, then sharpen the strongest thought into the line only this brand can own.</p>
          </article>
          <article>
            <span>Test</span>
            <p>Pressure test ideas against governed AI personas, then put the survivors into live funnels, emails, ads, and A/B tests where behavior settles the argument.</p>
          </article>
          <article>
            <span>Scale</span>
            <p>Build approved voice, claims, and performance learning into a copy system that moves faster, creates more useful variation, and improves without losing the brand.</p>
          </article>
        </div>
        <p className="ai-fluency-note"><strong>Judgment stays human.</strong> Research can accelerate, personas can challenge, and systems can scale. A writer still owns the idea, the claim, and the final word.</p>
      </header>

      <div className="copy-client-stack">
        {copyCases.map((item) => {
          const index = activeIndex(item);
          return (
            <section className="copy-client-case" id={item.id} key={item.id}>
              <div className="copy-client-heading">
                <div>
                  <span>{item.client} / {item.category}</span>
                  <h2>{item.headline}</h2>
                  <p>{item.overview}</p>
                </div>
                <aside>
                  <span>Key result</span>
                  <strong>{item.resultLead}</strong>
                </aside>
              </div>

              <CopyLogic item={item} compact />

              <CopyGallery
                item={item}
                index={index}
                onChange={(next) => setActiveIndex(item, next)}
                onOpen={(imageIndex) => setLightbox({ item, index: imageIndex })}
              />

              <button className="copy-details-trigger" onClick={() => openDetail(item)} type="button">
                See {item.client} details <ArrowUpRight size={18} />
              </button>
            </section>
          );
        })}
      </div>

      {selected && createPortal(
        <div className="copy-client-detail-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeDetail()}>
          <article className="copy-client-detail" ref={detailDialogRef} role="dialog" aria-modal="true" aria-labelledby="copy-client-detail-title" tabIndex={-1}>
            <button className="copy-client-detail-close" onClick={closeDetail} type="button" aria-label="Close client details"><X size={23} /></button>
            <div className="copy-client-detail-marker">{selected.client} / {selected.category}</div>
            <h2 id="copy-client-detail-title">{selected.headline}</h2>
            <div className="copy-client-detail-result"><span>Key result</span><strong>{selected.resultLead}</strong></div>

            <div className="ace-player" data-state={playback}>
              <div className="ace-player-status">
                <span className="ace-player-pulse" />
                <div><strong>ACE PRESENTS</strong><span>{playback === "loading" ? "Preparing voice" : playback === "playing" ? "Speaking" : playback === "paused" ? "Paused" : playback === "complete" ? "Presentation complete" : voiceEnabled ? "Ready" : "Audio available"}</span></div>
              </div>
              <div className="ace-player-controls">
                <button onClick={togglePlayback} type="button" aria-label={playback === "playing" ? "Pause presentation" : "Play presentation"}>{playback === "playing" ? <Pause size={17} /> : <Play size={17} />}</button>
                <button onClick={() => void narrate(selected)} type="button" aria-label="Restart presentation"><RotateCcw size={16} /></button>
                <button onClick={stopPlayback} type="button" aria-label="Stop presentation"><Square size={15} /></button>
              </div>
            </div>

            <p className="copy-client-detail-context">{selected.context}</p>
            <CopyLogic item={selected} />

            <CopyGallery
              item={selected}
              index={activeIndex(selected)}
              onChange={(next) => setActiveIndex(selected, next)}
              onOpen={(imageIndex) => setLightbox({ item: selected, index: imageIndex })}
              detailed
            />

            {selected.pullQuote && (
              <div className="copy-client-pull">
                <span>The body copy / idea</span>
                <blockquote>{selected.pullQuote}</blockquote>
                <p>{selected.pullBody}</p>
              </div>
            )}

            <div className="copy-client-detail-grid">
              <div><span>The system</span><p>{selected.system}</p></div>
              <div><span>Why it matters now</span><p>{selected.why}</p></div>
              <div className="outcome"><span>The outcome</span><strong>{selected.outcome}</strong></div>
            </div>

            <div className="copy-client-taxonomy">
              <div><span>Capabilities</span><p>{selected.tags.join(" · ")}</p></div>
              <div><span>Industries</span><p>{selected.industries.join(" · ")}</p></div>
              <div><span>Channels</span><p>{selected.channels.join(" · ")}</p></div>
            </div>
          </article>
        </div>,
        document.body,
      )}

      {lightbox && createPortal(
        <div className="copy-lightbox" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setLightbox(null)}>
          <figure ref={lightboxDialogRef} role="dialog" aria-modal="true" aria-label={`${lightbox.item.client} work gallery`} tabIndex={-1}>
            <button className="copy-lightbox-close" onClick={() => setLightbox(null)} type="button" aria-label="Close image gallery"><X size={24} /></button>
            {lightbox.item.images.length > 1 && (
              <>
                <button className="copy-lightbox-prev" onClick={() => setLightbox((current) => current && ({ ...current, index: nextIndex(current.index, -1, current.item.images.length) }))} type="button" aria-label="Previous image"><ChevronLeft size={30} /></button>
                <button className="copy-lightbox-next" onClick={() => setLightbox((current) => current && ({ ...current, index: nextIndex(current.index, 1, current.item.images.length) }))} type="button" aria-label="Next image"><ChevronRight size={30} /></button>
              </>
            )}
            <div className="copy-lightbox-image"><Image src={lightbox.item.images[lightbox.index].src} alt={lightbox.item.images[lightbox.index].alt} fill sizes="95vw" /></div>
            <figcaption>
              <div><span>{lightbox.item.client}</span><strong>{lightbox.item.images[lightbox.index].caption}</strong>{lightbox.item.images[lightbox.index].description && <p>{lightbox.item.images[lightbox.index].description}</p>}</div>
              <small>{lightbox.index + 1} / {lightbox.item.images.length}</small>
            </figcaption>
          </figure>
        </div>,
        document.body,
      )}
    </div>
  );
}
