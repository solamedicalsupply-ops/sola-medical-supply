import json
import re
from pathlib import Path

import publish_blog


ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "blog"
QUEUE = ROOT / "data" / "blog_queue.json"
IMAGE_DIR = ROOT / "assets" / "images" / "blog"
TEXT_EXTENSIONS = {".html", ".json", ".js", ".css", ".md", ".py", ".yml", ".yaml"}


def replace_data_images(node, mapping):
    if isinstance(node, list):
        return [replace_data_images(item, mapping) for item in node]
    if not isinstance(node, dict):
        if isinstance(node, str):
            for old, optimized in mapping.items():
                node = node.replace(old, optimized["src"])
        return node
    original_src = node.get("src")
    result = {key: replace_data_images(value, mapping) for key, value in node.items()}
    if original_src in mapping:
        optimized = mapping[original_src]
        result.update({
            "src": optimized["src"],
            "mobile_src": optimized["mobile_src"],
            "display_width": optimized["display_width"],
            "display_height": optimized["display_height"],
            "mobile_width": optimized["mobile_width"],
            "mobile_height": optimized["mobile_height"],
        })
    return result


def responsive_html(source, optimized):
    pattern = re.compile(rf'<img\s+src="{re.escape(source)}"([^>]*)>', re.I)

    def replacement(match):
        remainder = match.group(1)
        for attribute in ("srcset", "sizes", "width", "height", "decoding"):
            remainder = re.sub(rf'\s+{attribute}="[^"]*"', "", remainder, flags=re.I)
        return (
            f'<img src="{optimized["src"]}" '
            f'srcset="{optimized["mobile_src"]} {optimized["mobile_width"]}w, '
            f'{optimized["src"]} {optimized["display_width"]}w" '
            f'sizes="(max-width: 700px) 100vw, 820px" '
            f'width="{optimized["display_width"]}" height="{optimized["display_height"]}"'
            f'{remainder} decoding="async">'
        )

    return pattern, replacement


def optimize_existing_images():
    originals = sorted(
        path for path in IMAGE_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )
    stems = [path.stem for path in originals]
    if len(stems) != len(set(stems)):
        raise RuntimeError("Duplicate blog image stems would overwrite optimized files")

    mapping = {}
    for index, path in enumerate(originals, 1):
        optimized = publish_blog.save_responsive_webp(path.read_bytes(), path.stem)
        mapping[f"../assets/images/blog/{path.name}"] = optimized
        print(f"Optimized {index}/{len(originals)}: {path.name}")

    for target in sorted(BLOG.glob("*.html")):
        source = target.read_text(encoding="utf-8")
        updated = source
        for old, optimized in mapping.items():
            pattern, replacement = responsive_html(old, optimized)
            updated = pattern.sub(replacement, updated)
        updated = re.sub(
            r'(<div class="article-cover wrap"><img\b[^>]*?)\sloading="lazy"([^>]*></div>)',
            r'\1 fetchpriority="high"\2',
            updated,
            flags=re.I,
        )
        if updated != source:
            target.write_text(updated, encoding="utf-8")

    data = json.loads(QUEUE.read_text(encoding="utf-8"))
    data = replace_data_images(data, mapping)
    QUEUE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    old_names = {path.name for path in originals}
    remaining = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS or ".git" in path.parts:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        hits = sorted(name for name in old_names if f"assets/images/blog/{name}" in text)
        if hits: remaining.append((path, hits))
    if remaining:
        details = "; ".join(f"{path.relative_to(ROOT)}: {', '.join(hits)}" for path, hits in remaining[:10])
        raise RuntimeError(f"Refusing to remove referenced originals: {details}")

    for path in originals:
        path.unlink()
    print(f"Optimized and replaced {len(originals)} blog images.")


if __name__ == "__main__":
    optimize_existing_images()
