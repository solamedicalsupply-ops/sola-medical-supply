import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("publish_blog", ROOT / "scripts" / "publish_blog.py")
publish_blog = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = publish_blog
SPEC.loader.exec_module(publish_blog)


def article_with_words(target_words):
    headings = [
        "Key Takeaways",
        "What this guide covers",
        "What buyers should understand first",
        "Which buyers is this most relevant for?",
        "How to compare options before ordering",
        "Buyer checklist before requesting a quote",
        "FAQ",
    ]
    body = "".join(f"<h2>{heading}</h2><p>Useful buyer guidance.</p>" for heading in headings)
    missing = target_words - len(__import__("re").sub(r"<[^>]+>", " ", body).split())
    body += f"<p>{' '.join(['procurement'] * missing)}</p>"
    return {
        "title": "A complete sourcing guide",
        "meta_description": "A practical wholesale sourcing guide for professional buyers.",
        "excerpt": "A practical guide for clinics, spas, resellers and distributors preparing product comparisons, documentation questions, shipping plans and a clear wholesale quotation request.",
        "read_time": "8 min read",
        "html_body": body,
    }


class GenerateValidArticleTests(unittest.TestCase):
    def setUp(self):
        self.topic = {"title": "Buyer guide", "keyword": "buyer guide", "category": "Supplies"}

    def test_repairs_the_existing_short_draft(self):
        short = article_with_words(750)
        repaired = article_with_words(950)
        with patch.object(publish_blog, "generate", return_value=short), patch.object(
            publish_blog, "repair_article", return_value=repaired
        ) as repair:
            result = publish_blog.generate_valid_article(self.topic)
        self.assertIs(result, repaired)
        repair.assert_called_once_with(self.topic, short, "Article too short: 750 words")

    def test_uses_structurally_valid_floor_after_repairs(self):
        short = article_with_words(750)
        with patch.object(publish_blog, "generate", return_value=short), patch.object(
            publish_blog, "repair_article", return_value=short
        ):
            result = publish_blog.generate_valid_article(self.topic)
        self.assertEqual(publish_blog.article_word_count(result), 750)

    def test_rejects_draft_below_publishable_floor(self):
        too_short = article_with_words(699)
        with patch.object(publish_blog, "generate", return_value=too_short), patch.object(
            publish_blog, "repair_article", return_value=too_short
        ):
            with self.assertRaisesRegex(RuntimeError, "Article generation failed after 3 attempts"):
                publish_blog.generate_valid_article(self.topic)


class RealImageTests(unittest.TestCase):
    def test_empty_commons_query_returns_no_results(self):
        response = MagicMock()
        response.__enter__.return_value.read.return_value = b'{"query": null}'
        with patch.object(publish_blog.urllib.request, "urlopen", return_value=response):
            self.assertEqual(publish_blog.search_commons("no results"), [])

    def test_ignores_empty_commons_page(self):
        self.assertIsNone(publish_blog.commons_candidate(None, set()))
        self.assertIsNone(publish_blog.commons_candidate({"imageinfo": [None]}, set()))

    def test_accepts_full_resolution_public_domain_image(self):
        page = {
            "title": "File:Medical supplies.jpg",
            "imageinfo": [{
                "url": "https://upload.wikimedia.org/example/medical-supplies.jpg",
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Medical_supplies.jpg",
                "width": 2400,
                "height": 1600,
                "size": 2_000_000,
                "mime": "image/jpeg",
                "extmetadata": {
                    "LicenseShortName": {"value": "Public domain"},
                    "Artist": {"value": "Example photographer"},
                },
            }],
        }
        result = publish_blog.commons_candidate(page, set())
        self.assertEqual(result["width"], 2400)
        self.assertEqual(result["original_url"], page["imageinfo"][0]["url"])

    def test_rejects_thumbnail_sized_image(self):
        page = {
            "title": "File:Small image.jpg",
            "imageinfo": [{
                "url": "https://upload.wikimedia.org/example/small.jpg",
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Small_image.jpg",
                "width": 900,
                "height": 700,
                "size": 500_000,
                "mime": "image/jpeg",
                "extmetadata": {"LicenseShortName": {"value": "CC0"}},
            }],
        }
        self.assertIsNone(publish_blog.commons_candidate(page, set()))

    def test_accepts_attributable_creative_commons_license(self):
        page = {
            "title": "File:Licensed image.jpg",
            "imageinfo": [{
                "url": "https://upload.wikimedia.org/example/licensed.jpg",
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Licensed_image.jpg",
                "width": 2400,
                "height": 1600,
                "size": 2_000_000,
                "mime": "image/jpeg",
                "extmetadata": {
                    "LicenseShortName": {"value": "CC BY-SA 4.0"},
                    "LicenseUrl": {"value": "https://creativecommons.org/licenses/by-sa/4.0/"},
                },
            }],
        }
        result = publish_blog.commons_candidate(page, set())
        self.assertEqual(result["license"], "CC BY-SA 4.0")
        self.assertIn("creativecommons.org", result["license_url"])

    def test_rejects_unlicensed_image(self):
        page = {
            "title": "File:Unlicensed image.jpg",
            "imageinfo": [{
                "url": "https://upload.wikimedia.org/example/unlicensed.jpg",
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Unlicensed_image.jpg",
                "width": 2400,
                "height": 1600,
                "size": 2_000_000,
                "mime": "image/jpeg",
                "extmetadata": {"LicenseShortName": {"value": "All rights reserved"}},
            }],
        }
        self.assertIsNone(publish_blog.commons_candidate(page, set()))

    def test_handles_null_metadata_fields(self):
        page = {
            "title": "File:Incomplete metadata.jpg",
            "imageinfo": [{
                "url": "https://upload.wikimedia.org/example/incomplete.jpg",
                "descriptionurl": "https://commons.wikimedia.org/wiki/File:Incomplete_metadata.jpg",
                "width": 2400,
                "height": 1600,
                "size": 2_000_000,
                "mime": "image/jpeg",
                "extmetadata": {"LicenseShortName": None, "Artist": None},
            }],
        }
        self.assertIsNone(publish_blog.commons_candidate(page, set()))


if __name__ == "__main__":
    unittest.main()
