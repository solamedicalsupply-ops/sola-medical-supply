import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "admin-products-export.json"
CATALOGUE = ROOT / "assets" / "data" / "products.js"

CATEGORY_MAP = {
    "DERMAL FILLER": "Dermal Fillers",
    "MESO / SKIN BOOSTER": "Meso / Skin Boosters",
    "BOTULINUM TOXIN": "Botulinum Toxin",
    "FAT DISSOLVING / WEIGHT LOSS": "Fat Dissolving / Weight Loss",
    "IV WHITENING DRIP": "IV Whitening Drip",
    "IV INFUSION / VITAMINS": "IV Infusion / Vitamins",
    "COLLAGEN STIMULATOR / BIOSTIMULATOR": "Collagen Stimulator / Biostimulator",
    "TOPICAL ANAESTHETIC": "Topical Anaesthetic",
    "INJECTABLE LOCAL ANAESTHETIC": "Injectable Local Anaesthetic",
    "ACCESSORIES & CONSUMABLES": "Accessories & Consumables",
    "HAIR BOOSTER / SCALP BOOSTER": "Hair Booster / Scalp Booster",
}

TAG_MAP = {
    "Dermal Fillers": "Dermal Filler",
    "Meso / Skin Boosters": "Skin Booster",
    "Botulinum Toxin": "Botulinum Toxin",
    "Fat Dissolving / Weight Loss": "Weight Management",
    "IV Whitening Drip": "Whitening Drip",
    "IV Infusion / Vitamins": "IV Wellness",
    "Collagen Stimulator / Biostimulator": "Biostimulator",
    "Topical Anaesthetic": "Topical Anaesthetic",
    "Injectable Local Anaesthetic": "Local Anaesthetic",
    "Accessories & Consumables": "Professional Supply",
    "Hair Booster / Scalp Booster": "Hair Booster",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", value)


def identity(value: str) -> str:
    return unicodedata.normalize("NFKC", value).strip().casefold()


def js_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def field(block: str, key: str) -> str:
    match = re.search(rf"\b{key}:\s*'((?:\\'|[^'])*)'", block)
    return match.group(1).replace("\\'", "'") if match else ""


source = json.loads(SOURCE.read_text(encoding="utf-8"))
old_catalogue = CATALOGUE.read_text(encoding="utf-8")
old_products = {}
for block in re.findall(r"\{[^{}]*\}", old_catalogue):
    name = field(block, "name")
    if name and identity(name) not in old_products:
        old_products[identity(name)] = {
            "image": field(block, "image"),
            "detail": "detail: false" not in block,
        }

products = []
seen = set()
for item in source:
    name = item.get("name", "").strip()
    key = identity(name)
    if not name or key in seen:
        continue
    admin_category = item.get("category", "").strip().upper()
    if admin_category not in CATEGORY_MAP:
        raise ValueError(f"Unmapped admin category: {admin_category or '(blank)'}")
    category = CATEGORY_MAP[admin_category]
    previous = old_products.get(key, {})
    image = previous.get("image") or "assets/icons/logo.png"
    products.append({
        "name": name,
        "category": category,
        "brand": item.get("brand", "").strip() or name,
        "origin": item.get("origin", "").strip(),
        "tag": TAG_MAP[category],
        "image": image,
    })
    seen.add(key)

lines = [
    "// Generated from data/admin-products-export.json by scripts/sync_admin_products.py.",
    "// SOLA Admin is the canonical source for names, categories, brands and origins.",
    "window.SOLA_PRODUCTS = [",
]
for product in products:
    fields = ", ".join(
        f"{key}: '{js_string(product[key])}'"
        for key in ("name", "category", "brand", "origin", "tag", "image")
    )
    lines.append(f"  {{ {fields} }},")
lines.append("];")
CATALOGUE.write_text("\n".join(lines) + "\n", encoding="utf-8")

category_counts = {}
for product in products:
    category_counts[product["category"]] = category_counts.get(product["category"], 0) + 1
print(f"Synced {len(products)} unique admin products across {len(category_counts)} categories.")
for category, count in sorted(category_counts.items()):
    print(f"- {category}: {count}")
