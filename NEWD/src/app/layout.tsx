import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://adamcagle.com"),
  title: {
    default: "Adam R. Cagle | AI, Brand and Copy",
    template: "%s | Adam R. Cagle",
  },
  description:
    "Meet Adam Cagle through an intelligent, voice-guided portfolio spanning AI systems, brand leadership, and copywriting.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: "/",
    title: "Adam R. Cagle | AI, Brand and Copy",
    description: "Agency founder, copywriter, brand leader, and hands-on applied AI systems builder.",
    images: [{ url: "/brand/agency689-site-frame.jpeg", width: 1536, height: 864, alt: "Agency689 generative AI film created by Adam Cagle" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adam R. Cagle | AI, Brand and Copy",
    description: "Agency founder, copywriter, brand leader, and hands-on applied AI systems builder.",
    images: ["/brand/agency689-site-frame.jpeg"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const profile = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Adam R. Cagle",
    url: "https://adamcagle.com",
    jobTitle: "Co-Founder, Managing Director, Lead Copywriter and AI Systems Builder",
    worksFor: { "@type": "Organization", name: "Agency689" },
    sameAs: ["https://www.linkedin.com/in/adamcagle/", "https://github.com/capo689"],
    knowsAbout: ["Applied AI", "Copywriting", "Brand strategy", "Creative direction", "AI workflows", "MCP", "Retrieval-augmented generation"],
  };
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
