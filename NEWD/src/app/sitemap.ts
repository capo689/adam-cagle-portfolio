import type { MetadataRoute } from "next";
import { aiWork } from "@/content/ai-content";
import { copyCases } from "@/content/copywriting-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://adamcagle.com";
  const staticPages = ["", "/ai", "/brand", "/copy", "/fun", "/resume"];
  const detailPages = [
    ...aiWork.map((item) => `/ai/${item.id}`),
    ...copyCases.map((item) => `/copy/${item.id}`),
  ];
  return [...staticPages, ...detailPages].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date("2026-09-09"),
    changeFrequency: path ? "monthly" : "weekly",
    priority: path ? 0.8 : 1,
  }));
}
