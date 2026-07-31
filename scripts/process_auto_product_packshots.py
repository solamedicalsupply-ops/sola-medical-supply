"""Remove backgrounds and composite all sourced packshots onto SOLA cards."""

from pathlib import Path
from PIL import Image, ImageFilter
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "assets/images/product-sources-auto"
CUTOUTS = ROOT / "assets/images/product-cutouts-auto"
CARDS = ROOT / "assets/images/generated/products"
APPROVED_SLUGS = {
    "at-filler", "belotero-hydro-revive", "cannula-23g", "cannula-needle-23g",
    "cannula-needle-25g", "cannula-needle-27g", "cannula-needle-30g", "collagen",
    "diabetic-needles", "glutaone-inj-1200mg", "glutathione-tad-600",
    "glutax-80000000", "huons-lidocaine-epineprin-inj", "juvederm-expiry-2026",
    "juvederm-super-mau-moi-voluma-ultra3-ultra4", "luthione-1200mg", "mesocartin",
    "rejuran-tone-up", "remedium-pdrn", "restylane-super", "saxenda-3-pens",
    "tirzepatide-bioaminolabs-10mg", "tirzepatide-bioaminolabs-30mg", "tktx",
    "traminex", "vom", "vs-collagen-nad", "vs-vitathione-nad", "yvoire",
    "zinc-s-inj", "zishel-xomage-pur33",
}


def fit(image, box):
    bounds = image.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("empty cutout")
    image = image.crop(bounds)
    x1, y1, x2, y2 = box
    scale = min((x2 - x1) / image.width, (y2 - y1) / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)
    return image, x1 + (x2 - x1 - size[0]) // 2, y1 + (y2 - y1 - size[1]) // 2


def main():
    CUTOUTS.mkdir(parents=True, exist_ok=True)
    session = new_session("u2net")
    files = sorted(path for path in SOURCES.glob("*.img") if path.stem in APPROVED_SLUGS)
    for index, source in enumerate(files, 1):
        slug = source.stem
        card_path = CARDS / f"{slug}.webp"
        if not card_path.exists():
            continue
        cutout_path = CUTOUTS / f"{slug}.png"
        if cutout_path.exists():
            cutout = Image.open(cutout_path).convert("RGBA")
        else:
            original = Image.open(source).convert("RGB")
            original.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
            cutout = remove(original, session=session, alpha_matting=False).convert("RGBA")
            cutout.save(cutout_path, optimize=True)
        card = Image.open(card_path).convert("RGBA")
        packshot, x, y = fit(cutout, (520, 250, 975, 745))
        alpha = packshot.getchannel("A").filter(ImageFilter.GaussianBlur(10))
        shadow = Image.new("RGBA", packshot.size, (90, 50, 70, 0))
        shadow.putalpha(alpha.point(lambda a: round(a * .18)))
        card.alpha_composite(shadow, (x + 7, y + 11))
        card.alpha_composite(packshot, (x, y))
        card.convert("RGB").save(card_path, "WEBP", quality=93, method=6)
        print(f"[{index}/{len(files)}] {slug}", flush=True)


if __name__ == "__main__":
    main()
