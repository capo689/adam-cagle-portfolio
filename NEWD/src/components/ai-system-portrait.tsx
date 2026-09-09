import Image from "next/image";
import type { AiWorkItem } from "@/content/ai-content";

type PortraitMode = "pipeline" | "route" | "core" | "matrix" | "audience" | "transform";

type PortraitConfig = {
  mode: PortraitMode;
  stages: string[];
  signal: string;
};

const portraits: Record<string, PortraitConfig> = {
  "conversion-forge": { mode: "pipeline", stages: ["RESEARCH", "DIRECTIONS", "POLICY GATES", "LIVE TEST"], signal: "WINNING STRATEGY RETURNS TO THE BRAND" },
  "synthetic-audience-lab": { mode: "audience", stages: ["EVIDENCE", "PERSONAS", "PANELS", "CONFIDENCE"], signal: "INDEPENDENT MODEL FAMILIES / HUMAN INTERPRETATION" },
  crit: { mode: "matrix", stages: ["CLAIMS", "VOICE", "CRAFT", "ACCESS", "RIGHTS"], signal: "REPAIR ONLY WHAT FAILS" },
  canon: { mode: "core", stages: ["SOURCES", "CLAIMS", "RULES", "RECEIPTS"], signal: "SIGNED / VERSIONED / MARKET AWARE" },
  backlot: { mode: "pipeline", stages: ["BRIEF", "ASSET BIBLE", "MASTERS", "RIGHTS"], signal: "CONTINUITY SURVIVES EVERY CHANNEL" },
  "proving-ground": { mode: "pipeline", stages: ["GOLDEN SET", "CANDIDATE", "JUDGES", "RELEASE"], signal: "BASELINE HELD / FAILURE REPRODUCIBLE" },
  "field-kit": { mode: "pipeline", stages: ["DISCOVERY", "PROCESS MAP", "PROTOTYPE", "PILOT"], signal: "REAL ARTIFACTS / CITED OPPORTUNITY" },
  switchboard: { mode: "route", stages: ["TASK", "POLICY", "MODEL", "RECEIPT"], signal: "QUALITY / LATENCY / COST ATTRIBUTED" },
  "reading-room": { mode: "pipeline", stages: ["ENTITLE", "RETRIEVE", "VERIFY", "ANSWER"], signal: "CURRENT SOURCES / SENTENCE LEVEL PROOF" },
  "answer-field": { mode: "route", stages: ["QUESTIONS", "ENGINES", "SOURCES", "GAPS"], signal: "RECOMMENDATION RATE / PUBLISHER INFLUENCE" },
  "legacy-content-migrator": { mode: "transform", stages: ["LEGACY", "EXTRACT", "VERIFY", "DESTINATIONS"], signal: "EVIDENCE MOVES / HUMAN AUTHORITY STAYS" },
};

function PipelineDiagram({ config }: { config: PortraitConfig }) {
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(" to ")}. ${config.signal}`}>
      <g className="portrait-links">
        <path d="M166 214H246M358 214H438M550 214H630" />
      </g>
      {config.stages.slice(0, 4).map((stage, index) => {
        const x = 54 + index * 192;
        return (
          <g key={stage}>
            <rect className={index === 3 ? "portrait-node accent" : "portrait-node"} x={x} y="150" width="112" height="128" rx="2" />
            <text className="portrait-node-text" textAnchor="middle" x={x + 56} y="215">{stage}</text>
            <circle className="portrait-port" cx={x + 56} cy="255" r="4" />
          </g>
        );
      })}
      <text className="portrait-signal" textAnchor="middle" x="400" y="344">{config.signal}</text>
    </svg>
  );
}

function RouteDiagram({ config }: { config: PortraitConfig }) {
  const models = ["FAST", "DEEP", "PRIVATE", "VISION"];
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(" routed through ")}. ${config.signal}`}>
      <path className="portrait-link" d="M175 225H302M498 225H560M498 225L560 117M498 225L560 333" />
      <rect className="portrait-node" x="55" y="166" width="120" height="118" rx="2" />
      <text className="portrait-node-text" textAnchor="middle" x="115" y="232">{config.stages[0]}</text>
      <circle className="portrait-router-ring" cx="400" cy="225" r="96" />
      <circle className="portrait-router" cx="400" cy="225" r="68" />
      <text className="portrait-step" textAnchor="middle" x="400" y="201">POLICY</text>
      <text className="portrait-node-text" textAnchor="middle" x="400" y="232">ROUTER</text>
      <text className="portrait-minor" textAnchor="middle" x="400" y="254">VALIDATE + TRACE</text>
      {models.map((model, index) => {
        const y = 78 + index * 92;
        return (
          <g key={model}>
            <rect className={index === 1 ? "portrait-node accent" : "portrait-node"} x="560" y={y} width="176" height="62" rx="2" />
            <text className="portrait-node-text" x="580" y={y + 37}>{model}</text>
            <circle className="portrait-port" cx="711" cy={y + 31} r="5" />
          </g>
        );
      })}
      <text className="portrait-signal" x="55" y="382">{config.signal}</text>
    </svg>
  );
}

function CoreDiagram({ config }: { config: PortraitConfig }) {
  const positions = [[165, 115], [635, 115], [165, 330], [635, 330]];
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(" governed by a shared core ")}. ${config.signal}`}>
      {positions.map(([x, y], index) => (
        <g key={config.stages[index]}>
          <path className="portrait-link" d={`M${x} ${y}L400 225`} />
          <circle className="portrait-source" cx={x} cy={y} r="43" />
          <text className="portrait-node-text" textAnchor="middle" x={x} y={y + 4}>{config.stages[index]}</text>
        </g>
      ))}
      <circle className="portrait-router-ring" cx="400" cy="225" r="112" />
      <circle className="portrait-router-ring inner" cx="400" cy="225" r="82" />
      <circle className="portrait-router" cx="400" cy="225" r="54" />
      <text className="portrait-step" textAnchor="middle" x="400" y="215">GOVERNED</text>
      <text className="portrait-node-text" textAnchor="middle" x="400" y="239">CORE</text>
      <text className="portrait-signal" textAnchor="middle" x="400" y="414">{config.signal}</text>
    </svg>
  );
}

function MatrixDiagram({ config }: { config: PortraitConfig }) {
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(", ")} evaluation matrix. ${config.signal}`}>
      <text className="portrait-step" x="68" y="78">COMPONENT REVIEW / GOVERNED CHECKS</text>
      {config.stages.map((stage, row) => (
        <g key={stage}>
          <text className="portrait-node-text" x="72" y={132 + row * 49}>{stage}</text>
          {[0, 1, 2, 3, 4, 5].map((column) => (
            <rect className={column <= 3 + (row % 2) ? "portrait-matrix-cell active" : "portrait-matrix-cell"} key={column} x={270 + column * 72} y={108 + row * 49} width="54" height="28" rx="1" />
          ))}
        </g>
      ))}
      <path className="portrait-matrix-gate" d="M682 104V354" />
      <text className="portrait-signal" x="68" y="397">{config.signal}</text>
    </svg>
  );
}

function AudienceDiagram({ config }: { config: PortraitConfig }) {
  const people = [[110, 130], [200, 95], [190, 220], [105, 285], [285, 155], [290, 286]];
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(" to ")}. ${config.signal}`}>
      {people.map(([x, y], index) => (
        <g key={index}>
          <path className="portrait-link" d={`M${x} ${y}L435 222`} />
          <circle className="portrait-person" cx={x} cy={y} r={index % 2 ? 25 : 32} />
          <circle className="portrait-port" cx={x} cy={y} r="5" />
        </g>
      ))}
      <rect className="portrait-node accent" x="435" y="132" width="286" height="180" rx="2" />
      <text className="portrait-step" x="460" y="165">SYNTHETIC PANEL</text>
      <text className="portrait-node-text large" x="460" y="211">HYPOTHESIS</text>
      <text className="portrait-node-text large" x="460" y="240">WITH RANGE</text>
      <path className="portrait-confidence" d="M461 278H687M497 268V288M650 268V288" />
      <text className="portrait-signal" textAnchor="middle" x="400" y="397">{config.signal}</text>
    </svg>
  );
}

function TransformDiagram({ config }: { config: PortraitConfig }) {
  return (
    <svg className="portrait-diagram" viewBox="0 0 800 450" role="img" aria-label={`${config.stages.join(" to ")}. ${config.signal}`}>
      {[0, 1, 2].map((index) => <rect className="portrait-document" key={index} x={67 + index * 14} y={128 + index * 17} width="132" height="168" rx="2" />)}
      <text className="portrait-step" x="93" y="332">MIXED LEGACY</text>
      <path className="portrait-link" d="M234 224H324M476 224H568" />
      <rect className="portrait-node accent" x="324" y="133" width="152" height="182" rx="2" />
      <text className="portrait-step" textAnchor="middle" x="400" y="174">EXTRACT</text>
      <text className="portrait-node-text" textAnchor="middle" x="400" y="216">MATCH</text>
      <text className="portrait-node-text" textAnchor="middle" x="400" y="243">VERIFY</text>
      <text className="portrait-minor" textAnchor="middle" x="400" y="281">HUMAN GATE</text>
      {[0, 1, 2, 3].map((index) => <rect className="portrait-destination" key={index} x={568 + (index % 2) * 88} y={142 + Math.floor(index / 2) * 91} width="72" height="72" rx="2" />)}
      <text className="portrait-step" x="568" y="332">STRUCTURED DESTINATIONS</text>
      <text className="portrait-signal" textAnchor="middle" x="400" y="397">{config.signal}</text>
    </svg>
  );
}

function WorkflowPortrait({ config }: { config: PortraitConfig }) {
  if (config.mode === "route") return <RouteDiagram config={config} />;
  if (config.mode === "core") return <CoreDiagram config={config} />;
  if (config.mode === "matrix") return <MatrixDiagram config={config} />;
  if (config.mode === "audience") return <AudienceDiagram config={config} />;
  if (config.mode === "transform") return <TransformDiagram config={config} />;
  return <PipelineDiagram config={config} />;
}

export function AiSystemPortrait({ item }: { item: AiWorkItem }) {
  if (item.id === "singularity-seo") {
    return (
      <div className="ai-system-portrait singularity-portrait">
        <Image src="/ai/singularity-dashboard.jpg" alt="Singularity WPSEO dashboard showing technical health, managed pages, visibility, rankings, workflow status, and AI recommendations" fill sizes="(max-width: 760px) 100vw, 50vw" priority />
        <div className="portrait-proof-label"><span>REAL INTERFACE</span><strong>PRODUCTION CONTROL ROOM</strong></div>
      </div>
    );
  }

  const config = portraits[item.id];
  if (!config) return null;

  return (
    <div className="ai-system-portrait workflow-portrait" data-portrait={config.mode}>
      <div className="portrait-topline"><span>SYSTEM PORTRAIT</span><span>{item.title}</span></div>
      <WorkflowPortrait config={config} />
    </div>
  );
}
