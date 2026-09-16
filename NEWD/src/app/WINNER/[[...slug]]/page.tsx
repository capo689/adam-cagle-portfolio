import type { Metadata } from "next";
import { GuidedPortfolio } from "@/WINNER/components/guided-portfolio";

export const metadata: Metadata = {
  title: { absolute: "Adam R. Cagle | AI, Brand and Copy" },
  description: "Meet Adam Cagle through an intelligent, voice-guided portfolio spanning AI systems, brand leadership, and copywriting.",
  alternates: { canonical: "https://adamcagle.com" },
  robots: { index: false, follow: false },
};

export default function Winner() {
  return <GuidedPortfolio />;
}
