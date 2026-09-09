import { aiWork } from "@/content/ai-content";
import { clientLogos } from "@/content/brand-clients";
import { copyCases } from "@/content/copywriting-content";

export type SiteSection = "Home" | "AI" | "Brand" | "Copywriting" | "Fun";

export type SiteAction = {
  kind: "section" | "profile" | "copy-case" | "copy-filter" | "ai-item" | "ai-workflow" | "brand-feature" | "brand-client";
  section: SiteSection;
  target?: string;
  label: string;
  confirmation: string;
};

const aliases: Record<string, string[]> = {
  killer: ["killer network", "killer networks", "killer nic"],
  traveler: ["traveler guitar", "traveller guitar", "traveler"],
  sunset: [
    "sunset marquis",
    "the sunset marquis",
    "sunset marquis hotel",
    "sunset marquess",
    "sunset marquise",
    "sunset marquee",
    "sunset marquees",
    "sunset marques",
    "sunset market",
    "sunset markets",
    "sunset",
  ],
  figueroa: ["hotel figueroa", "figueroa hotel", "figueroa"],
  performance: ["performance marketing", "performance work"],
  clink: ["clink hostels", "clink hostel", "clink"],
  filekeepers: ["filekeepers", "file keepers"],
  navis: ["navis"],
  "singularity-seo": ["singularity seo", "singularity"],
  "conversion-forge": ["conversion forge"],
  "synthetic-audience-lab": ["synthetic audience lab", "audience lab"],
  crit: ["crit", "creative review system"],
  canon: ["canon"],
  backlot: ["backlot"],
  "proving-ground": ["proving ground"],
  "field-kit": ["field kit"],
  switchboard: ["switchboard"],
  "reading-room": ["reading room"],
  "answer-field": ["answer field"],
  "legacy-content-migrator": ["legacy content migrator", "content migrator", "migrator"],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bsun\s+set\b/g, "sunset")
    .replace(/\bsunset\s+(?:marquess|marquise|marquee|marquees|marques|market|markets)\b/g, "sunset marquis")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAlias(query: string, values: string[]) {
  return values.some((value) => ` ${query} `.includes(` ${normalize(value)} `));
}

function wantsNavigation(query: string) {
  return /\b(open|show|load|launch|run|take|go|switch|visit|view|see|pull up|bring up|walk me through)\b/.test(query);
}

function wantsWorkflow(query: string) {
  return /\b(workflow|guided|walk me through|run|launch)\b/.test(query);
}

function copyAction(query: string): SiteAction | undefined {
  const item = copyCases.find((candidate) => includesAlias(query, aliases[candidate.id] || [candidate.client]));
  if (!item) return undefined;
  return {
    kind: "copy-case",
    section: "Copywriting",
    target: item.id,
    label: item.client,
    confirmation: `Sure. I'm loading ${item.client} now.`,
  };
}

function aiAction(query: string): SiteAction | undefined {
  const item = aiWork.find((candidate) => includesAlias(query, aliases[candidate.id] || [candidate.title]));
  if (!item) return undefined;
  const guided = item.kind === "workflow" && wantsWorkflow(query);
  return {
    kind: guided ? "ai-workflow" : "ai-item",
    section: "AI",
    target: item.id,
    label: item.title,
    confirmation: guided
      ? `Absolutely. I'm launching the ${item.title} guided workflow now.`
      : `Sure. I'm loading ${item.title} now.`,
  };
}

function brandFeatureAction(query: string): SiteAction | undefined {
  if (/\bagency\s*(?:six\s*eight\s*nine|689)\b/.test(query)) {
    return { kind: "brand-feature", section: "Brand", target: "agency", label: "Agency689", confirmation: "Sure. I'm loading the Agency689 story now." };
  }
  if (includesAlias(query, aliases.figueroa) && /\b(brand|book|identity|guide)\b/.test(query)) {
    return { kind: "brand-feature", section: "Brand", target: "figueroa", label: "Hotel Figueroa", confirmation: "Sure. I'm loading the Hotel Figueroa brand work now." };
  }
  return undefined;
}

function brandClientAction(query: string): SiteAction | undefined {
  const client = clientLogos.find((candidate) => includesAlias(query, [candidate.name]));
  if (!client) return undefined;
  return {
    kind: "brand-client",
    section: "Brand",
    target: client.name,
    label: client.name,
    confirmation: `Sure. I'm taking you to ${client.name} on the Brand page now.`,
  };
}

export function resolveSiteAction(text: string): SiteAction | undefined {
  const query = normalize(text);
  if (!query) return undefined;

  const namesAnEntity = Object.values(aliases).some((values) => includesAlias(query, values))
    || clientLogos.some((client) => includesAlias(query, [client.name]));
  const asksForEntity = namesAnEntity && (
    wantsNavigation(query)
    || /^(?:tell me about|what is|whats|explain|details? (?:on|about)|more (?:on|about))\b/.test(query)
    || query.split(/\s+/).length <= 4
  );
  if (!wantsNavigation(query) && !asksForEntity) return undefined;

  const brandFeature = brandFeatureAction(query);
  if (brandFeature) return brandFeature;
  const ai = aiAction(query);
  if (ai) return ai;
  const copy = copyAction(query);
  if (copy) return copy;

  if (/\b(resume|résumé|cv|career history|work history)\b/.test(query)) {
    return { kind: "profile", section: "Home", target: "resume", label: "Adam's résumé", confirmation: "Absolutely. I'm opening Adam's résumé now." };
  }

  const filters: Array<[RegExp, string]> = [
    [/\b(hospitality|hotel|hostel|resort|casino)\b/, "Hospitality"],
    [/\b(technology|tech|software|saas|gaming)\b/, "Technology"],
    [/\b(consumer|retail)\b/, "Consumer"],
    [/\b(b2b|business to business)\b/, "B2B"],
    [/\b(performance|conversion|email|banner|paid social)\b/, "Performance"],
    [/\b(brand voice|voice system|tone)\b/, "Brand Voice"],
  ];
  const filter = filters.find(([pattern]) => pattern.test(query))?.[1];
  if (filter && /\b(work|copy|copywriting|clients?|projects?|case studies)\b/.test(query)) {
    return { kind: "copy-filter", section: "Copywriting", target: filter, label: `${filter} work`, confirmation: `Sure. I'm pulling up Adam's ${filter.toLowerCase()} work now.` };
  }

  const brandClient = brandClientAction(query);
  if (brandClient) return brandClient;

  if (/\b(fun|side projects?|donkey|physics|sulu|space invaders?|ship happens)\b/.test(query)) {
    return { kind: "section", section: "Fun", label: "Fun Stuff", confirmation: "Sure. I'm opening Fun Stuff now." };
  }
  if (/\b(copywriting|copy writer|copywriter|copy page|writing page|copy)\b/.test(query)) {
    return { kind: "section", section: "Copywriting", label: "Copywriting", confirmation: "Sure. I'm opening the Copywriting page now." };
  }
  if (/\b(artificial intelligence|ai|ai page|intelligence page|ai work|workflows?)\b/.test(query)) {
    return { kind: "section", section: "AI", label: "AI", confirmation: "Sure. I'm opening the AI page now." };
  }
  if (/\b(brand|branding)\b/.test(query)) {
    return { kind: "section", section: "Brand", label: "Brand", confirmation: "Sure. I'm opening the Brand page now." };
  }
  if (/\b(home|homepage|start)\b/.test(query)) {
    return { kind: "section", section: "Home", label: "Home", confirmation: "Sure. I'm taking you home now." };
  }
  return undefined;
}

export const siteActionCoverage = {
  sections: ["Home", "AI", "Brand", "Copywriting", "Fun"],
  copyCases: copyCases.map(({ id, client }) => ({ id, client })),
  aiItems: aiWork.map(({ id, title, kind }) => ({ id, title, guided: kind === "workflow" })),
  brandClients: clientLogos.map(({ name }) => name),
};
