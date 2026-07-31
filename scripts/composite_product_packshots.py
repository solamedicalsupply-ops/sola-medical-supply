"""Composite verified, transparent product packshots onto SOLA product cards."""

from pathlib import Path
from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "assets/images/generated/products"
CUTOUTS = ROOT / "assets/images/product-cutouts"

# Keep the product inside the right-hand presentation area and above the badges.
PLACEMENTS = {
    "youthfill-fine": (535, 245, 955, 745),
    "curenex-lipo": (500, 300, 980, 710),
}


def fit_packshot(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[Image.Image, int, int]:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if not bounds:
        raise ValueError("Packshot has no visible pixels")
    image = image.crop(bounds)
    x1, y1, x2, y2 = box
    max_w, max_h = x2 - x1, y2 - y1
    scale = min(max_w / image.width, max_h / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)
    return image, x1 + (max_w - size[0]) // 2, y1 + (max_h - size[1]) // 2


def composite(slug: str, box: tuple[int, int, int, int]) -> None:
    card_path = GENERATED / f"{slug}.webp"
    cutout_path = CUTOUTS / f"{slug}.png"
    card = Image.open(card_path).convert("RGBA")
    packshot = Image.open(cutout_path).convert("RGBA")
    packshot, x, y = fit_packshot(packshot, box)

    shadow_alpha = packshot.getchannel("A").filter(ImageFilter.GaussianBlur(12))
    shadow = Image.new("RGBA", packshot.size, (94, 49, 69, 0))
    shadow.putalpha(shadow_alpha.point(lambda a: round(a * 0.20)))
    card.alpha_composite(shadow, (x + 8, y + 12))
    card.alpha_composite(packshot, (x, y))
    card.convert("RGB").save(card_path, "WEBP", quality=94, method=6)
    print(f"Updated {card_path.relative_to(ROOT)}")


if __name__ == "__main__":
    for product_slug, placement in PLACEMENTS.items():
        composite(product_slug, placement)
