"use client";

import { useEffect } from "react";
import { ExternalLink, Mail, Printer, X } from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";
import { ElectricShimmerTitle } from "@/components/electric-shimmer-title";

type ProfileModalProps = {
  open: "resume" | null;
  onClose: () => void;
};

const skillGroups = [
  {
    title: "AI systems",
    copy: "Applied AI architecture, agent workflows, RAG, MCP and FastMCP, multi-model routing, structured outputs, deterministic validation, evaluation loops, evidence traceability, cost controls, and human approval systems.",
  },
  {
    title: "Brand and copy",
    copy: "Positioning, naming, messaging, brand voice, campaign concepts, editorial systems, websites, video, email, ecommerce, packaging, presentations, and performance creative.",
  },
  {
    title: "Leadership and growth",
    copy: "New business, pitch strategy, proposals, C-suite discovery, account leadership, team building, staffing, scopes, budgets, schedules, change management, training, and launch governance.",
  },
  {
    title: "Product and delivery",
    copy: "Product definition, UX and UI, technical communication, APIs, OAuth, React, TypeScript, JavaScript, Python, FastAPI, Node.js, WordPress, PostgreSQL, Supabase, Vercel, Cloudflare, GitHub, and analytics.",
  },
];

const anthropicCourses = [
  "Claude 101",
  "Claude Code 101",
  "Claude Platform 101",
  "Introduction to Claude Cowork",
  "Claude Code in Action",
  "AI Fluency: Framework & Foundations",
  "Claude with the Anthropic API",
  "AI Fluency for Builders",
  "Introduction to Model Context Protocol",
  "Model Context Protocol: Advanced Topics",
];

const toolkitGroups = [
  {
    title: "Frontier models",
    skills: ["Claude Opus", "Claude Sonnet", "Claude Haiku", "GPT-5.5", "Gemini 3.1 Pro", "Grok", "DeepSeek", "Llama"],
  },
  {
    title: "Languages",
    skills: ["JavaScript", "TypeScript", "Python 3", "PHP", "Node.js", "Bash", "HTML5", "CSS3", "Markdown", "JSON / JSONL", "SQL"],
  },
  {
    title: "Frameworks and runtimes",
    skills: ["React", "Astro", "WordPress", "FastAPI / Starlette", "Vanilla JS", "Three.js", "WebGL", "OpenGL", "Chart.js", "Tailwind CSS"],
  },
  {
    title: "AI and agent frameworks",
    skills: ["Claude Agent SDK", "LangGraph", "OpenRouter", "Vercel AI SDK", "OpenAI Agents SDK", "CrewAI", "MCP / FastMCP", "Custom GPTs", "ChatGPT Apps", "Ollama", "LoRA"],
  },
  {
    title: "Orchestration and evaluation",
    skills: ["Multi-model orchestration", "Task-based model routing", "Model selection", "LLM benchmarking", "Structured outputs", "JSON Schema", "Deterministic validation"],
  },
  {
    title: "Testing, reliability, and audit",
    skills: ["Synthetic testing", "Fixture testing", "Live API testing", "Independent verification", "Fail-closed workflows", "Bounded retries", "Model-diverse repair", "Evidence traceability", "Stable evidence IDs", "SHA-256 provenance", "Workflow auditing"],
  },
  {
    title: "AI operations and rollout",
    skills: ["AI cost tracking", "Risk assessment", "Production-readiness planning", "Opportunity prioritization", "Shadow-mode pilots", "Production-rollout planning"],
  },
  {
    title: "RAG and retrieval",
    skills: ["Qdrant", "Pinecone", "Cohere Rerank", "RAGAS", "LlamaIndex", "Embeddings", "Semantic retrieval", "OCR", "Multimodal extraction"],
  },
  {
    title: "Workflow visualization",
    skills: ["React Flow", "XYFlow", "ELK.js"],
  },
  {
    title: "Databases and data",
    skills: ["Supabase", "PostgreSQL", "SQLite", "Finnhub", "EDGAR", "Rainforest API"],
  },
  {
    title: "Backend, hosting, and deployment",
    skills: ["Render", "Cloudflare Pages", "Cloudflare Workers", "Wrangler CLI", "Vercel", "OpenCLAW", "Resend", "Tailscale", "ngrok", "launchd", "SSE"],
  },
  {
    title: "Authentication and security",
    skills: ["Auth0", "OAuth 2.0", "OAuth 1.0a", "Scoped access tokens"],
  },
  {
    title: "Payments and commerce",
    skills: ["Stripe", "Stripe Checkout", "Stripe Customer Portal"],
  },
  {
    title: "Development, automation, and governance",
    skills: ["GitHub", "GitHub Actions", "Codex", "Zapier", "n8n Cloud", "Anthropic eval tooling", "SKILL.md governance", "Persona MD governance"],
  },
  {
    title: "SEO and discovery",
    skills: ["Singularity SEO", "SEMrush", "SerpApi", "Google Search Console", "GA4", "Schema / JSON-LD", "llms.txt"],
  },
  {
    title: "Design and production",
    skills: ["Adobe Creative Suite", "Figma", "Canva", "Photoshop"],
  },
  {
    title: "Image generation",
    skills: ["Midjourney", "Flux 2", "GPT-Image-2", "Adobe Firefly 3", "Nano Banana", "Google image generation suite"],
  },
  {
    title: "Video generation",
    skills: ["Runway Gen-4.5", "Veo 3.1", "Kling", "Seedance 2.5"],
  },
  {
    title: "Voice, music, and sound",
    skills: ["Fish Audio S2.1 Pro", "Groq Whisper Large v3 Turbo", "Web Audio API", "Streaming PCM audio", "ElevenLabs", "OpenAI Realtime API", "Suno", "ElevenLabs SFX"],
  },
  {
    title: "Collaboration and business systems",
    skills: ["Slack", "Salesforce", "HubSpot", "Notion", "Telegram", "Microsoft Office Suite", "Google Workspace"],
  },
];

function ModalShell({ children, label, onClose }: { children: React.ReactNode; label: string; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div className="profile-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section aria-label={label} aria-modal="true" className="profile-modal" role="dialog">
        <button aria-label={`Close ${label}`} className="profile-modal-close" onClick={onClose} type="button">
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}

function ResumeModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell label="Adam Cagle resume" onClose={onClose}>
      <div className="profile-hero resume-hero">
        <p className="profile-marker">Résumé · Adam R. Cagle</p>
        <ElectricShimmerTitle lines={["IDEAS.", "SYSTEMS.", "RESULTS."]} />
        <p className="profile-role">AI Systems Builder · Agency Founder · Brand and Copy Leader</p>
        <p className="profile-summary">
          Adam Cagle is the rare leader who can find the idea, write the story, build the system, and run the team that ships it. For 25 years at Agency689, he has turned complicated products and ambitious companies into brands people understand and choose. Today, that same practice includes production AI: working products, governed workflows, model orchestration, retrieval, evaluation, and human approval systems.
        </p>
        <div className="profile-actions">
          <a href="mailto:adamrcagle@gmail.com"><Mail size={16} /> Email Adam</a>
          <a href="https://www.linkedin.com/in/adamcagle/" rel="noreferrer" target="_blank"><FaLinkedinIn size={15} /> LinkedIn</a>
          <a href="https://github.com/capo689" rel="noreferrer" target="_blank"><FaGithub size={15} /> GitHub</a>
          <button onClick={() => window.print()} type="button"><Printer size={16} /> Print or save PDF</button>
        </div>
      </div>

      <div className="resume-proof-strip" aria-label="Career highlights">
        <div><strong>25 years</strong><span>Building and leading Agency689</span></div>
        <div><strong>60+ accounts</strong><span>Won, led, and retained</span></div>
        <div><strong>Teams to 15</strong><span>Creative, technical, and client delivery</span></div>
        <div><strong>Shipped AI</strong><span>Production systems, not concept decks</span></div>
      </div>

      <section className="resume-section">
        <div className="resume-section-head">
          <p>Experience</p>
          <h2>The work behind the range.</h2>
        </div>

        <article className="resume-role featured">
          <div className="resume-role-head">
            <div>
              <p>2001 to present · Bend, Oregon and California</p>
              <h3>Agency689, Inc.</h3>
            </div>
            <strong>Co-Founder, Managing Director, Lead Copywriter & AI Systems Builder</strong>
          </div>
          <p className="resume-role-intro">
            Built and led an independent brand, launch, and intelligent-systems practice spanning strategy, creative, technology, new business, operations, and delivery. Owned the full arc from founder and C-suite discovery through positioning, production, launch, measurement, and long-term growth.
          </p>
          <div className="resume-impact-grid">
            <div>
              <span>Agency leadership</span>
              <p>Won and led more than 60 accounts, built teams of up to 15, and ran pitch strategy, proposals, scopes, staffing, schedules, budgets, quality standards, and senior client relationships.</p>
            </div>
            <div>
              <span>Brand and creative</span>
              <p>Led naming, positioning, voice, campaigns, web, video, email, packaging, and performance creative for clients including Xbox, AMD, Microsoft, Killer Network, Traveler Guitar, Hotel Figueroa, and Sunset Marquis.</p>
            </div>
            <div>
              <span>Measured growth</span>
              <p>Helped grow Traveler Guitar direct-to-consumer revenue from roughly $1.1 million to $5 million. Improved banner return on ad spend by 30 percent. Built a Sunset Marquis email program that produces roughly $150,000 in attributed revenue per send.</p>
            </div>
            <div>
              <span>Enduring relationships</span>
              <p>Made the work good enough, and the operation dependable enough, to hold clients for years. Agency689 has served as Sunset Marquis Agency of Record since 2004.</p>
            </div>
          </div>

          <div className="resume-ai-practice">
            <p>Applied AI inside Agency689</p>
            <h4>Twenty-five years of creative judgment, rebuilt as intelligent infrastructure.</h4>
            <div>
              <p>Integrated generative AI into client production in 2022, preserving brand context, editorial standards, evidence, and human approval while reducing repetitive work.</p>
              <p>Built Singularity SEO, an AI-managed search platform in production, plus Agency689 Writing Systems and a suite of governed workflows for research, strategy, creative development, content migration, conversion, evaluation, and knowledge management.</p>
              <p>Works hands-on across product definition, architecture, interfaces, prompts, personas, APIs, model routing, retrieval, testing, documentation, deployment, and iteration.</p>
            </div>
          </div>
        </article>

        <article className="resume-role">
          <div className="resume-role-head">
            <div>
              <p>1998 to 2001 · Orange County, California</p>
              <h3>DGWB Advertising</h3>
            </div>
            <strong>Director of Interactive & Lead Copywriter</strong>
          </div>
          <p className="resume-role-intro">Built and led DGWB&apos;s interactive practice as client websites were becoming connected business tools. Directed digital strategy, copy, experience, development, and delivery across financial services, technology, manufacturing, restaurants, and ecommerce, while helping the agency win and expand major accounts.</p>
          <div className="resume-impact-grid">
            <div>
              <span>Digital product leadership</span>
              <p>Created an internal content management system in ASP for client sites, giving client teams a practical way to update content without waiting on developers. Led information architecture, front-end production, content, and launch.</p>
            </div>
            <div>
              <span>Award-winning digital copy</span>
              <p>Wrote award-winning digital work for LoanWorks, Toshiba, Avery Dennison, and Wienerschnitzel, bringing the same strategic and creative standards expected in traditional advertising to emerging interactive channels.</p>
            </div>
            <div>
              <span>Client portfolio</span>
              <p>Work included IndyMac Bank, LoanWorks, CreditCards.com, Toshiba, Yamaha Music, Avery Dennison, Clarion, and Wienerschnitzel.</p>
            </div>
            <div>
              <span>New-business advantage</span>
              <p>Turned interactive capability into a reason to hire the agency, bringing digital strategy, prototypes, technical direction, copy, scopes, and implementation thinking into pitches and integrated campaigns.</p>
            </div>
          </div>
        </article>

        <article className="resume-role">
          <div className="resume-role-head">
            <div>
              <p>Early career · Los Angeles, California</p>
              <h3>Firstsource</h3>
            </div>
            <strong>Lead Project Programmer & Content Architect</strong>
          </div>
          <p className="resume-role-intro">Helped turn a catalog business into an ecommerce company in about a year. Built the shopping experience in HTML and ASP, pioneered real-time product availability and pricing across hardware distributors, and tested some of the earliest live-chat systems inside an online retail experience. Later helped select the advertising agency for the company&apos;s IPO preparation.</p>
        </article>

        <article className="resume-role compact">
          <div className="resume-role-head">
            <div>
              <p>Earlier career · California and Texas</p>
              <h3>Newspaper Art Direction</h3>
            </div>
            <strong>San Francisco Independent · Corpus Christi Caller-Times</strong>
          </div>
          <p className="resume-role-intro">Worked as an art director managing the design, placement, and production of camera-ready advertising under unforgiving newspaper deadlines. Coordinated the work from advertiser requirements through final mechanicals, building the visual judgment, production discipline, and respect for deadlines that still shape the work today.</p>
        </article>
      </section>

      <section className="resume-section">
        <div className="resume-section-head">
          <p>Capabilities</p>
          <h2>Creative range. Technical depth. Operator discipline.</h2>
        </div>
        <div className="resume-skill-grid">
          {skillGroups.map((skill) => (
            <article key={skill.title}>
              <h3>{skill.title}</h3>
              <p>{skill.copy}</p>
            </article>
          ))}
        </div>

        <div className="resume-toolkit-head">
          <p>Complete toolkit</p>
          <h3>Every platform, language, framework, and production skill.</h3>
        </div>
        <div className="resume-toolkit-grid">
          {toolkitGroups.map((group) => (
            <article key={group.title}>
              <h4>{group.title}</h4>
              <ul>
                {group.skills.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="resume-section credentials-section">
        <div className="resume-section-head">
          <p>Credentials</p>
          <h2>Still learning. Still shipping.</h2>
        </div>
        <div className="credential-grid">
          <a className="credential-card google" href="https://www.credential.net/1fcfe580-d22c-41c2-9a6a-31044944fc19" rel="noreferrer" target="_blank">
            <span>Google · Valid August 2026 to August 2027</span>
            <h3>Google Analytics Certification</h3>
            <p>GA4 measurement, reporting, conversion tracking, attribution, and search performance analysis.</p>
            <ExternalLink size={18} />
          </a>
          <div className="credential-card anthropic">
            <span>Anthropic and CodePath · Completed July and August 2026</span>
            <h3>Claude and Applied AI Learning Path</h3>
            <p>Ten completed courses:</p>
            <ul>
              {anthropicCourses.map((course) => <li key={course}>{course}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="resume-final-grid">
        <div><p>Recognition</p><h3>Ad Club and Webby awards</h3><span>Multiple awards for copywriting, plus a Netty Award for the Sunset Marquis website.</span></div>
        <div><p>Education</p><h3>Academy of Art, San Francisco</h3><span>Design and Art Direction.</span></div>
        <div><p>Board</p><h3>Autism Research Project</h3><span>Board member. Published author and white-paper writer on shipped AI systems.</span></div>
      </section>
    </ModalShell>
  );
}

export function ProfileModals({ open, onClose }: ProfileModalProps) {
  if (open === "resume") return <ResumeModal onClose={onClose} />;
  return null;
}
