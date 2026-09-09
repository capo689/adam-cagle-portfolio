"use client";

import { useEffect, useState } from "react";

type FacePhase = "consent" | "forming" | "arrival" | "dissolving" | "reforming" | "docked" | "site";

export function FaceStage({ phase, paused }: { phase: FacePhase; paused: boolean }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    import("@/lib/facetest-face.js")
      .then(() => {
        window.FACE?.setLook("original");
        window.dispatchEvent(new Event("resize"));
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    window.FACE?.setLook("original");
    if (phase === "arrival") window.FACE?.perform("warm", 0.72, 8);
    if (phase === "reforming") {
      const timer = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
      return () => window.clearTimeout(timer);
    }
    if (phase === "docked") window.FACE?.perform("attentive", 0.5, 4);
  }, [phase]);

  useEffect(() => {
    window.FACE?.setState("idle");
  }, [paused]);

  return (
    <div className="face-stage" aria-label="Adam's voice guide">
      <div id="stage" />
      <p className="face-fallback" id="fallback">
        {failed ? "The face could not load." : "WebGL is required to display the face."}
      </p>
    </div>
  );
}
