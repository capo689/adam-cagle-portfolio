import {ADAM_KNOWLEDGE} from "./_facetest-knowledge.generated.mjs";

const STOP_WORDS = new Set("a an and are as at be been but by can did do does for from had has have he her him his how i if in into is it its me my of on or our she that the their them they this to was we were what when where which who why will with you your".split(" "));

function terms(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
}

const FAQ_SOURCE = "FACETEST/knowledge/public/14_frequently_asked_questions.md";
const EXPRESSION_MAP = {thoughtful: "thinking", excited: "delighted"};

function normalizeQuestion(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(?:please|could|can|would|you|tell|me|about|just)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FAQS = ADAM_KNOWLEDGE.flatMap((record) => {
  if (record.source !== FAQ_SOURCE) return [];
  const match = record.text.match(/^\d+\.\s*(.+?)\s+\*\*Short answer:\*\*\s*(.+?)\s+\*\*Detailed answer:\*\*[\s\S]*?\*\*Expression suggestion:\*\*\s*([a-z]+)/i);
  if (!match) return [];
  return [{
    id: record.id,
    question: normalizeQuestion(match[1]),
    answer: match[2].trim(),
    expression: EXPRESSION_MAP[match[3].toLowerCase()] || match[3].toLowerCase()
  }];
});

export function findAdamFaqAnswer(query) {
  const normalized = normalizeQuestion(query);
  if (normalized.length < 4) return undefined;
  const exact = FAQS.find((faq) => faq.question === normalized);
  const contained = exact || FAQS.find((faq) =>
    faq.question.length >= 12 && (normalized.includes(faq.question) || faq.question.includes(normalized))
  );
  if (!contained) return undefined;
  const delighted = new Set(["proud", "delighted", "playful"]);
  const prefix = delighted.has(contained.expression) ? "Heck yes—" : "";
  return `[[face:${contained.expression}:0.68]]${prefix}${contained.answer}`;
}

function score(record, queryTerms) {
  const title = record.title.toLowerCase();
  const metadata = String(record.search || "").toLowerCase();
  const body = record.text.toLowerCase();
  let value = 0;
  for (const term of queryTerms) {
    if (title.includes(term)) value += 5;
    if (metadata.includes(term)) value += 3;
    const matches = body.match(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g"));
    value += Math.min(4, matches?.length || 0);
  }
  if (/adam|cagle|creator|portfolio/.test(queryTerms.join(" ")) && /adam|cagle/.test(body)) value += 2;
  return value;
}

export function retrieveAdamKnowledge(query, {limit = 3, maxCharacters = 2200} = {}) {
  const allTerms = [...new Set(terms(query))];
  const specificTerms = allTerms.filter((term) => term !== "adam" && term !== "cagle");
  const queryTerms = specificTerms.length ? specificTerms : allTerms;
  if (!queryTerms.length) return [];
  const ranked = ADAM_KNOWLEDGE
    .map((record) => ({record, score: score(record, queryTerms)}))
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
  const selected = [];
  const sourceCounts = new Map();
  let characters = 0;
  for (const {record} of ranked) {
    if (selected.length >= limit) break;
    if ((sourceCounts.get(record.source) || 0) >= 2) continue;
    if (characters + record.text.length > maxCharacters) continue;
    selected.push(record);
    sourceCounts.set(record.source, (sourceCounts.get(record.source) || 0) + 1);
    characters += record.text.length;
  }
  return selected;
}

export function formatAdamContext(records) {
  if (!records.length) return "No relevant reviewed Adam Cagle records were retrieved. Do not guess or invent personal facts.";
  return records.map((record, index) => `[Adam source ${index + 1}: ${record.title}]\n${record.text}`).join("\n\n");
}
