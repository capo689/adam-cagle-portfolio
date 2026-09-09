"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Play, Square, Volume2, X } from "lucide-react";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";
import { BrandClientWall } from "@/components/brand-client-wall";
import { figueroaBookPages } from "@/content/figueroa-book";
import { showAceNarration } from "@/lib/ace-transcript";
import { useModalAccessibility } from "@/lib/modal-accessibility";

const agencyStory = "Agency689 is where Adam's full range becomes one practice. He co-founded the agency in 2001 and has spent twenty-five years helping clients find the strategic idea, shape the brand, write the language, direct the work, build the experience, and stay accountable for what happens after launch. He also built and wrote the current Agency689 site and created its generative AI introduction film. That is the point of the work: the person defining the idea stays close enough to make sure every expression of it still means the same thing.";

const figueroaStory = "Hotel Figueroa began with one sentence: To relate to artists, we must be artists. Adam used it as a decision rule, not a decorative manifesto. Six brand pillars, mission, promise, identity, typography, imagery direction, collateral, and a complete editorial voice all had to prove that sentence true. The result was a sixty-one-page system for a historic Los Angeles hotel reopening for a new creative audience.";

const principles = [
  {
    title: "Find the decision",
    copy: "A useful brand takes a side. It makes the company clearer by deciding what it believes, who it serves, and why someone should choose it.",
  },
  {
    title: "Make it ownable",
    copy: "Positioning becomes language, visual direction, behavior, and experience that competitors cannot borrow without looking like imitators.",
  },
  {
    title: "Make it operational",
    copy: "The idea has to hold across the website, campaign, product, sales story, content, team, and now the AI systems speaking for the brand.",
  },
  {
    title: "Make it compound",
    copy: "Keep the strategic core steady while the expression learns from the market, adapts to new channels, and builds recognition instead of starting over.",
  },
];

const brandRange = [
  {
    client: "Traveler Guitar",
    kind: "Consumer products",
    line: "The World's Most Adventurous Guitars.",
    proof: "A durable platform carried through fifteen years of product, ecommerce, retail, Amazon, and trade shows as DTC revenue grew from roughly $1.1 million to $5 million during the broader engagement.",
    image: "/copywriting/traveler-force.webp",
  },
  {
    client: "Killer Networks",
    kind: "Technology and gaming",
    line: "Winning is Killer.",
    proof: "Positioning, naming, identity, packaging, campaigns, channel, and launch. From incorporation to Qualcomm in three years.",
    image: "/copywriting/killer-warrior.webp",
  },
  {
    client: "Sunset Marquis",
    kind: "Hospitality and entertainment",
    line: "Legendary Nights Begin at Sunset.",
    proof: "More than two decades of brand stewardship across rooms, dining, music, wellness, events, digital, and performance marketing.",
    image: "/copywriting/sunset-legendary-nights.webp",
  },
  {
    client: "Clink Hostels",
    kind: "International hospitality",
    line: "Measure your journey in friends, not miles.",
    proof: "One voice and messaging architecture built to travel across properties, offers, audiences, and four European cities.",
    image: "/copywriting/clink-amsterdam.jpg",
  },
];

const figueroaImages = [
  {
    src: "/brand/hotel-figueroa-collateral.jpg",
    alt: "Hotel Figueroa identity applied across stationery, merchandise, and guest collateral",
    caption: "The identity in use",
  },
  {
    src: "/brand/hotel-figueroa-logo-system.jpg",
    alt: "Hotel Figueroa brand book page defining logo standards",
    caption: "Identity standards",
  },
];

export function BrandPage({ voiceEnabled }: { voiceEnabled: boolean }) {
  const [speaking, setSpeaking] = useState<"agency" | "figueroa" | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [bookPage, setBookPage] = useState<number | null>(null);
  const lightboxDialogRef = useModalAccessibility<HTMLElement>(lightbox !== null, () => setLightbox(null));
  const bookDialogRef = useModalAccessibility<HTMLElement>(bookPage !== null, () => setBookPage(null));

  useEffect(() => {
    if (lightbox === null && bookPage === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLightbox(null);
        setBookPage(null);
      }
      if (bookPage !== null && event.key === "ArrowLeft") {
        setBookPage((page) => page === null ? null : Math.max(0, page - 1));
      }
      if (bookPage !== null && event.key === "ArrowRight") {
        setBookPage((page) => page === null ? null : Math.min(figueroaBookPages.length - 1, page + 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [bookPage, lightbox]);

  async function narrate(key: "agency" | "figueroa", text: string) {
    window.FACETEST?.stop();
    setSpeaking(key);
    try {
      await window.FACETEST?.unlock();
      window.FACE?.perform("proud", 0.6, 8);
      showAceNarration(`${key === "agency" ? "Agency689" : "Hotel Figueroa"} · brand story`, text);
      await window.FACETEST?.speak(text, { name: "proud", intensity: 0.6 });
    } finally {
      setSpeaking(null);
    }
  }

  function stopNarration() {
    window.FACETEST?.stop();
    setSpeaking(null);
  }

  useEffect(() => {
    const scrollToTarget = (selector: string) => {
      window.requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.scrollIntoView({ block: "start", behavior: "smooth" }));
    };
    const openFeature = (event: Event) => {
      const target = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (target === "agency") {
        if (window.location.pathname !== "/brand/agency") window.history.pushState({}, "", "/brand/agency");
        scrollToTarget(".brand-agency-feature");
      }
      if (target === "figueroa") {
        if (window.location.pathname !== "/brand/figueroa") window.history.pushState({}, "", "/brand/figueroa");
        scrollToTarget(".brand-figueroa-feature");
      }
    };
    const openClient = (event: Event) => {
      const name = (event as CustomEvent<{ name?: string }>).detail?.name;
      if (!name) return;
      const marks = Array.from(document.querySelectorAll<HTMLElement>(".brand-client-mark"));
      const mark = marks.find((candidate) => candidate.dataset.client === name);
      if (!mark) return;
      marks.forEach((candidate) => candidate.removeAttribute("data-focused"));
      mark.dataset.focused = "true";
      mark.scrollIntoView({ block: "center", behavior: "smooth" });
    };
    window.addEventListener("newd:open-brand-feature", openFeature);
    window.addEventListener("newd:open-brand-client", openClient);
    return () => {
      window.removeEventListener("newd:open-brand-feature", openFeature);
      window.removeEventListener("newd:open-brand-client", openClient);
    };
  }, []);

  return (
    <div className="brand-page">
      <header className="ai-hero brand-hero">
        <p className="kicker">The practice</p>
        <ElectricShimmerTitle lines={["A BRAND IS A", "DECISION SYSTEM."]} />
        <div className="ai-hero-bottom">
          <p>
            A brand is the operating logic behind every choice a company makes. I find the position only the business can own, turn it into language, identity, and experience, then build the system that keeps it coherent as teams, channels, and technology change.
          </p>
        </div>
        <div className="ai-method brand-method" aria-label="Adam Cagle's brand development method">
          {principles.map((principle) => (
            <article key={principle.title}>
              <span>{principle.title}</span>
              <p>{principle.copy}</p>
            </article>
          ))}
        </div>
        <p className="ai-fluency-note"><strong>The strategy holds. The expression moves.</strong> Consistency is not repetition. The idea stays recognizable while the work keeps earning attention.</p>
      </header>

      <section className="brand-agency-feature">
        <div className="brand-section-head split">
          <div>
            <p className="kicker">Agency689</p>
            <h2>THE BRAND BEHIND THE BRANDS.</h2>
          </div>
          <p>Twenty-five years of strategy, copy, creative direction, digital product, client leadership, production, and delivery in one continuous practice.</p>
        </div>

        <a className="agency-site-window" href="https://www.agency689.com/" target="_blank" rel="noreferrer">
          <Image src="/brand/agency689-site-frame.jpeg" alt="Still from the Agency689 generative AI introduction film" fill sizes="(max-width: 760px) 100vw, 80vw" />
          <span>Visit agency689.com <ArrowUpRight size={19} /></span>
        </a>

        <div className="agency-story-copy">
          <span className="brand-label">Founder, strategist, writer, builder</span>
          <h3>THE PERSON WHO DEFINES THE IDEA STAYS RESPONSIBLE FOR THE RESULT.</h3>
          <p>
            I co-founded Agency689 in 2001. I have brought in the clients, written the proposals, led discovery, shaped the strategy, written the work, directed creative and engineering teams, managed budgets, and stayed close through launch.
          </p>
          <p>
            I built and wrote the current site, then created the generative AI film that opens it. The site is proof that brand judgment, narrative, design, technology, and production can live in the same hands.
          </p>
          <button className="brand-voice-button" onClick={() => speaking === "agency" ? stopNarration() : void narrate("agency", agencyStory)} type="button">
            {speaking === "agency" ? <Square size={16} /> : <Volume2 size={17} />}
            {speaking === "agency" ? "Stop ACE" : voiceEnabled ? "Hear ACE tell the story" : "Play the Agency689 story"}
          </button>
        </div>
      </section>

      <section className="brand-figueroa-feature">
        <div className="brand-section-head split">
          <div>
            <p className="kicker">Hotel Figueroa</p>
            <h2>TO RELATE TO ARTISTS, WE MUST BE ARTISTS.</h2>
          </div>
          <p>One sentence became the decision rule for a sixty-one-page identity and editorial system built to relaunch a 1925 Los Angeles icon.</p>
        </div>

        <div className="figueroa-gallery">
          <button className="lead brand-book-cover" onClick={() => setBookPage(0)} type="button">
            <Image src={figueroaBookPages[0]} alt="Hotel Figueroa 61-page brand guidelines cover" fill sizes="(max-width: 760px) 100vw, 58vw" />
            <span>Open all 61 pages <ArrowUpRight size={16} /></span>
          </button>
          {figueroaImages.map((item, index) => (
            <button key={item.src} onClick={() => setLightbox(index)} type="button">
              <Image src={item.src} alt={item.alt} fill sizes="(max-width: 760px) 100vw, 29vw" />
              <span>{item.caption} <ArrowUpRight size={16} /></span>
            </button>
          ))}
        </div>

        <div className="figueroa-system">
          <div>
            <span className="brand-label">The assignment</span>
            <p>A historic hotel was reopening into a crowded luxury market. It needed to honor its past while giving a modern creative audience a reason to claim it.</p>
          </div>
          <div>
            <span className="brand-label">The system</span>
            <p>Mission, promise, vision, six pillars, identity variants, typography, imagery direction, editorial voice, collateral, and launch governance.</p>
          </div>
          <div>
            <span className="brand-label">The outcome</span>
            <p>A complete brand world held together by one useful sentence, not a collection of disconnected design choices.</p>
          </div>
        </div>

        <button className="brand-voice-button" onClick={() => speaking === "figueroa" ? stopNarration() : void narrate("figueroa", figueroaStory)} type="button">
          {speaking === "figueroa" ? <Square size={16} /> : <Play size={17} />}
          {speaking === "figueroa" ? "Stop ACE" : "Hear the Figueroa presentation"}
        </button>
      </section>

      <section className="brand-range-section">
        <div className="brand-section-head split">
          <div>
            <p className="kicker">Brand systems in the wild</p>
            <h2>ONE IDEA. EVERYWHERE IT HAS TO WORK.</h2>
          </div>
          <p>The proof is range without drift: different categories, different audiences, and a clear governing idea carried into the work people actually see and use.</p>
        </div>
        <div className="brand-range-grid">
          {brandRange.map((item) => (
            <article key={item.client}>
              <Image src={item.image} alt="" fill sizes="(max-width: 760px) 100vw, 40vw" />
              <div className="brand-range-shade" />
              <div className="brand-range-copy">
                <span>{item.kind}</span>
                <p>{item.client}</p>
                <h3>{item.line}</h3>
                <small>{item.proof}</small>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BrandClientWall />

      {lightbox !== null && createPortal(
        <div className="brand-lightbox" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setLightbox(null)}>
          <figure ref={lightboxDialogRef} role="dialog" aria-modal="true" aria-label="Hotel Figueroa brand gallery" tabIndex={-1}>
            <button onClick={() => setLightbox(null)} type="button" aria-label="Close Hotel Figueroa image"><X size={24} /></button>
            <div><Image src={figueroaImages[lightbox].src} alt={figueroaImages[lightbox].alt} fill sizes="95vw" /></div>
            <figcaption><span>Hotel Figueroa</span><strong>{figueroaImages[lightbox].caption}</strong></figcaption>
          </figure>
        </div>,
        document.body,
      )}

      {bookPage !== null && createPortal(
        <div className="brand-book-reader" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setBookPage(null)}>
          <section className="brand-book-shell" ref={bookDialogRef} role="dialog" aria-modal="true" aria-label="Complete Hotel Figueroa brand book" tabIndex={-1}>
            <header>
              <div>
                <span>Hotel Figueroa</span>
                <strong>Complete brand book</strong>
              </div>
              <p aria-live="polite">Page {bookPage + 1} of {figueroaBookPages.length}</p>
              <button className="brand-book-close" onClick={() => setBookPage(null)} type="button" aria-label="Close Hotel Figueroa brand book"><X size={24} /></button>
            </header>
            <div className="brand-book-stage">
              <button className="brand-book-prev" onClick={() => setBookPage(Math.max(0, bookPage - 1))} disabled={bookPage === 0} type="button" aria-label="Previous brand book page"><ChevronLeft size={34} /></button>
              <div className="brand-book-page">
                <Image
                  key={figueroaBookPages[bookPage]}
                  src={figueroaBookPages[bookPage]}
                  alt={`Hotel Figueroa brand book page ${bookPage + 1} of ${figueroaBookPages.length}`}
                  fill
                  quality={90}
                  sizes="(max-width: 980px) 100vw, 78vw"
                />
              </div>
              <button className="brand-book-next" onClick={() => setBookPage(Math.min(figueroaBookPages.length - 1, bookPage + 1))} disabled={bookPage === figueroaBookPages.length - 1} type="button" aria-label="Next brand book page"><ChevronRight size={34} /></button>
            </div>
            <footer>
              <span>Use the arrows or your keyboard to move through the complete 61-page system.</span>
              <strong>{bookPage === 0 ? "Cover" : bookPage === figueroaBookPages.length - 1 ? "Back cover" : `Page ${bookPage + 1}`}</strong>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
