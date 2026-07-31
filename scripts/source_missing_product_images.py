"""Find and download candidate packshots for generated SOLA product cards.

Candidates and their source pages are recorded for review before publishing.
"""

import json
import html
import re
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
PRODUCTS_JS = ROOT / "assets/data/products.js"
SOURCE_DIR = ROOT / "assets/images/product-sources-auto"
MANIFEST = ROOT / "assets/data/product-image-candidates.json"
SKIP = {"youthfill-fine", "curenex-lipo"}
BLOCKED_DOMAINS = {"pinterest.com", "pinimg.com", "facebook.com", "instagram.com", "tiktok.com"}


def slugify(value: str) -> str:
    value = value.lower().replace("×", "x").replace("—", "-")
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-")


def products() -> list[dict]:
    text = PRODUCTS_JS.read_text(encoding="utf-8")
    pattern = re.compile(
        r"\{ name: '([^']+)', category: '([^']+)', brand: '([^']+)', origin: '([^']+)', tag: '([^']+)', image: '([^']+)' \}"
    )
    rows = []
    for name, category, brand, origin, tag, image in pattern.findall(text):
        if "/generated/products/" not in image:
            continue
        slug = Path(image).stem
        if slug not in SKIP:
            rows.append({"name": name, "brand": brand, "category": category, "slug": slug})
    return rows


def image_results(session: requests.Session, query: str) -> list[dict]:
    headers = {"User-Agent": "Mozilla/5.0", "Accept-Language": "en-US,en;q=0.8"}
    page = session.get(
        "https://www.bing.com/images/search", params={"q": query, "form": "HDRSC3"}, headers=headers, timeout=25
    ).text
    results = []
    for raw in re.findall(r'm="(\{[^>]+?\})"', page):
        try:
            item = json.loads(html.unescape(raw))
            results.append({
                "title": item.get("t", ""), "url": item.get("purl", ""), "image": item.get("murl", ""),
                "width": item.get("md", {}).get("w", 0), "height": item.get("md", {}).get("h", 0),
            })
        except (json.JSONDecodeError, AttributeError):
            continue
    return results


def score(product: dict, result: dict) -> float:
    haystack = f"{result.get('title', '')} {result.get('url', '')} {result.get('image', '')}".lower()
    tokens = [t for t in re.findall(r"[a-z0-9]+", product["name"].lower()) if len(t) > 2]
    value = sum(3 for token in tokens if token in haystack)
    domain = urlparse(result.get("image", "")).netloc.lower()
    if any(blocked in domain for blocked in BLOCKED_DOMAINS):
        value -= 20
    if any(word in haystack for word in ("product", "box", "vial", "syringe", "ampoule", "pack")):
        value += 2
    if any(word in haystack for word in ("logo", "banner", "before after", "diagram")):
        value -= 4
    width, height = result.get("width", 0) or 0, result.get("height", 0) or 0
    if min(width, height) >= 450:
        value += 2
    return value


def download(session: requests.Session, url: str, path: Path) -> tuple[int, int] | None:
    try:
        response = session.get(url, headers={"User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com/"}, timeout=30)
        response.raise_for_status()
        path.write_bytes(response.content)
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            size = image.size
        if min(size) < 180:
            path.unlink(missing_ok=True)
            return None
        return size
    except Exception:
        path.unlink(missing_ok=True)
        return None


def main() -> None:
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    existing = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    session = requests.Session()
    rows = products()
    for index, product in enumerate(rows, 1):
        slug = product["slug"]
        if existing.get(slug, {}).get("downloaded") and (SOURCE_DIR / f"{slug}.img").exists():
            continue
        query = f'"{product["name"]}" {product["brand"]} product packaging box vial'
        entry = {**product, "query": query, "downloaded": False}
        try:
            results = sorted(image_results(session, query), key=lambda item: score(product, item), reverse=True)
            entry["candidates"] = [
                {"title": r.get("title"), "page": r.get("url"), "image": r.get("image"), "score": score(product, r)}
                for r in results[:5]
            ]
            for result in results[:10]:
                target = SOURCE_DIR / f"{slug}.img"
                dimensions = download(session, result.get("image", ""), target)
                if dimensions:
                    entry.update({
                        "downloaded": True,
                        "selectedPage": result.get("url"),
                        "selectedImage": result.get("image"),
                        "dimensions": list(dimensions),
                    })
                    break
        except Exception as exc:
            entry["error"] = str(exc)
        existing[slug] = entry
        MANIFEST.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[{index}/{len(rows)}] {slug}: {'ok' if entry['downloaded'] else 'missing'}", flush=True)
        time.sleep(0.15)


if __name__ == "__main__":
    main()
