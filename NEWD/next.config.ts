import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        {
          key: "Content-Security-Policy",
          value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; media-src 'self' blob:; frame-src 'self'; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
        },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
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
