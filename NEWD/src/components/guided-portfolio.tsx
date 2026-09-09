"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Mail,
  Mic,
  FileText,
  Send,
  Sparkles,
  Volume2,
} from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { FaceStage } from "@/components/face-stage";
import { EntryParticleField } from "@/components/entry-particle-field";
import { AiPage } from "@/components/ai-page";
import { CopywritingPage } from "@/components/copywriting-page";
import { BrandPage } from "@/components/brand-page";
import { FunPage } from "@/components/fun-page";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";
import { ProfileModals } from "@/components/profile-modals";
import { showAceNarration } from "@/lib/ace-transcript";

type Phase = "consent" | "forming" | "arrival" | "dissolving" | "reforming" | "docked" | "site";
type Section = "Home" | "Copywriting" | "AI" | "Brand" | "Fun";

const sections: Section[] = ["Home", "Copywriting", "AI", "Brand", "Fun"];
const headerSections: { label: string; section: Section }[] = [
  { label: "AI", section: "AI" },
  { label: "Brand", section: "Brand" },
  { label: "Copy", section: "Copywriting" },
];

const pageIntroductions: Partial<Record<Section, { label: string; text: string; audio: string; expression: string }>> = {
  AI: {
    label: "ACE · AI",
    text: "Adam's AI practice spans prompt engineering, MCP and API integrations, agents, workflows, and, if I may say so, one remarkably handsome chatbot. The point is practical: make the work better and ship what earns its place.",
    audio: "/ace-answers/ai-page-intro.mp3",
    expression: "proud",
  },
  Brand: {
    label: "ACE · Brand",
    text: "Adam's brand experience across Agency689 and DGWB includes Toshiba, Xbox, Sunset Marquis, and Traveler Guitar. He built the strategy, built the team, and stayed accountable for the result.",
    audio: "/ace-answers/brand-page-intro.mp3?v=agency-name-2",
    expression: "proud",
  },
  Copywriting: {
    label: "ACE · Copywriting",
    text: "Adam's copywriting began with writing the lines, then grew into building the systems that create the lines and grow the business. The craft still matters. Now it can scale without losing the brand.",
    audio: "/ace-answers/copy-page-intro.mp3",
    expression: "warm",
  },
};

const homeIntroduction = {
  label: "ACE · welcome",
  text: "Welcome to Adam's site. Explore on your own, or press the blue button and ask me for any page, client, project, or question about Adam. I'll take it from there.",
  audio: "/ace-answers/home-page-welcome.mp3",
  expression: "warm",
};

async function playAceIntroduction(introduction: { label: string; text: string; audio: string; expression: string }) {
  const cue = { name: introduction.expression, intensity: .68 };
  showAceNarration(introduction.label, introduction.text);
  window.FACE?.perform(cue.name, cue.intensity, Math.min(9, 4 + introduction.text.length / 34));
  try {
    await window.FACETEST?.unlock();
    await window.FACETEST?.playAudio(introduction.audio, cue);
  } catch {
    try {
      await window.FACETEST?.speak(introduction.text, cue);
    } catch {
      // The written introduction remains available if audio cannot play.
    }
  }
}

function scrollContentToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.querySelector<HTMLElement>(".content-window")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

const cards = [
  {
    section: "AI" as Section,
    eyebrow: "AI systems",
    title: "Practical intelligence, built to ship",
    copy: "Working AI products that turn content, research, creative development, and conversion strategy into usable systems.",
    facets: ["AI", "Product", "Workflow"],
  },
  {
    section: "Brand" as Section,
    eyebrow: "Brand leadership",
    title: "Brands people can believe in",
    copy: "Positioning, identity, campaigns, and team leadership across hospitality, technology, entertainment, and consumer products.",
    facets: ["Brand", "Hospitality", "Leadership"],
  },
  {
    section: "Copywriting" as Section,
    eyebrow: "Copywriting",
    title: "Language with a job to do",
    copy: "Voice systems and conversion-minded writing that make complicated offers clear, distinct, and worth choosing.",
    facets: ["Copy", "Voice", "Growth"],
  },
];

export function GuidedPortfolio() {
  const [phase, setPhase] = useState<Phase>("consent");
  const [introBeat, setIntroBeat] = useState<"identity" | "candidate" | null>(null);
  const [micError, setMicError] = useState("");
  const [paused, setPaused] = useState(true);
  const [section, setSection] = useState<Section>("Home");
  const [contactOpen, setContactOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState<"resume" | null>(null);
  const [guideError, setGuideError] = useState("");
  const voiceModules = useRef<Promise<void> | null>(null);
  const suppressSectionIntro = useRef(false);
  const sectionIntroRun = useRef(0);

  useEffect(() => {
    document.body.dataset.voiceName = "ACE";
    document.body.dataset.speechEndpoint = "/api/facetest-fish-stream-speak";
    document.body.dataset.staticGreeting = "";
    voiceModules.current = (async () => {
      await import("@/lib/facetest-voice-stream");
      await import("@/lib/facetest-conversation-handsfree");
      await window.FACETEST?.initialize();
    })();

    const searchParams = new URLSearchParams(window.location.search);
    const requestedSection = searchParams.get("section");
    const matchedSection = sections.find((item) => item.toLowerCase() === requestedSection?.toLowerCase());
    if (matchedSection) window.setTimeout(() => setSection(matchedSection), 0);
    const isLocalPreview = ["127.0.0.1", "localhost"].includes(window.location.hostname);
    const introPreview = searchParams.get("__intro");
    if (isLocalPreview && (introPreview === "identity" || introPreview === "candidate")) {
      window.setTimeout(() => {
        setIntroBeat(introPreview);
        setPhase("arrival");
      }, 0);
    }
    if (isLocalPreview && searchParams.get("__preview") === "1") {
      document.documentElement.dataset.newdPreview = "true";
      window.setTimeout(() => {
        setPhase("site");
      }, 0);
    }
    return () => { delete document.documentElement.dataset.newdPreview; };
  }, []);

  useEffect(() => {
    const openProfile = (event: Event) => {
      const profile = (event as CustomEvent<{ profile?: string }>).detail?.profile;
      if (profile === "resume") setProfileOpen(profile);
    };
    window.addEventListener("newd:open-profile", openProfile);
    return () => window.removeEventListener("newd:open-profile", openProfile);
  }, []);

  useEffect(() => {
    const navigate = (event: Event) => {
      const detail = (event as CustomEvent<{ section?: string; suppressIntro?: boolean }>).detail;
      const destination = detail?.section;
      if (!sections.includes(destination as Section)) return;
      suppressSectionIntro.current = Boolean(detail?.suppressIntro);
      window.setTimeout(() => { suppressSectionIntro.current = false; }, 500);
      setSection(destination as Section);
      window.requestAnimationFrame(scrollContentToTop);
    };
    window.addEventListener("newd:navigate", navigate);
    return () => window.removeEventListener("newd:navigate", navigate);
  }, []);

  useEffect(() => {
    if (phase !== "site" || section === "Home") return;
    if (suppressSectionIntro.current) {
      suppressSectionIntro.current = false;
      return;
    }
    const introduction = pageIntroductions[section];
    if (!introduction) return;
    const run = ++sectionIntroRun.current;
    const timer = window.setTimeout(() => {
      if (run !== sectionIntroRun.current) return;
      window.FACETEST?.stop();
      void playAceIntroduction(introduction);
    }, 140);
    return () => {
      window.clearTimeout(timer);
      sectionIntroRun.current += 1;
      window.FACETEST?.stop();
    };
  }, [phase, section]);

  useEffect(() => {
    const onConversationState = (event: Event) => {
      const active = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      setPaused(!active);
    };
    window.addEventListener("facetest:conversation-state", onConversationState);
    return () => window.removeEventListener("facetest:conversation-state", onConversationState);
  }, []);

  function delay(milliseconds: number) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  async function waitForGuide() {
    await voiceModules.current;
    if (!window.FACETEST) throw new Error("The voice guide did not initialize.");
    return window.FACETEST;
  }

  async function runArrival() {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase("forming");
    setIntroBeat(null);
    await delay(reducedMotion ? 60 : 1450);
    setPhase("arrival");
    const guide = await waitForGuide();
    await delay(reducedMotion ? 60 : 720);
    setIntroBeat("identity");
    const greeting = "Hi. I'm ACE. I'm the AI for AdamCagle.com. Now, let's meet the best candidate for your job.";
    showAceNarration("ACE · welcome", greeting);
    const speech = (async () => {
      try {
        await guide.playAudio("/ace-answers/site-intro.mp3?v=ace-intro-2", { name: "warm", intensity: 0.74 });
      } catch {
        await guide.speak(greeting, { name: "warm", intensity: 0.74 });
      }
    })();
    await delay(3300);
    setIntroBeat(null);
    await delay(240);
    setIntroBeat("candidate");
    await speech;
    await delay(180);
    setIntroBeat(null);
    setPhase("dissolving");
    await delay(900);
    setPhase("reforming");
    await delay(180);
    setPhase("docked");
    await delay(900);
    setSection("Home");
    const homeUrl = new URL(window.location.href);
    homeUrl.searchParams.delete("section");
    window.history.replaceState({}, "", homeUrl);
    scrollContentToTop();
    setPhase("site");
    await delay(650);
    window.dispatchEvent(new CustomEvent("facetest:enable-conversation"));
    await delay(80);
    await playAceIntroduction(homeIntroduction);
  }

  async function enterSite() {
    setMicError("");
    let arrivalStarted = false;
    try {
      const guide = await waitForGuide();
      await guide.unlock();
      arrivalStarted = true;
      await runArrival();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Voice could not start.";
      if (!arrivalStarted) {
        setMicError(`${message} Entering without the spoken welcome.`);
        setPhase("site");
      }
      else {
        setGuideError(message);
        setPhase("dissolving");
        await delay(900);
        setPhase("reforming");
        await delay(180);
        setPhase("docked");
        await delay(700);
        setPhase("site");
      }
    }
  }

  function openSection(destination: Section) {
    suppressSectionIntro.current = false;
    window.FACETEST?.stop();
    setContactOpen(false);
    setProfileOpen(null);
    setSection(destination);
    window.requestAnimationFrame(scrollContentToTop);
  }

  return (
    <main className="experience" data-phase={phase} data-section={section}>
      <div className="ambient-field" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ "--i": index } as React.CSSProperties} />
        ))}
      </div>

      <EntryParticleField phase={phase} />

      <div className="face-portal">
        <FaceStage phase={phase} paused={paused} />
      </div>

      <div
        className="face-wisp"
        data-active={["dissolving", "reforming", "docked"].includes(phase)}
        aria-hidden="true"
      >
        {Array.from({ length: 160 }, (_, index) => (
          <span
            key={index}
            style={{
              "--sx": `${(index % 16 - 7.5) * 12}px`,
              "--sy": `${(Math.floor(index / 16) - 4.5) * 13}px`,
              "--delay": `${index * 0.004}s`,
              "--size": `${2 + (index % 4) * .65}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {phase !== "site" && phase !== "docked" && (
        <section className="consent-screen" aria-hidden={phase !== "consent"}>
          <div className="consent-card entry-card">
            <p className="kicker">Adam Cagle&apos;s portfolio</p>
            <ElectricShimmerTitle lines={["HI.", "I'M ACE."]} />
            <p className="lede">
              I&apos;m Adam&apos;s site agent. I can speak to you, just a heads up. If your sound is off, every answer appears as text too.
            </p>
            <div className="entry-notice">
              <Volume2 size={21} aria-hidden="true" />
              <span>
                <strong>Sound on or off, you won&apos;t miss a word.</strong>
                <small>No signup. This site does not save your conversation or browsing history.</small>
              </span>
            </div>

            {micError && <p className="form-error" role="alert">{micError}</p>}

            <button className="primary-action entry-button" onClick={enterSite} type="button">
              Enter <ChevronRight size={18} />
            </button>
          </div>
        </section>
      )}

      {["arrival", "dissolving", "reforming", "docked"].includes(phase) && (
        <section className="arrival-copy" aria-live="polite">
          {introBeat === "identity" && (
            <h2 className="arrival-beat identity" key="identity">
              <span>Hi. I&apos;m ACE.</span>
              <span>The AI for AdamCagle.com.</span>
            </h2>
          )}
          {introBeat === "candidate" && (
            <h2 className="arrival-beat candidate" key="candidate">
              <span>Now, let&apos;s meet the</span>
              <span>best candidate for your job.</span>
            </h2>
          )}
        </section>
      )}

      <div className="site-shell" aria-hidden={phase !== "site"}>
          <header className="site-header">
            <button
              className={section === "Home" ? "site-home active" : "site-home"}
              onClick={() => openSection("Home")}
              type="button"
            >
              Home
            </button>
            <nav aria-label="Portfolio sections">
              {headerSections.map((item) => (
                <button
                  className={section === item.section ? "active" : ""}
                  key={item.section}
                  onClick={() => openSection(item.section)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
              <div className="header-contact" data-open={contactOpen}>
                <button
                  aria-expanded={contactOpen}
                  aria-label={contactOpen ? "Hide Adam's email" : "Show Adam's email"}
                  className="header-contact-toggle"
                  onClick={() => setContactOpen((open) => !open)}
                  type="button"
                >
                  <Mail size={18} />
                </button>
                <a className="header-contact-address" href="mailto:adamrcagle@gmail.com">
                  adamrcagle@gmail.com
                </a>
              </div>
            </nav>
          </header>
          <div className="ace-rail-title">
            ACE
          </div>

          <section className="content-window" id="top">
            {section === "AI" ? (
              <AiPage voiceEnabled />
            ) : section === "Copywriting" ? (
              <CopywritingPage voiceEnabled />
            ) : section === "Brand" ? (
              <BrandPage voiceEnabled />
            ) : section === "Fun" ? (
              <FunPage />
            ) : (
              <>
                <div className="hero-copy">
                  <ElectricShimmerTitle lines={["ADAM R. CAGLE"]} />
                  <p>
                    For twenty-five years I&apos;ve run Agency689 where ideas meet consequences. Sixty major accounts. Fixed price, variable cost, my name on the proposal. Everybody got paid, and what was left was ours, or it wasn&apos;t.
                  </p>
                  <p>
                    That arithmetic teaches you quickly which ideas sound good and which ones work. A great line wins the account. Lifecycle, conversion, product, and retention keeps the account for decades. The clients we kept that long are the work I&apos;m most proud of.
                  </p>
                  <p>
                    Now I build AI into that same practice. People on the ideas, systems on the scale. Software nobody adopts is just cost. So I start with how a team actually works, build the smallest useful answer, and make it earn its way into production.
                  </p>
                </div>

                <div className="profile-card-grid" aria-label="About Adam Cagle">
                  <article className="profile-card resume-card">
                    <div className="profile-card-icon"><FileText size={24} /></div>
                    <div>
                      <p>Career, capabilities, credentials</p>
                      <h2>Résumé</h2>
                      <span>The complete story: creative leader, agency operator, technical translator, and hands-on builder of production AI systems.</span>
                    </div>
                    <button onClick={() => setProfileOpen("resume")} type="button" aria-label="Open Adam Cagle's resume">
                      Read the résumé <ArrowUpRight size={18} />
                    </button>
                  </article>
                </div>

                <div className="work-grid portfolio-grid" aria-label={`${section} work`}>
                  {cards
                    .filter((card) => section === "Home" || card.facets.includes(section))
                    .map((card) => (
                      <article className="work-card" key={card.title}>
                        <p>{card.eyebrow}</p>
                        <h2>{card.title}</h2>
                        <span>{card.copy}</span>
                        <ul aria-label="Work categories">
                          {card.facets.map((facet) => <li key={facet}>{facet}</li>)}
                        </ul>
                        <button onClick={() => openSection(card.section)} type="button" aria-label={`Open ${card.title}`}><ArrowUpRight size={18} /></button>
                      </article>
                    ))}
                </div>

                <article className="home-fun-card">
                  <div className="home-fun-icon"><Sparkles size={25} aria-hidden="true" /></div>
                  <div>
                    <p>ACE, physics, games, and fiction</p>
                    <h2>Fun Stuff</h2>
                    <span>Insight into a few projects Adam built because curiosity is useful, physics is fun, and not every good idea needs a client brief.</span>
                  </div>
                  <button onClick={() => openSection("Fun")} type="button">
                    Explore the side quests <ArrowUpRight size={18} />
                  </button>
                </article>
              </>
            )}
          </section>

          <aside className="voice-rail" aria-label="Voice guide and conversation">
            <div className="rail-face-space" aria-hidden="true" />
            <output className="sr-only" id="status">ACE voice status</output>
            <button
              aria-label="Hold to talk to ACE. Release to send."
              aria-pressed="false"
              className="pause-control"
              data-state="idle"
              id="mic"
              type="button"
            >
              <Mic size={16} />
              <span>Hold to talk</span>
              <kbd>Space</kbd>
            </button>
            <div className="chat-log" id="transcript">
              <p className="system-line">Conversation</p>
              <p className="user-message" id="user-line" />
              <p className="agent-message" id="agent-line">Ask me about Adam&apos;s work, experience, or fit for your role.</p>
              {guideError && <p className="guide-error">{guideError}</p>}
              <div className="suggestion">Try “Show me brand work in hospitality.”</div>
            </div>
            <form className="ace-text-form" id="ace-text-form">
              <label className="sr-only" htmlFor="ace-text-input">Type a message to ACE</label>
              <input
                autoComplete="off"
                id="ace-text-input"
                maxLength={1200}
                placeholder="Type to ACE..."
                type="text"
              />
              <button aria-label="Send message to ACE" id="ace-text-send" type="submit">
                <Send size={16} />
              </button>
            </form>
            <footer className="rail-footer" aria-label="Adam Cagle links">
              <a aria-label="Email Adam Cagle" href="mailto:adamrcagle@gmail.com" title="Email Adam">
                <Mail size={17} />
              </a>
              <a aria-label="Adam Cagle on GitHub" href="https://github.com/capo689" rel="noreferrer" target="_blank" title="GitHub">
                <FaGithub size={17} />
              </a>
              <a aria-label="Adam Cagle on LinkedIn" href="https://www.linkedin.com/in/adamcagle/" rel="noreferrer" target="_blank" title="LinkedIn">
                <FaLinkedinIn size={17} />
              </a>
            </footer>
          </aside>
          <ProfileModals open={profileOpen} onClose={() => setProfileOpen(null)} />
        </div>
    </main>
  );
}
