import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

const cards = {
  main: { eyebrow: "AI SYSTEMS / BRAND / COPY", title: "ADAM R. CAGLE" },
  ai: { eyebrow: "ADAM R. CAGLE", title: "APPLIED AI SYSTEMS" },
  brand: { eyebrow: "ADAM R. CAGLE", title: "BRAND STRATEGY & LEADERSHIP" },
  copy: { eyebrow: "ADAM R. CAGLE", title: "COPYWRITING THAT EARNS ITS KEEP" },
  fun: { eyebrow: "ADAM R. CAGLE", title: "CURIOUS BUILDS" },
  resume: { eyebrow: "ADAM R. CAGLE", title: "RESUME" },
} as const;

type CardName = keyof typeof cards;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const card = cards[variant as CardName] || cards.main;
  const font = await readFile(join(process.cwd(), "public", "og", "barlow-condensed-black.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          color: "#d9ae52",
          background: "#020917",
          fontFamily: "Barlow Condensed",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 92% 8%, rgba(37,140,255,.28), transparent 34%), linear-gradient(120deg, transparent 52%, rgba(8,27,56,.88) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 72,
            width: 10,
            height: 630,
            display: "flex",
            background: "#258cff",
            boxShadow: "0 0 34px rgba(37,140,255,.72)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 76,
            display: "flex",
            color: "#75bdff",
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "0.16em",
          }}
        >
          {card.eyebrow}
        </div>
        <div
          style={{
            position: "absolute",
            top: 138,
            right: 126,
            left: 76,
            display: "flex",
            color: "#d9ae52",
            fontSize: variant === "copy" ? 72 : card.title.length > 28 ? 92 : 122,
            fontWeight: 900,
            letterSpacing: "-0.025em",
            lineHeight: 0.86,
            textTransform: "uppercase",
            textShadow: "0 0 28px rgba(37,140,255,.2)",
          }}
        >
          {card.title}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 58,
            left: 76,
            display: "flex",
            color: "#eef4fa",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          ADAMCAGLE.COM
        </div>
        <div
          style={{
            position: "absolute",
            right: 122,
            bottom: 58,
            display: "flex",
            color: "#eef4fa",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "0.08em",
          }}
        >
          ADAMRCAGLE@GMAIL.COM
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [{ name: "Barlow Condensed", data: font, weight: 900, style: "normal" }],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
    },
  );
}
