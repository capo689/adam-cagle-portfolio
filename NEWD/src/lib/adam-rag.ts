import { ADAM_KNOWLEDGE } from "@/content/adam-knowledge.generated";

type KnowledgeRecord = {
  id: string;
  title: string;
  source: string;
  search?: string;
  text: string;
};

const records = ADAM_KNOWLEDGE as KnowledgeRecord[];
const stopWords = new Set(
  "a an and are as at be been but by can did do does for from had has have he her him his how i if in into is it its me my of on or our she that the their them they this to was we were what when where which who why will with you your".split(" "),
);

function terms(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term));
}

function score(record: KnowledgeRecord, queryTerms: string[]) {
  const title = record.title.toLowerCase();
  const metadata = String(record.search || "").toLowerCase();
  const body = record.text.toLowerCase();
  let value = 0;
  for (const term of queryTerms) {
    if (title.includes(term)) value += 5;
    if (metadata.includes(term)) value += 3;
    const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value += Math.min(4, body.match(new RegExp(`\\b${safeTerm}\\b`, "g"))?.length || 0);
  }
  return value;
}

export function retrieveAdamKnowledge(query: string, limit = 3, maxCharacters = 2200) {
  const allTerms = [...new Set(terms(query))];
  const specificTerms = allTerms.filter((term) => term !== "adam" && term !== "cagle");
  const queryTerms = specificTerms.length ? specificTerms : allTerms;
  if (!queryTerms.length) return [];

  const ranked = records
    .map((record) => ({ record, score: score(record, queryTerms) }))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));

  const selected: KnowledgeRecord[] = [];
  const sourceCounts = new Map<string, number>();
  let characters = 0;
  for (const { record } of ranked) {
    if (selected.length >= limit) break;
    if ((sourceCounts.get(record.source) || 0) >= 2) continue;
    if (characters + record.text.length > maxCharacters) continue;
    selected.push(record);
    sourceCounts.set(record.source, (sourceCounts.get(record.source) || 0) + 1);
    characters += record.text.length;
  }
  return selected;
}

export function formatAdamContext(recordsToFormat: KnowledgeRecord[]) {
  if (!recordsToFormat.length) {
    return "No relevant reviewed Adam Cagle records were retrieved. Do not guess or invent personal facts.";
  }
  return recordsToFormat
    .map((record, index) => `[Adam source ${index + 1}: ${record.title}]\n${record.text}`)
    .join("\n\n");
}
