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

export function retrieveAdamKnowledge(query, {limit = 5, maxCharacters = 3600} = {}) {
  const allTerms = [...new Set(terms(query))];
  const specificTerms = allTerms.filter((term) => term !== "adam" && term !== "cagle");
  const queryTerms = specificTerms.length ? specificTerms : allTerms;
  if (!queryTerms.length) return [];
  const ranked = ADAM_KNOWLEDGE
    .map((record) => ({record, score: score(record, queryTerms)}))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id));
  const selected = [];
  let characters = 0;
  for (const {record} of ranked) {
    if (selected.length >= limit || characters + record.text.length > maxCharacters) break;
    selected.push(record);
    characters += record.text.length;
  }
  return selected;
}

export function formatAdamContext(records) {
  if (!records.length) return "No relevant reviewed Adam Cagle records were retrieved. Do not guess or invent personal facts.";
  return records.map((record, index) => `[Adam source ${index + 1}: ${record.title}]\n${record.text}`).join("\n\n");
}
