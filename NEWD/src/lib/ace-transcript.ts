export function showAceNarration(context: string, text: string) {
  const narration = text.trim();
  if (!narration) return;
  window.dispatchEvent(new CustomEvent("facetest:narration-transcript", {
    detail: { context, text: narration },
  }));
}
