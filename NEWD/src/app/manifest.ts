import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Adam R. Cagle Portfolio",
    short_name: "Adam Cagle",
    description: "AI systems, brand leadership, and copywriting by Adam R. Cagle.",
    start_url: "/",
    display: "standalone",
    background_color: "#041729",
    theme_color: "#0b3d66",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
