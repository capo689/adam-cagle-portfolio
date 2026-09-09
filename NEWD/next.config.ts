import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const workflows = [
      "proving-ground",
      "field-kit",
      "conversion-forge",
      "answer-field",
      "switchboard",
      "synthetic-audience-lab",
      "crit",
      "reading-room",
      "canon",
      "backlot",
      "migration_new",
    ];
    return {
      beforeFiles: [
        {source: "/workflows/:workflow", destination: "https://adamcagle.com/:workflow"},
        {source: "/workflows/:workflow/:path*", destination: "https://adamcagle.com/:workflow/:path*"},
        {source: "/guided-tools/:path*", destination: "https://adamcagle.com/guided-tools/:path*"},
        ...workflows.map((workflow) => ({
          source: `/${workflow}/:path*`,
          destination: `https://adamcagle.com/${workflow}/:path*`,
        })),
      ],
    };
  },
};

export default nextConfig;
