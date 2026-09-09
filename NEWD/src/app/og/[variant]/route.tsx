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
  // ImageResponse may transfer the supplied buffer while rendering. Give each
  // request its own ArrayBuffer so concurrent cards never detach one another's font.
  const font = Uint8Array.from(
    await readFile(join(process.cwd(), "public", "og", "barlow-condensed-black.ttf")),
  ).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          color: "#d9ae52",
          background: "#020917",
          fontFamily: "Barlow Condensed",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: 1118,
            height: 630,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            padding: "70px 42px 58px 76px",
            background:
              "radial-gradient(circle at 92% 8%, rgba(37,140,255,.28), transparent 34%), linear-gradient(120deg, transparent 52%, rgba(8,27,56,.88) 100%)",
          }}
        >
          <div
            style={{
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
              width: "100%",
              display: "flex",
              marginTop: 40,
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
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "auto",
              color: "#eef4fa",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "0.08em",
            }}
          >
            <span>ADAMCAGLE.COM</span>
            <span>ADAMRCAGLE@GMAIL.COM</span>
          </div>
        </div>
        <div style={{ width: 10, height: 630, flexShrink: 0, display: "flex", background: "#258cff", boxShadow: "0 0 34px rgba(37,140,255,.72)" }} />
        <div style={{ width: 72, height: 630, flexShrink: 0, display: "flex", background: "#020917" }} />
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
