import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

const cards = new Set(["main", "ai", "brand", "copy", "fun", "resume"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variant: string }> },
) {
  const { variant } = await params;
  const requested = variant.replace(/\.png$/i, "");
  const cardName = cards.has(requested) ? requested : "main";
  const image = await readFile(join(process.cwd(), "public", "og", "cards", `${cardName}.png`));
  return new Response(image, {
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "Content-Type": "image/png",
      "Content-Length": String(image.byteLength),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
