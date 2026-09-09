import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/copywriting.html", destination: "/copy", permanent: true },
      { source: "/technical-writing.html", destination: "/copy", permanent: true },
      { source: "/managing-director.html", destination: "/brand", permanent: true },
      { source: "/creative-direction.html", destination: "/brand", permanent: true },
      { source: "/creative-writing.html", destination: "/fun", permanent: true },
      { source: "/ux-ui.html", destination: "/ai", permanent: true },
      { source: "/ai-systems.html", destination: "/ai", permanent: true },
      { source: "/ai-systems_new.html", destination: "/ai", permanent: true },
      { source: "/ai-enablement.html", destination: "/ai", permanent: true },
      { source: "/mobile/resume.html", destination: "/resume", permanent: true },
      { source: "/mobile/copywriting.html", destination: "/copy", permanent: true },
      { source: "/mobile/managing-director.html", destination: "/brand", permanent: true },
      { source: "/mobile/creative-direction.html", destination: "/brand", permanent: true },
      { source: "/mobile/ai-systems.html", destination: "/ai", permanent: true },
      { source: "/mobile/ai-enablement.html", destination: "/ai", permanent: true },
      { source: "/writing-samples/:path*", destination: "/fun", permanent: true },
      { source: "/wpaper/singularity-seo-white-paper-light.html", destination: "/ai/singularity", permanent: true },
      { source: "/wpaper/:path*", destination: "/ai", permanent: true },
    ];
  },
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
        {source: "/workflows/:workflow", destination: "/:workflow/index.html"},
        {source: "/workflows/:workflow/:path*", destination: "/:workflow/:path*"},
        ...workflows.map((workflow) => ({
          source: `/${workflow}`,
          destination: `/${workflow}/index.html`,
        })),
      ],
    };
  },
};

export default nextConfig;
