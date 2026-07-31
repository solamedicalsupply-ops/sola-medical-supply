import json
import re
import unicodedata
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "admin-products-export.json"
CATALOGUE = ROOT / "assets" / "data" / "products.js"

CATEGORY_MAP = {
    "DERMAL FILLER": "Dermal Fillers",
    "MESO / SKIN BOOSTER": "Skin Boosters / PN",
    "BOTULINUM TOXIN": "Toxin",
    "FAT DISSOLVING / WEIGHT LOSS": "Weight Management",
    "IV WHITENING DRIP": "Whitening IV / Wellness",
    "TOPICAL ANAESTHETIC": "Numbing / Anesthetic",
    "ACCESSORIES & CONSUMABLES": "Injection Supplies",
    "HAIR BOOSTER / SCALP BOOSTER": "Hair / Meso",
}

TAG_MAP = {
    "Dermal Fillers": "Filler",
    "Skin Boosters / PN": "Skin Booster",
    "Toxin": "Toxin",
    "Weight Management": "Available on request",
    "Whitening IV / Wellness": "Wellness",
    "Numbing / Anesthetic": "Anesthetic",
    "Injection Supplies": "Supplies",
    "Hair / Meso": "Hair Booster",
}


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "", value)


def js_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


source = json.loads(SOURCE.read_text(encoding="utf-8"))
catalogue = CATALOGUE.read_text(encoding="utf-8")
existing_names = {
    normalize(name)
    for name in re.findall(r"\bname:\s*'((?:\\'|[^'])*)'", catalogue)
}

missing = []
for product in source:
    name = product.get("name", "").strip()
    if not name or normalize(name) in existing_names:
        continue
    category = CATEGORY_MAP.get(product.get("category", "").strip().upper(), "Other Professional Products")
    missing.append(
        {
            "name": name,
            "category": category,
            "brand": product.get("brand", "").strip() or name,
            "origin": product.get("origin", "").strip(),
            "tag": TAG_MAP.get(category, "Available on request"),
        }
    )
    existing_names.add(normalize(name))

if missing:
    lines = ["", "  /* Synced from SOLA Admin — products not previously shown on the public catalogue */"]
    for product in missing:
        fields = ", ".join(
            f"{key}: '{js_string(product[key])}'"
            for key in ("name", "category", "brand", "origin", "tag")
        )
        lines.append(
            "  { " + fields + ", image: 'assets/icons/logo.png', detail: false },"
        )
    catalogue = re.sub(r"\n\];\s*$", "\n" + "\n".join(lines) + "\n\n];\n", catalogue)
    CATALOGUE.write_text(catalogue, encoding="utf-8")

print(f"Added {len(missing)} products; catalogue now contains {len(existing_names)} unique names.")
