import html
import json
import re
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "assets" / "data" / "products.js"
OUT = ROOT / "products"
SITE = "https://www.solamedicalsupply.com"
MARKER = '<meta name="generator" content="SOLA catalogue sync">'


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def field(block: str, key: str) -> str:
    match = re.search(rf"\b{key}:\s*'((?:\\'|[^'])*)'", block)
    return match.group(1).replace("\\'", "'") if match else ""


def products():
    source = CATALOGUE.read_text(encoding="utf-8")
    result = []
    for block in re.findall(r"\{[^{}]*\}", source):
        name = field(block, "name")
        if not name:
            continue
        result.append({key: field(block, key) for key in ("name", "category", "brand", "origin", "tag", "image")})
    return result


def page(product):
    name = html.escape(product["name"])
    category = html.escape(product["category"])
    brand = html.escape(product["brand"] or product["name"])
    origin = html.escape(product["origin"] or "International")
    image = "../" + html.escape(product["image"], quote=True)
    slug = slugify(product["name"])
    url = f"{SITE}/products/{slug}"
    description = f"Wholesale sourcing information for {name} by {brand}. Request availability, pricing and worldwide shipping details from SOLA Medical Supply."
    wa_text = quote(f"Hello SOLA Medical Supply, please quote {product['name']}. My destination country and quantity are:")
    schema = json.dumps({
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product["name"],
        "brand": {"@type": "Brand", "name": product["brand"] or product["name"]},
        "category": product["category"],
        "image": f"{SITE}/{product['image']}",
        "url": url,
        "description": re.sub(r"<[^>]+>", "", description),
    }, ensure_ascii=False)
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name} Wholesale | SOLA Medical Supply</title>
<meta name="description" content="{html.escape(re.sub(r'<[^>]+>', '', description), quote=True)}">
<link rel="canonical" href="{url}">{MARKER}
<meta property="og:type" content="product"><meta property="og:title" content="{name} Wholesale | SOLA Medical Supply">
<meta property="og:image" content="{SITE}/{html.escape(product['image'], quote=True)}">
<link rel="icon" href="../assets/icons/logo.png"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet"><link rel="stylesheet" href="../assets/css/style.css">
<script type="application/ld+json">{schema}</script></head>
<body class="article-page"><main>
<header class="article-hero"><div class="wrap article-wrap"><span>{category.upper()} · WHOLESALE</span><h1>{name}</h1><p>{description}</p><div class="article-meta"><a href="../index.html">Home</a> › <a href="../products.html">Products</a> › {name}</div></div></header>
<div class="article-cover wrap"><img src="{image}" alt="{name}" loading="eager"></div>
<article class="article-body article-wrap"><p class="article-intro">{name} is listed in SOLA Medical Supply's professional wholesale catalogue. Availability, packaging and shipping options are confirmed for each request.</p>
<h2>Wholesale product information</h2><p>Professional buyers can request current availability and wholesale pricing for {name}. Please include the destination country and required quantity so the SOLA team can confirm suitable shipping and handling options.</p>
<div class="article-callout"><b>Product at a glance</b><ul><li><strong>Brand:</strong> {brand}</li><li><strong>Origin:</strong> {origin}</li><li><strong>Category:</strong> {category}</li></ul></div>
<h2>Request a quotation</h2><p>Product specifications and availability may vary by market. SOLA confirms the current offer directly before payment.</p>
<div class="article-end"><h2>Request a wholesale quote for {name}</h2><p>Send your destination country and quantity for current availability and shipping options.</p><a class="btn primary" href="https://wa.me/84981778670?text={wa_text}">Request quotation on WhatsApp →</a></div>
<p class="disclaimer">For professional buyers only. Product availability varies by market. This page does not provide medical advice.</p></article></main>
<script src="../assets/js/main.js"></script></body></html>'''


def main():
    OUT.mkdir(exist_ok=True)
    items = products()
    expected = {slugify(item["name"]): item for item in items}
    created = updated = 0
    for slug, item in expected.items():
        target = OUT / f"{slug}.html"
        if target.exists() and MARKER not in target.read_text(encoding="utf-8", errors="ignore"):
            continue
        existed = target.exists()
        target.write_text(page(item), encoding="utf-8")
        updated += int(existed)
        created += int(not existed)
    print(f"Catalogue pages ready: {len(expected)} total, {created} created, {updated} refreshed.")


if __name__ == "__main__":
    main()
