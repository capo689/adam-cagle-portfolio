"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { AiWorkItem } from "@/content/ai-content";
import { showAceNarration } from "@/lib/ace-transcript";

type WorkflowStep = {
  id: string;
  narration: string;
  audioUrl?: string;
  kind?: string;
  finalNode?: string;
};

type WorkflowWindow = Window & {
  WORKFLOW_CONFIG?: {
    route?: string[];
    nodes?: Array<{id?: string; narration?: string; kind?: string}>;
  };
  WORKFLOW_NARRATION?: {
    segments?: Array<{id?: string; src?: string}>;
  };
  CIVIC_NARRATION?: {
    scenarios?: Record<string, {segments?: Array<{id?: string; startNode?: string; endNode?: string; text?: string}>}>;
  };
};

type Props = {
  item: AiWorkItem;
  voiceEnabled: boolean;
  onClose: () => void;
};

const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function expressionFor(kind?: string) {
  if (kind === "human") return {name: "warm", intensity: .68};
  if (kind === "gate") return {name: "skeptical", intensity: .58};
  if (kind === "model") return {name: "curious", intensity: .62};
  if (kind === "output") return {name: "proud", intensity: .72};
  return {name: "attentive", intensity: .52};
}

export function GuidedWorkflowViewer({item, voiceEnabled, onClose}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const runRef = useRef(0);
  const replayCleanup = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [progress, setProgress] = useState("Opening workflow");
  const [error, setError] = useState("");

  const frame = useCallback(() => {
    const element = iframeRef.current;
    const contentWindow = element?.contentWindow as WorkflowWindow | null;
    const document = element?.contentDocument;
    return contentWindow && document ? {contentWindow, document} : null;
  }, []);

  const stopRun = useCallback(() => {
    runRef.current += 1;
    window.FACETEST?.stop();
    setRunning(false);
  }, []);

  const showCompletion = useCallback((document: Document) => {
    const completion = document.querySelector<HTMLElement>("#completion");
    if (!completion) return;
    completion.classList.add("show");
    completion.setAttribute("aria-hidden", "false");

    const actions = completion.querySelector<HTMLElement>(".completion-actions");
    if (!actions || document.querySelector("#completion-close") || actions.querySelector("[data-newd-inspect]")) return;
    const inspect = document.createElement("button");
    inspect.type = "button";
    inspect.className = "secondary";
    inspect.dataset.newdInspect = "true";
    inspect.textContent = "Inspect completed graph";
    inspect.addEventListener("click", () => {
      completion.classList.remove("show");
      completion.setAttribute("aria-hidden", "true");
    });
    actions.appendChild(inspect);
  }, []);

  const moveMigrationTo = useCallback((document: Document, target: string) => {
    const next = document.querySelector<HTMLButtonElement>("#next");
    const current = () => document.querySelector<HTMLElement>("#stepname")?.textContent?.trim();
    let safety = 60;
    while (next && current() !== target && safety-- > 0) next.click();
  }, []);

  const runWorkflow = useCallback(async () => {
    const currentFrame = frame();
    if (!currentFrame) return;
    const {contentWindow, document} = currentFrame;
    const run = ++runRef.current;
    const isMigration = item.id === "legacy-content-migrator";

    setComplete(false);
    setRunning(true);
    setError("");
    document.querySelector<HTMLElement>("#completion")?.classList.remove("show");
    document.querySelector<HTMLElement>("#completion")?.setAttribute("aria-hidden", "true");

    let steps: WorkflowStep[] = [];
    if (isMigration) {
      document.querySelector<HTMLButtonElement>('[data-scenario="standard"]')?.click();
      if (document.querySelector<HTMLButtonElement>("#play")?.getAttribute("aria-label") === "Pause") {
        document.querySelector<HTMLButtonElement>("#play")?.click();
      }
      const mute = document.querySelector<HTMLButtonElement>("#mute");
      if (mute?.getAttribute("aria-pressed") !== "true") mute?.click();
      steps = (contentWindow.CIVIC_NARRATION?.scenarios?.standard?.segments || []).map((segment, index) => ({
        id: segment.startNode || `Step ${index + 1}`,
        narration: segment.text || "",
        audioUrl: segment.id ? `/migration_new/narration/audio/standard/${segment.id}.mp3` : undefined,
        finalNode: segment.endNode,
      }));
    } else {
      const begin = document.querySelector<HTMLButtonElement>("#begin");
      begin?.click();
      const play = document.querySelector<HTMLButtonElement>("#play");
      if (play?.getAttribute("aria-label") === "Pause") play.click();
      const config = contentWindow.WORKFLOW_CONFIG;
      const byId = new Map((config?.nodes || []).map((node) => [node.id, node]));
      const audioById = new Map((contentWindow.WORKFLOW_NARRATION?.segments || []).map((segment) => [segment.id, segment.src]));
      steps = (config?.route || []).map((id) => {
        const node = byId.get(id);
        return {id, narration: node?.narration || "", kind: node?.kind, audioUrl: audioById.get(id)};
      });
    }

    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
      media.muted = true;
      media.pause();
    });

    if (!steps.length) {
      setError("The workflow opened, but its guided steps were not available.");
      setRunning(false);
      return;
    }

    for (let index = 0; index < steps.length; index += 1) {
      if (run !== runRef.current) return;
      const step = steps[index];
      if (isMigration) moveMigrationTo(document, step.id);
      else if (index > 0) document.querySelector<HTMLButtonElement>("#next")?.click();
      setProgress(`ACE guiding ${index + 1} of ${steps.length}`);

      if (voiceEnabled && step.audioUrl) {
        const cue = expressionFor(step.kind);
        window.FACE?.perform(cue.name, cue.intensity, Math.min(10, 4 + step.narration.length / 38));
        showAceNarration(`${item.title} · ${index + 1} of ${steps.length}`, step.narration);
        await window.FACETEST?.playAudio(step.audioUrl, cue);
      } else {
        await pause(900);
      }
    }

    if (run !== runRef.current) return;
    if (isMigration && steps.at(-1)?.finalNode) moveMigrationTo(document, steps.at(-1)!.finalNode!);
    showCompletion(document);
    setProgress("Guided run complete");
    setRunning(false);
    setComplete(true);
  }, [frame, item.id, item.title, moveMigrationTo, showCompletion, voiceEnabled]);

  const prepareFrame = useCallback(() => {
    const currentFrame = frame();
    if (!currentFrame) {
      setError("The workflow could not be loaded inside the site.");
      return;
    }
    const {document} = currentFrame;
    document.documentElement.classList.add("newd-embedded");
    document.querySelectorAll<HTMLMediaElement>("audio, video").forEach((media) => {
      media.muted = true;
      media.pause();
    });

    if (!document.querySelector("#newd-embedded-style")) {
      const style = document.createElement("style");
      style.id = "newd-embedded-style";
      style.textContent = `
        .newd-embedded .launcher { display: none !important; }
        .newd-embedded body { overscroll-behavior: none; }
        .newd-embedded .completion { backdrop-filter: blur(12px); }
        .newd-embedded .completion-actions .secondary { background: transparent; }
      `;
      document.head.appendChild(style);
    }

    replayCleanup.current?.();
    const replay = document.querySelector<HTMLButtonElement>("#completion-replay");
    const interceptReplay = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void runWorkflow();
    };
    replay?.addEventListener("click", interceptReplay, true);
    replayCleanup.current = () => replay?.removeEventListener("click", interceptReplay, true);

    setReady(true);
    window.requestAnimationFrame(() => void runWorkflow());
  }, [frame, runWorkflow]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const cancel = () => stopRun();
    window.addEventListener("facetest:speech-stopped", cancel);
    return () => {
      replayCleanup.current?.();
      stopRun();
      window.removeEventListener("facetest:speech-stopped", cancel);
      document.body.style.overflow = previousOverflow;
    };
  }, [stopRun]);

  function close() {
    stopRun();
    onClose();
  }

  const workflowSlug = item.url?.split("/").filter(Boolean).at(-1);

  return (
    <section className="guided-workflow-viewer" aria-label={`${item.title} guided workflow`}>
      <header className="guided-workflow-bar">
        <div>
          <span>GUIDED WORKFLOW</span>
          <strong>{item.title}</strong>
        </div>
        <output data-complete={complete}>{error || progress}</output>
        {ready && !running && !complete && !error && (
          <button className="guided-workflow-replay" onClick={() => void runWorkflow()} type="button">
            <RotateCcw size={15} /> Run with ACE
          </button>
        )}
        <button className="guided-workflow-close" onClick={close} type="button" aria-label="Close guided workflow">
          <X size={22} />
        </button>
      </header>
      {!ready && !error && <div className="guided-workflow-loading"><span />Loading the working system</div>}
      {error && <div className="guided-workflow-error"><p>{error}</p><button onClick={close} type="button">Return to Intelligence</button></div>}
      <iframe
        allow="autoplay"
        className={ready ? "ready" : ""}
        onLoad={prepareFrame}
        ref={iframeRef}
        src={`/workflows/${workflowSlug}?newd=1`}
        title={`${item.title} interactive workflow`}
      />
    </section>
  );
}
