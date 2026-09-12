from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "og" / "cards"
FONT_FILE = ROOT / "public" / "og" / "barlow-condensed-black.ttf"
CARDS = {
    "main": ("AI SYSTEMS / BRAND / COPY", ["ADAM R. CAGLE"], 122),
    "ai": ("ADAM R. CAGLE", ["APPLIED AI SYSTEMS"], 112),
    "brand": ("ADAM R. CAGLE", ["BRAND STRATEGY &", "LEADERSHIP"], 92),
    "copy": ("ADAM R. CAGLE", ["COPYWRITING THAT", "EARNS ITS KEEP"], 94),
    "fun": ("ADAM R. CAGLE", ["CURIOUS BUILDS"], 122),
    "resume": ("ADAM R. CAGLE", ["RESUME"], 122),
}


def tracking(draw, position, text, font, fill, spacing):
    x, y = position
    for character in text:
        draw.text((x, y), character, font=font, fill=fill)
        left, top, right, bottom = draw.textbbox((0, 0), character, font=font)
        x += right - left + spacing


def build_card(name, eyebrow, lines, size):
    image = Image.new("RGB", (1200, 630), "#020917")
    blue = Image.new("RGBA", image.size, (0, 0, 0, 0))
    blue_draw = ImageDraw.Draw(blue)
    blue_draw.ellipse((690, -300, 1320, 330), fill=(18, 55, 105, 190))
    blue = blue.filter(ImageFilter.GaussianBlur(105))
    image = Image.alpha_composite(image.convert("RGBA"), blue)
    draw = ImageDraw.Draw(image)

    eyebrow_font = ImageFont.truetype(str(FONT_FILE), 28)
    footer_font = ImageFont.truetype(str(FONT_FILE), 24)
    title_font = ImageFont.truetype(str(FONT_FILE), size)
    tracking(draw, (76, 72), eyebrow, eyebrow_font, "#75bdff", 4)

    title_layer = Image.new("RGBA", image.size, (0, 0, 0, 0))
    title_draw = ImageDraw.Draw(title_layer)
    line_height = round(size * .88)
    for index, line in enumerate(lines):
        title_draw.text((76, 140 + index * line_height), line, font=title_font, fill="#d9ae52", stroke_width=0)
    glow_mask = title_layer.getchannel("A").filter(ImageFilter.GaussianBlur(13))
    glow = Image.new("RGBA", image.size, (37, 140, 255, 0))
    glow.putalpha(glow_mask.point(lambda value: round(value * .34)))
    image = Image.alpha_composite(image, glow)
    image = Image.alpha_composite(image, title_layer)
    draw = ImageDraw.Draw(image)

    tracking(draw, (76, 536), "ADAMCAGLE.COM", footer_font, "#eef4fa", 2)
    tracking(draw, (803, 536), "ADAMRCAGLE@GMAIL.COM", footer_font, "#eef4fa", 1)
    draw.rectangle((1118, 0, 1127, 629), fill="#258cff")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Standard non-interlaced PNGs render consistently in social preview fetchers.
    image.convert("RGB").save(OUTPUT / f"{name}.png", format="PNG", compress_level=9)


for card_name, card in CARDS.items():
    build_card(card_name, *card)

print(f"Generated {len(CARDS)} deterministic OG cards.")
