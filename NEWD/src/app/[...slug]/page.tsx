import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidedPortfolio } from "@/components/guided-portfolio";
import { aiWork } from "@/content/ai-content";
import { copyCases } from "@/content/copywriting-content";

type Props = { params: Promise<{ slug: string[] }> };

function isValidRoute(slug: string[]) {
  const [section, id, mode, ...rest] = slug;
  if (rest.length) return false;
  if (["fun", "resume"].includes(section)) return slug.length === 1;
  if (section === "brand") return slug.length === 1 || (slug.length === 2 && ["agency", "figueroa"].includes(id));
  if (section === "copy") return slug.length === 1 || (slug.length === 2 && copyCases.some((item) => item.id === id));
  if (section === "ai") {
    const item = aiWork.find((candidate) => candidate.id === id);
    if (slug.length === 1) return true;
    if (!item) return false;
    return slug.length === 2 || (slug.length === 3 && mode === "workflow" && item.kind === "workflow");
  }
  return false;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidRoute(slug)) return {};
  const [section, id] = slug;
  const ai = section === "ai" && id ? aiWork.find((item) => item.id === id) : undefined;
  const copy = section === "copy" && id ? copyCases.find((item) => item.id === id) : undefined;
  const titles: Record<string, string> = {
    ai: "Applied AI Systems",
    brand: "Brand Strategy and Leadership",
    copy: "Copywriting",
    fun: "Fun Stuff",
    resume: "Résumé",
  };
  const brandTitle = section === "brand" && id === "agency" ? "Agency Six Eight Nine" : section === "brand" && id === "figueroa" ? "Hotel Figueroa" : undefined;
  const title = ai?.title || copy?.client || brandTitle || titles[section] || "Portfolio";
  const description = ai?.summary || copy?.overview || `Explore Adam Cagle's ${title.toLowerCase()} work.`;
  return {
    title,
    description,
    alternates: { canonical: `/${slug.join("/")}` },
    openGraph: { title, description, url: `/${slug.join("/")}` },
  };
}

export default async function PortfolioRoute({ params }: Props) {
  const { slug } = await params;
  if (!isValidRoute(slug)) notFound();
  return <GuidedPortfolio />;
}
