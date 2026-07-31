import re
import unicodedata
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "assets" / "data" / "products.js"
TEMPLATE = ROOT / "assets" / "images" / "generated" / "product-card-template.png"
OUTPUT = ROOT / "assets" / "images" / "generated" / "products"
LOGO = ROOT / "assets" / "icons" / "logoNgang.png"
FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")

INK = "#3f3740"
BURGUNDY = "#9e2145"
ROSE = "#b84a68"
MUTED = "#6e6168"


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def field(block: str, key: str) -> str:
    match = re.search(rf"\b{key}:\s*'((?:\\'|[^'])*)'", block)
    return match.group(1).replace("\\'", "'") if match else ""


def fit_font(draw, text, max_width, start_size, min_size=25):
    for size in range(start_size, min_size - 1, -2):
        font = ImageFont.truetype(str(FONT_BOLD), size)
        if draw.textbbox((0, 0), text, font=font)[2] <= max_width:
            return font
    return ImageFont.truetype(str(FONT_BOLD), min_size)


def wrap(draw, text, font, max_width, max_lines=3):
    words = text.split()
    lines = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    if len(lines) > max_lines:
        lines = lines[:max_lines]
        while draw.textbbox((0, 0), lines[-1] + "…", font=font)[2] > max_width and lines[-1]:
            lines[-1] = lines[-1][:-1]
        lines[-1] += "…"
    return lines


def draw_info(draw, y, label, value):
    label_font = ImageFont.truetype(str(FONT_BOLD), 22)
    value_font = fit_font(draw, value, 480, 25, 19)
    draw.ellipse((55, y - 4, 105, y + 46), outline="#efb4c4", width=2, fill="#fff8fa")
    draw.ellipse((75, y + 14, 85, y + 24), fill=ROSE)
    draw.text((130, y), label.upper(), font=label_font, fill=ROSE)
    value_lines = wrap(draw, value or "Confirm with SOLA", value_font, 455, 2)
    for index, line in enumerate(value_lines):
        draw.text((130, y + 32 + index * 28), line, font=value_font, fill=INK)


def make_card(product, target):
    image = Image.open(TEMPLATE).convert("RGB").resize((1024, 1024), Image.Resampling.LANCZOS)
    draw = ImageDraw.Draw(image)
    if LOGO.exists():
        logo = Image.open(LOGO).convert("RGBA")
        logo.thumbnail((245, 105), Image.Resampling.LANCZOS)
        image.paste(logo, (48, 42), logo)
    else:
        draw.text((55, 58), "SOLA", font=ImageFont.truetype(str(FONT_BOLD), 52), fill=BURGUNDY)

    name_font = ImageFont.truetype(str(FONT_BOLD), 55)
    name_lines = wrap(draw, product["name"].upper(), name_font, 520, 3)
    y = 160
    for line in name_lines:
        draw.text((52, y), line, font=name_font, fill=BURGUNDY)
        y += 62
    brand_font = fit_font(draw, f"by {product['brand']}", 510, 29, 21)
    draw.text((55, y + 2), f"by {product['brand']}", font=brand_font, fill=INK)
    draw.line((55, y + 50, 510, y + 50), fill="#e8a3b7", width=2)

    start = max(y + 85, 390)
    draw_info(draw, start, "Category", product["category"])
    draw_info(draw, start + 118, "Brand", product["brand"])
    draw_info(draw, start + 236, "Origin", product["origin"] or "International")

    badge_title = ImageFont.truetype(str(FONT_BOLD), 16)
    badge_note = ImageFont.truetype(str(FONT_REGULAR), 14)
    badges = [
        (130, "PRODUCT INFORMATION", "Confirmed on request"),
        (458, "WHOLESALE SUPPLY", "For professionals"),
        (785, "WORLDWIDE SHIPPING", "Fast & reliable"),
    ]
    for x, title, note in badges:
        draw.text((x, 890), title, font=badge_title, fill=INK)
        draw.text((x, 916), note, font=badge_note, fill=MUTED)
    draw.text((330, 978), "S O L A   M E D I C A L   S U P P L Y", font=ImageFont.truetype(str(FONT_BOLD), 17), fill="white")

    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, "WEBP", quality=88, method=6)


def main():
    catalogue = CATALOGUE.read_text(encoding="utf-8")
    blocks = re.findall(r"\{[^{}]*\}", catalogue)
    replacements = {}
    made = 0
    for block in blocks:
        if field(block, "image") != "assets/icons/logo.png":
            continue
        product = {key: field(block, key) for key in ("name", "category", "brand", "origin")}
        slug = slugify(product["name"])
        relative = f"assets/images/generated/products/{slug}.webp"
        make_card(product, ROOT / relative)
        replacements[block] = block.replace("image: 'assets/icons/logo.png'", f"image: '{relative}'")
        made += 1
    for old, new in replacements.items():
        catalogue = catalogue.replace(old, new, 1)
    CATALOGUE.write_text(catalogue, encoding="utf-8")
    print(f"Created {made} product information images and updated the catalogue.")


if __name__ == "__main__":
    main()
