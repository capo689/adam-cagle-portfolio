export function normalizeSpeechText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function splitLongSentence(sentence: string, maxLength: number) {
  const words = sentence.split(" ");
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    current = word;
  }

  if (current) chunks.push(current);
  return chunks;
}

export function splitSpeechText(text: string, maxLength = 520) {
  const normalized = normalizeSpeechText(text);
  if (!normalized) return [];
  if (normalized.length <= maxLength) return [normalized];

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+[\"')\]]*|$)/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) || [normalized];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences.flatMap((value) => value.length > maxLength ? splitLongSentence(value, maxLength) : [value])) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }
    if (current) chunks.push(current);
    current = sentence;
  }

  if (current) chunks.push(current);
  return chunks;
}
